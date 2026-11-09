const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { verifyFoodSafety, calculateDistanceKm } = require('../aiEngine');
const { geocodeAddress } = require('../geocoder');

// Helper to auto-update expired items
function checkAndExpireDonations() {
  const nowIso = new Date().toISOString();
  db.prepare(`
    UPDATE food_donations
    SET status = 'Expired',
        safety_status = 'Expired / Unsafe'
    WHERE status = 'Available' AND safe_deadline < ?
  `).run(nowIso);
}

// Preview AI Food Safety Check (can be called before submitting form)
router.post('/preview-safety', (req, res) => {
  try {
    const { category, food_type, prep_time, safe_deadline, storage_condition } = req.body;
    if (!category || !prep_time || !safe_deadline || !storage_condition) {
      return res.status(400).json({ error: 'Category, prep time, deadline, and storage conditions are required.' });
    }

    const evaluation = verifyFoodSafety({
      category,
      food_type: food_type || 'veg',
      prep_time,
      safe_deadline,
      storage_condition
    });

    res.json(evaluation);
  } catch (err) {
    console.error('Safety evaluation error:', err);
    res.status(500).json({ error: 'Failed to evaluate food safety' });
  }
});

// GET all donations with search and multi-filtering
router.get('/', (req, res) => {
  try {
    checkAndExpireDonations();

    const {
      search,
      category,
      food_type,
      status,
      min_quantity,
      user_lat,
      user_lng,
      max_distance,
      donor_id
    } = req.query;

    let query = `
      SELECT 
        d.*,
        u.name as donor_name,
        u.organization_type as donor_org,
        u.avatar as donor_avatar,
        u.phone as donor_phone,
        u.address as donor_address,
        u.lat as donor_user_lat,
        u.lng as donor_user_lng,
        u.is_verified as donor_verified,
        (SELECT COALESCE(AVG(rating), 5.0) FROM ratings_feedback WHERE donor_id = d.donor_id) as donor_rating,
        (SELECT COUNT(*) FROM ratings_feedback WHERE donor_id = d.donor_id) as donor_reviews_count,
        (SELECT COUNT(*) FROM food_requests WHERE donation_id = d.id AND status = 'Pending') as pending_requests_count
      FROM food_donations d
      JOIN users u ON d.donor_id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (search) {
      query += ` AND (d.food_name LIKE ? OR d.description LIKE ? OR d.pickup_address LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (category && category !== 'All') {
      query += ` AND d.category = ?`;
      params.push(category);
    }

    if (food_type && food_type !== 'all') {
      query += ` AND d.food_type = ?`;
      params.push(food_type);
    }

    if (status && status !== 'all') {
      query += ` AND d.status = ?`;
      params.push(status);
    }

    if (min_quantity) {
      query += ` AND d.quantity >= ?`;
      params.push(parseFloat(min_quantity));
    }

    if (donor_id) {
      query += ` AND d.donor_id = ?`;
      params.push(parseInt(donor_id));
    }

    query += ` ORDER BY d.id DESC`;

    let donations = db.prepare(query).all(...params);

    // Calculate distance and filter by distance if requested
    const parsedUserLat = user_lat ? parseFloat(user_lat) : null;
    const parsedUserLng = user_lng ? parseFloat(user_lng) : null;

    donations = donations.map(d => {
      let distanceKm = null;
      if (parsedUserLat != null && parsedUserLng != null && d.lat != null && d.lng != null) {
        distanceKm = calculateDistanceKm(parsedUserLat, parsedUserLng, d.lat, d.lng);
      }
      return {
        ...d,
        distanceKm
      };
    });

    if (max_distance && parsedUserLat != null && parsedUserLng != null) {
      const maxD = parseFloat(max_distance);
      donations = donations.filter(d => d.distanceKm === null || d.distanceKm <= maxD);
    }

    res.json(donations);
  } catch (err) {
    console.error('Fetch donations error:', err);
    res.status(500).json({ error: 'Failed to fetch food donations' });
  }
});

// GET single donation
router.get('/:id', (req, res) => {
  try {
    checkAndExpireDonations();

    const donation = db.prepare(`
      SELECT 
        d.*,
        u.name as donor_name,
        u.organization_type as donor_org,
        u.avatar as donor_avatar,
        u.phone as donor_phone,
        u.address as donor_address,
        u.is_verified as donor_verified,
        (SELECT COALESCE(AVG(rating), 5.0) FROM ratings_feedback WHERE donor_id = d.donor_id) as donor_rating,
        (SELECT COUNT(*) FROM ratings_feedback WHERE donor_id = d.donor_id) as donor_reviews_count
      FROM food_donations d
      JOIN users u ON d.donor_id = u.id
      WHERE d.id = ?
    `).get(req.params.id);

    if (!donation) {
      return res.status(404).json({ error: 'Food donation not found' });
    }

    // Include requests for this donation
    const requests = db.prepare(`
      SELECT r.*, u.name as receiver_name, u.avatar as receiver_avatar, u.phone as receiver_phone
      FROM food_requests r
      JOIN users u ON r.receiver_id = u.id
      WHERE r.donation_id = ?
      ORDER BY r.id DESC
    `).all(donation.id);

    res.json({
      ...donation,
      requests
    });
  } catch (err) {
    console.error('Fetch donation details error:', err);
    res.status(500).json({ error: 'Failed to fetch donation details' });
  }
});

// CREATE food donation (Donor role only)
router.post('/', authenticateToken, authorizeRoles('donor', 'admin'), async (req, res) => {
  try {
    const {
      food_name,
      description,
      image_url,
      category,
      food_type,
      quantity,
      quantity_unit,
      packets_count,
      prep_time,
      safe_deadline,
      storage_condition,
      pickup_address,
      lat,
      lng,
      contact_phone
    } = req.body;

    if (!food_name || !category || !food_type || !quantity || !prep_time || !safe_deadline || !pickup_address) {
      return res.status(400).json({ error: 'Please provide all mandatory donation fields.' });
    }

    // Run AI Food Safety Verification
    const safetyCheck = verifyFoodSafety({
      category,
      food_type,
      prep_time,
      safe_deadline,
      storage_condition: storage_condition || 'Ambient / Room Temp'
    });

    if (!safetyCheck.allowRequest) {
      return res.status(400).json({
        error: 'Cannot submit donation: ' + safetyCheck.warnings.join(' ') + ' Safety policy prevents listing expired or unsafe food.'
      });
    }

    // Get donor location from profile or geocode pickup address (no hardcoded coordinates)
    const donor = db.prepare('SELECT lat, lng, phone, address FROM users WHERE id = ?').get(req.user.id);
    let donationLat = (lat !== undefined && lat !== null && lat !== '') ? parseFloat(lat) : donor?.lat;
    let donationLng = (lng !== undefined && lng !== null && lng !== '') ? parseFloat(lng) : donor?.lng;
    if (donationLat == null || isNaN(donationLat) || donationLng == null || isNaN(donationLng)) {
      const geo = await geocodeAddress(pickup_address);
      if (geo) {
        donationLat = geo.lat;
        donationLng = geo.lng;
      }
    }

    const defaultImages = {
      'Cooked Meals': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
      'Bakery & Bread': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
      'Raw Produce / Veggies': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80',
      'Packaged / Canned': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
      'Dairy & Sweets': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80',
      'Beverages': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80'
    };

    // Validate image URL or Base64 data URL if provided
    let finalImage = defaultImages[category] || defaultImages['Cooked Meals'];
    if (image_url && image_url.trim()) {
      const trimmedImg = image_url.trim();
      const isBase64 = trimmedImg.startsWith('data:image/');
      const isHttp = trimmedImg.startsWith('http://') || trimmedImg.startsWith('https://');

      if (!isBase64 && !isHttp) {
        return res.status(400).json({ error: 'Invalid image format. Please use a camera photo, uploaded image file, or valid http/https URL.' });
      }
      finalImage = trimmedImg;
    }

    const result = db.prepare(`
      INSERT INTO food_donations (
        donor_id, food_name, description, image_url, category, food_type,
        quantity, quantity_unit, packets_count, prep_time, safe_deadline,
        storage_condition, safety_status, safety_score, safety_notes,
        pickup_address, lat, lng, contact_phone, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Available')
    `).run(
      req.user.id,
      food_name.trim(),
      description || '',
      finalImage,
      category,
      food_type,
      parseFloat(quantity),
      quantity_unit || 'kg',
      parseInt(packets_count) || Math.round(parseFloat(quantity) * 2.5),
      prep_time,
      safe_deadline,
      storage_condition || 'Ambient / Room Temp',
      safetyCheck.status,
      safetyCheck.score,
      safetyCheck.recommendation,
      pickup_address,
      donationLat,
      donationLng,
      contact_phone || donor.phone || '+91 98491 00000'
    );

    const donationId = result.lastInsertRowid;

    // Send confirmation to donor
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, related_donation_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      'Food Donation Published',
      `Your donation "${food_name}" (${quantity} ${quantity_unit || 'kg'}) is now live with safety rating ${safetyCheck.score}/100. AI matching is active!`,
      'donation_created',
      donationId
    );

    // Broadcast automated notification to nearby active receivers
    const nearbyReceivers = db.prepare(`
      SELECT id, name FROM users WHERE role = 'receiver'
    `).all();

    const notifInsert = db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, related_donation_id)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const r of nearbyReceivers.slice(0, 4)) {
      notifInsert.run(
        r.id,
        'New Surplus Food Available Nearby',
        `Fresh ${food_name} (${quantity} ${quantity_unit || 'kg'}) was just posted in your area. Check and request before deadline!`,
        'nearby_food',
        donationId
      );
    }

    const created = db.prepare('SELECT * FROM food_donations WHERE id = ?').get(donationId);

    res.status(201).json({
      message: 'Donation successfully published and verified by AI!',
      donation: created,
      safetyEvaluation: safetyCheck
    });
  } catch (err) {
    console.error('Create donation error:', err);
    res.status(500).json({ error: 'Failed to create food donation listing.' });
  }
});

