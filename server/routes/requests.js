const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken, authorizeRoles, normalizeRole } = require('../middleware/auth');

// GET requests list (filtered by role or parameters)
router.get('/', authenticateToken, (req, res) => {
  try {
    const { status, donation_id } = req.query;
    const user = req.user;
    const userRole = normalizeRole(user.role);

    let query = `
      SELECT 
        r.*,
        d.food_name,
        d.category as food_category,
        d.food_type,
        d.quantity as total_donation_quantity,
        d.quantity_unit,
        d.image_url as food_image,
        d.safe_deadline,
        d.storage_condition,
        d.safety_status,
        d.pickup_address as donation_pickup_address,
        d.lat as donation_lat,
        d.lng as donation_lng,
        u_donor.lat as donor_user_lat,
        u_donor.lng as donor_user_lng,
        u_receiver.lat as receiver_user_lat,
        u_receiver.lng as receiver_user_lng,
        u_donor.name as donor_name,
        u_donor.phone as donor_phone,
        u_donor.email as donor_email,
        u_donor.organization_type as donor_org,
        u_receiver.name as receiver_name,
        u_receiver.organization_type as receiver_org,
        u_receiver.phone as receiver_phone,
        u_receiver.email as receiver_email,
        (SELECT rating FROM ratings_feedback WHERE donation_id = d.id AND receiver_id = r.receiver_id) as feedback_rating,
        (SELECT comment FROM ratings_feedback WHERE donation_id = d.id AND receiver_id = r.receiver_id) as feedback_comment
      FROM food_requests r
      JOIN food_donations d ON r.donation_id = d.id
      JOIN users u_donor ON d.donor_id = u_donor.id
      JOIN users u_receiver ON r.receiver_id = u_receiver.id
      WHERE 1=1
    `;

    const params = [];

    // Role-based visibility
    if (userRole === 'recipient') {
      query += ` AND r.receiver_id = ?`;
      params.push(user.id);
    } else if (userRole === 'donor') {
      query += ` AND d.donor_id = ?`;
      params.push(user.id);
    } // admin sees all

    if (status && status !== 'all') {
      query += ` AND r.status = ?`;
      params.push(status);
    }

    if (donation_id) {
      query += ` AND r.donation_id = ?`;
      params.push(parseInt(donation_id));
    }

    query += ` ORDER BY r.id DESC`;

    const requests = db.prepare(query).all(...params);
    res.json(requests);
  } catch (err) {
    console.error('Fetch requests error:', err);
    res.status(500).json({ error: 'Failed to retrieve food requests' });
  }
});

// SUBMIT new food request (Recipient or Admin)
router.post('/', authenticateToken, authorizeRoles('recipient', 'admin'), (req, res) => {
  try {
    const {
      donation_id,
      requested_quantity,
      beneficiaries_count,
      organization_name,
      pickup_location,
      required_pickup_time,
      special_requirements,
      urgency_level
    } = req.body;

    if (!donation_id || !requested_quantity || !beneficiaries_count) {
      return res.status(400).json({ error: 'Donation ID, requested quantity, and beneficiaries count are required.' });
    }

    // Verify donation exists and is available
    const donation = db.prepare(`
      SELECT d.*, u.id as donor_id, u.name as donor_name 
      FROM food_donations d 
      JOIN users u ON d.donor_id = u.id 
      WHERE d.id = ?
    `).get(donation_id);

    if (!donation) {
      return res.status(404).json({ error: 'Food donation not found' });
    }

    if (donation.status === 'Expired') {
      return res.status(400).json({ error: 'This food donation has expired and cannot be requested.' });
    }

    if (donation.status === 'Completed' || donation.status === 'Cancelled') {
      return res.status(400).json({ error: `This food donation is already marked as ${donation.status}.` });
    }

    // Check if recipient already has an active request for this donation
    const existingReq = db.prepare(`
      SELECT id FROM food_requests 
      WHERE donation_id = ? AND receiver_id = ? AND status IN ('Pending', 'Accepted', 'Ready for Pickup')
    `).get(donation_id, req.user.id);

    if (existingReq) {
      return res.status(400).json({ error: 'You already have an active request for this donation.' });
    }

    const receiverUser = db.prepare('SELECT name, organization_type, address FROM users WHERE id = ?').get(req.user.id);

    const result = db.prepare(`
      INSERT INTO food_requests (
        donation_id, receiver_id, requested_quantity, beneficiaries_count,
        organization_name, pickup_location, required_pickup_time, special_requirements,
        urgency_level, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
    `).run(
      donation_id,
      req.user.id,
      parseFloat(requested_quantity),
      parseInt(beneficiaries_count),
      organization_name || receiverUser?.name || 'Recipient Organization',
      pickup_location || donation.pickup_address,
      required_pickup_time || new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      special_requirements || '',
      urgency_level || 'Normal'
    );

    const requestId = result.lastInsertRowid;

    // Notify donor
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, related_donation_id, related_request_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      donation.donor_id,
      'New Food Request Received!',
      `${receiverUser?.name || 'A recipient'} requested ${requested_quantity} ${donation.quantity_unit} for ${beneficiaries_count} beneficiaries. Review and accept now!`,
      'request_received',
      donation.id,
      requestId
    );

    // Notify recipient confirmation
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, related_donation_id, related_request_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      'Request Submitted Successfully',
      `Your request for "${donation.food_name}" has been forwarded to ${donation.donor_name}. Awaiting donor confirmation.`,
      'request_submitted',
      donation.id,
      requestId
    );

    const created = db.prepare('SELECT * FROM food_requests WHERE id = ?').get(requestId);

    res.status(201).json({
      message: 'Food request submitted successfully!',
      request: created
    });
  } catch (err) {
    console.error('Submit request error:', err);
    res.status(500).json({ error: 'Failed to submit food request' });
  }
});

