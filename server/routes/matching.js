const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { calculateDistanceKm, calculateSmartMatch } = require('../aiEngine');
const { JWT_SECRET } = require('../middleware/auth');

/**
 * GET /api/matching/recommendations
 * Compares donor available food details with recipient food requirements.
 * Evaluates:
 * 1. Food name / keywords
 * 2. Food category
 * 3. Quantity vs requested quantity
 * 4. Availability (Active in database)
 * 5. Expiry time (Safe consumption window)
 * 6. Location (Real coordinates distance from database)
 */
router.get('/recommendations', (req, res) => {
  try {
    let {
      donation_id,
      receiver_id,
      food_name,
      category,
      quantity,
      max_distance,
      min_score
    } = req.query;

    // Check JWT header if receiver_id is not explicitly provided in query
    if (!receiver_id && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded && (decoded.role === 'recipient' || decoded.role === 'receiver')) {
          receiver_id = decoded.id;
        }
      } catch (e) {
        // Continue unauthenticated
      }
    }

    // Auto-update any expired donations first
    const nowIso = new Date().toISOString();
    db.prepare(`
      UPDATE food_donations
      SET status = 'Expired',
          safety_status = 'Expired / Unsafe'
      WHERE status = 'Available' AND safe_deadline < ?
    `).run(nowIso);

    // Fetch active available donations (non-expired)
    let donationsQuery = `
      SELECT 
        d.*,
        u.name as donor_name,
        u.organization_type as donor_org,
        u.phone as donor_phone,
        u.address as donor_address,
        u.lat as donor_user_lat,
        u.lng as donor_user_lng
      FROM food_donations d
      JOIN users u ON d.donor_id = u.id
      WHERE d.status = 'Available'
        AND d.safe_deadline > ?
    `;
    const donParams = [nowIso];

    if (donation_id) {
      donationsQuery += ` AND d.id = ?`;
      donParams.push(parseInt(donation_id));
    }

    if (category && category !== 'All' && category.trim()) {
      donationsQuery += ` AND d.category = ?`;
      donParams.push(category.trim());
    }

    const donations = db.prepare(donationsQuery).all(...donParams);

    // Fetch active receivers/recipients
    let receiversQuery = `
      SELECT id, name, organization_type, phone, address, lat, lng, is_verified, bio
      FROM users
      WHERE role IN ('receiver', 'recipient')
    `;
    const recParams = [];

    if (receiver_id) {
      receiversQuery += ` AND id = ?`;
      recParams.push(parseInt(receiver_id));
    }

    const receivers = db.prepare(receiversQuery).all(...recParams);

    const matches = [];

    for (const donation of donations) {
      // Use actual donor coordinates from database (food_donations.lat or users.lat)
      const donorLat = (donation.lat != null && !isNaN(donation.lat)) ? parseFloat(donation.lat) : ((donation.donor_user_lat != null && !isNaN(donation.donor_user_lat)) ? parseFloat(donation.donor_user_lat) : null);
      const donorLng = (donation.lng != null && !isNaN(donation.lng)) ? parseFloat(donation.lng) : ((donation.donor_user_lng != null && !isNaN(donation.donor_user_lng)) ? parseFloat(donation.donor_user_lng) : null);

      for (const receiver of receivers) {
        // Use actual recipient coordinates from database (users.lat)
        const recLat = (receiver.lat != null && !isNaN(receiver.lat)) ? parseFloat(receiver.lat) : null;
        const recLng = (receiver.lng != null && !isNaN(receiver.lng)) ? parseFloat(receiver.lng) : null;

        // Calculate real distance only if both coordinates exist in the database
        let distanceKm = null;
        if (donorLat != null && donorLng != null && recLat != null && recLng != null) {
          distanceKm = calculateDistanceKm(donorLat, donorLng, recLat, recLng);
        }

        // Apply max_distance filter if specified
        if (max_distance && distanceKm != null && distanceKm > parseFloat(max_distance)) {
          continue;
        }

        // Check if recipient has a past or pending request to derive their requirements if not passed in query
        const recentRequest = db.prepare(`
          SELECT requested_quantity, beneficiaries_count, special_requirements 
          FROM food_requests 
          WHERE receiver_id = ? 
          ORDER BY id DESC LIMIT 1
        `).get(receiver.id);

        const targetQty = (quantity && parseFloat(quantity) > 0)
          ? parseFloat(quantity)
          : (recentRequest && recentRequest.requested_quantity ? recentRequest.requested_quantity : (receiver.beneficiaries ? receiver.beneficiaries / 2.5 : donation.quantity));

        // Evaluate smart match based on all 6 factors
        const matchResult = calculateSmartMatch({
          donation,
          receiver: {
            ...receiver,
            beneficiaries: recentRequest ? recentRequest.beneficiaries_count : 60
          },
          distanceKm,
          requiredFoodName: food_name || (recentRequest ? recentRequest.special_requirements : ''),
          requiredCategory: category || 'All',
          requiredQuantity: targetQty
        });

        // If recipient specified a specific food name or category, enforce match
        if (food_name && food_name.trim() && matchResult.breakdown.foodNameScore === 0) {
          continue;
        }

        if (category && category !== 'All' && matchResult.breakdown.categoryScore === 0) {
          continue;
        }

        // Filter by min_score threshold
        const threshold = min_score ? parseInt(min_score) : 40;
        if (matchResult.matchPercentage < threshold) {
          continue;
        }

        matches.push({
          donationId: donation.id,
          foodName: donation.food_name,
          foodDescription: donation.description,
          foodCategory: donation.category,
          foodType: donation.food_type,
          availableQuantity: donation.quantity,
          quantityUnit: donation.quantity_unit,
          packetsCount: donation.packets_count,
          safeDeadline: donation.safe_deadline,
          hoursRemaining: matchResult.hoursRemaining,
          safetyStatus: donation.safety_status,
          safetyScore: donation.safety_score,
          imageUrl: donation.image_url,

          // Donor details from database
          donorId: donation.donor_id,
          donorName: donation.donor_name,
          donorOrg: donation.donor_org,
          donorPhone: donation.donor_phone,
          pickupAddress: donation.pickup_address,
          donorLat: donorLat,
          donorLng: donorLng,

          // Receiver details from database
          receiverId: receiver.id,
          receiverName: receiver.name,
          organizationName: receiver.organization_type || receiver.name,
          receiverAddress: receiver.address,
          receiverPhone: receiver.phone,
          receiverLat: recLat,
          receiverLng: recLng,
          isVerified: Boolean(receiver.is_verified),
          requiredQuantity: targetQty,

          // Match Results
          distanceKm: matchResult.distanceKm,
          matchPercentage: matchResult.matchPercentage,
          recommendationReason: matchResult.recommendationReason,
          breakdown: matchResult.breakdown
        });
      }
    }

    // Sort by highest match percentage first
    matches.sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.json(matches);
  } catch (err) {
    console.error('Smart match recommendation error:', err);
    res.status(500).json({ error: 'Failed to generate AI recommendations' });
  }
});

module.exports = router;