// UPDATE food donation
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const donation = db.prepare('SELECT * FROM food_donations WHERE id = ?').get(req.params.id);
    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    if (req.user.role !== 'admin' && donation.donor_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to edit this donation' });
    }

    const { food_name, description, quantity, packets_count, safe_deadline, storage_condition, pickup_address, status } = req.body;

    db.prepare(`
      UPDATE food_donations
      SET food_name = COALESCE(?, food_name),
          description = COALESCE(?, description),
          quantity = COALESCE(?, quantity),
          packets_count = COALESCE(?, packets_count),
          safe_deadline = COALESCE(?, safe_deadline),
          storage_condition = COALESCE(?, storage_condition),
          pickup_address = COALESCE(?, pickup_address),
          status = COALESCE(?, status)
      WHERE id = ?
    `).run(
      food_name,
      description,
      quantity ? parseFloat(quantity) : null,
      packets_count ? parseInt(packets_count) : null,
      safe_deadline,
      storage_condition,
      pickup_address,
      status,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM food_donations WHERE id = ?').get(req.params.id);
    res.json({ message: 'Donation updated successfully', donation: updated });
  } catch (err) {
    console.error('Update donation error:', err);
    res.status(500).json({ error: 'Failed to update donation' });
  }
});

// DELETE / Cancel donation (Donor who created it or Admin)
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const donation = db.prepare('SELECT * FROM food_donations WHERE id = ?').get(req.params.id);
    if (!donation) {
      return res.status(404).json({ error: 'Food donation not found' });
    }

    if (req.user.role !== 'admin' && donation.donor_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: Only the donor who posted this listing or an admin can delete it.' });
    }

    // Identify any recipients who have already requested this food
    const affectedRequests = db.prepare(`
      SELECT r.id, r.receiver_id, r.requested_quantity, u.name as receiver_name
      FROM food_requests r
      JOIN users u ON r.receiver_id = u.id
      WHERE r.donation_id = ?
    `).all(donation.id);

    // Notify all affected recipients immediately
    const notifInsert = db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, related_donation_id)
      VALUES (?, ?, ?, 'donation_cancelled', ?)
    `);

    for (const reqItem of affectedRequests) {
      notifInsert.run(
        reqItem.receiver_id,
        'Food Donation Cancelled by Donor',
        `The food listing "${donation.food_name}" (${donation.quantity} ${donation.quantity_unit}) was cancelled and removed by the donor. Your request has been closed.`,
        donation.id
      );
    }

    // Delete requests and then delete the donation
    db.prepare('DELETE FROM food_requests WHERE donation_id = ?').run(donation.id);
    db.prepare('DELETE FROM food_donations WHERE id = ?').run(donation.id);

    console.log(`[Donation Deletion] Donor ${req.user.id} deleted donation #${donation.id} ("${donation.food_name}"). Notified ${affectedRequests.length} affected recipient(s).`);

    res.json({
      message: 'Food donation listing successfully removed from active availability.',
      deletedId: donation.id,
      notifiedRecipientsCount: affectedRequests.length
    });
  } catch (err) {
    console.error('Delete donation error:', err);
    res.status(500).json({ error: 'Failed to delete donation' });
  }
});

module.exports = router;