// UPDATE request status (Lifecycle management)
router.put('/:id/status', authenticateToken, (req, res) => {
  try {
    const { status, donor_notes } = req.body;
    const allowedStatuses = ['Pending', 'Accepted', 'Ready for Pickup', 'Picked Up', 'Completed', 'Rejected'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` });
    }

    const request = db.prepare(`
      SELECT r.*, d.donor_id, d.food_name, d.quantity_unit, u_donor.name as donor_name, u_recv.name as receiver_name
      FROM food_requests r
      JOIN food_donations d ON r.donation_id = d.id
      JOIN users u_donor ON d.donor_id = u_donor.id
      JOIN users u_recv ON r.receiver_id = u_recv.id
      WHERE r.id = ?
    `).get(req.params.id);

    if (!request) {
      return res.status(404).json({ error: 'Food request not found' });
    }

    const isDonor = parseInt(req.user.id) === parseInt(request.donor_id);
    const isReceiver = parseInt(req.user.id) === parseInt(request.receiver_id);
    const isAdmin = normalizeRole(req.user.role) === 'admin';

    if (!isDonor && !isReceiver && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized to change status of this request' });
    }

    db.prepare(`
      UPDATE food_requests
      SET status = ?,
          donor_notes = COALESCE(?, donor_notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, donor_notes, req.params.id);

    // Sync donation status based on request status
    if (status === 'Accepted' || status === 'Ready for Pickup' || status === 'Picked Up') {
      db.prepare(`UPDATE food_donations SET status = ? WHERE id = ?`).run(status, request.donation_id);
    } else if (status === 'Completed') {
      db.prepare(`UPDATE food_donations SET status = 'Completed' WHERE id = ?`).run(request.donation_id);
    } else if (status === 'Rejected') {
      const otherAccepted = db.prepare(`
        SELECT COUNT(*) as c FROM food_requests WHERE donation_id = ? AND status IN ('Accepted', 'Ready for Pickup', 'Picked Up', 'Completed')
      `).get(request.donation_id).c;

      if (otherAccepted === 0) {
        db.prepare(`UPDATE food_donations SET status = 'Available' WHERE id = ?`).run(request.donation_id);
      }
    }

    // Automated Notifications for each status change
    if (status === 'Accepted') {
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, related_donation_id, related_request_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        request.receiver_id,
        'Donation Request Accepted!',
        `Great news! ${request.donor_name} accepted your request for "${request.food_name}". Prepare for collection!`,
        'request_accepted',
        request.donation_id,
        request.id
      );
    } else if (status === 'Ready for Pickup') {
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, related_donation_id, related_request_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        request.receiver_id,
        'Food Ready for Pickup!',
        `Your requested food "${request.food_name}" is packaged and ready at the pickup location.`,
        'pickup_reminder',
        request.donation_id,
        request.id
      );
    } else if (status === 'Completed') {
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, related_donation_id, related_request_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        request.receiver_id,
        'Donation Completed - Please Share Feedback',
        `Food rescue of "${request.food_name}" is complete! Please rate ${request.donor_name} to celebrate their contribution.`,
        'donation_completed',
        request.donation_id,
        request.id
      );

      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, related_donation_id, related_request_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        request.donor_id,
        'Mission Accomplished! Food Rescued',
        `Successful delivery to ${request.receiver_name}! You prevented food waste and fed ${request.beneficiaries_count} people today.`,
        'donation_completed',
        request.donation_id,
        request.id
      );
    } else if (status === 'Rejected') {
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, related_donation_id, related_request_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        request.receiver_id,
        'Food Request Declined',
        `Your request for "${request.food_name}" could not be accepted at this time. Donor note: ${donor_notes || 'Allocated to another requirement.'}`,
        'request_rejected',
        request.donation_id,
        request.id
      );
    }

    const updated = db.prepare('SELECT * FROM food_requests WHERE id = ?').get(req.params.id);

    res.json({
      message: `Request status updated to "${status}"`,
      request: updated
    });
  } catch (err) {
    console.error('Update request status error:', err);
    res.status(500).json({ error: 'Failed to update request status' });
  }
});

module.exports = router;
