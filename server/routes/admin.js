const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All endpoints in this router require admin role
router.use(authenticateToken, authorizeRoles('admin'));

// GET all users with filtering by role and verification status
router.get('/users', (req, res) => {
  try {
    const { role, is_verified } = req.query;

    let query = `
      SELECT 
        u.id, u.name, u.email, u.role, u.organization_type, u.phone, u.address,
        u.is_verified, u.avatar, u.bio, u.created_at,
        (SELECT COUNT(*) FROM food_donations WHERE donor_id = u.id) as donations_count,
        (SELECT COUNT(*) FROM food_requests WHERE receiver_id = u.id) as requests_count,
        (SELECT COALESCE(AVG(rating), 5.0) FROM ratings_feedback WHERE donor_id = u.id) as rating
      FROM users u
      WHERE 1=1
    `;
    const params = [];

    if (role && role !== 'all') {
      query += ` AND u.role = ?`;
      params.push(role);
    }

    if (is_verified !== undefined && is_verified !== 'all') {
      query += ` AND u.is_verified = ?`;
      params.push(parseInt(is_verified));
    }

    query += ` ORDER BY u.id DESC`;

    const users = db.prepare(query).all(...params);
    res.json(users);
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Failed to fetch users list' });
  }
});

// Toggle verification status of donor/receiver
router.put('/users/:id/verify', (req, res) => {
  try {
    const { is_verified } = req.body;
    const targetUserId = req.params.id;

    db.prepare(`
      UPDATE users
      SET is_verified = ?
      WHERE id = ?
    `).run(is_verified ? 1 : 0, targetUserId);

    // Send notification to the user
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `).run(
      targetUserId,
      is_verified ? 'Account Officially Verified!' : 'Account Verification Status Updated',
      is_verified
        ? 'Congratulations! Central Admin has verified your organization credentials. You now have priority matching privileges!'
        : 'Your account verification status has been updated by the administration.',
      'verification_update'
    );

    res.json({
      message: `User verification updated to ${is_verified ? 'Verified' : 'Unverified'}`
    });
  } catch (err) {
    console.error('Verify user error:', err);
    res.status(500).json({ error: 'Failed to update user verification' });
  }
});

// Moderate food listing (approve, reject, force-expire, delete)
router.put('/donations/:id/status', (req, res) => {
  try {
    const { status, safety_status, safety_notes } = req.body;

    db.prepare(`
      UPDATE food_donations
      SET status = COALESCE(?, status),
          safety_status = COALESCE(?, safety_status),
          safety_notes = COALESCE(?, safety_notes)
      WHERE id = ?
    `).run(status, safety_status, safety_notes, req.params.id);

    const donation = db.prepare('SELECT * FROM food_donations WHERE id = ?').get(req.params.id);

    // Notify donor of admin action
    if (donation) {
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, related_donation_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        donation.donor_id,
        'Donation Listing Moderated',
        `Admin updated your donation "${donation.food_name}" to status: ${status}. Safety classification: ${safety_status || donation.safety_status}`,
        'system',
        donation.id
      );
    }

    res.json({ message: 'Donation listing moderated successfully', donation });
  } catch (err) {
    console.error('Admin donation moderation error:', err);
    res.status(500).json({ error: 'Failed to update donation listing' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Admin cannot delete their own active account' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ message: 'User account removed' });
  } catch (err) {
    console.error('Admin delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;

