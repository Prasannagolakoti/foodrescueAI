const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// POST a new report (e.g. food quality concern, mislabeled listing, hygiene issue)
router.post('/', authenticateToken, (req, res) => {
  try {
    const { target_type, target_id, reason, details } = req.body;

    if (!target_type || !target_id || !reason) {
      return res.status(400).json({ error: 'Target type, target ID, and reason are required.' });
    }

    const result = db.prepare(`
      INSERT INTO reports (reporter_id, target_type, target_id, reason, details, status)
      VALUES (?, ?, ?, ?, ?, 'Pending')
    `).run(req.user.id, target_type, parseInt(target_id), reason, details || '');

    // Notify admins
    const admins = db.prepare(`SELECT id FROM users WHERE role = 'admin'`).all();
    for (const a of admins) {
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (?, ?, ?, ?)
      `).run(
        a.id,
        'New Moderation Report Filed',
        `User filed a report on ${target_type} #${target_id}: "${reason}". Immediate review required.`,
        'system'
      );
    }

    res.status(201).json({
      message: 'Report submitted for administrative investigation. Thank you for maintaining food safety integrity.',
      reportId: result.lastInsertRowid
    });
  } catch (err) {
    console.error('Submit report error:', err);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

// GET all reports (Admin only)
router.get('/', authenticateToken, authorizeRoles('admin'), (req, res) => {
  try {
    const reports = db.prepare(`
      SELECT 
        rep.*,
        u.name as reporter_name,
        u.email as reporter_email,
        u.role as reporter_role
      FROM reports rep
      JOIN users u ON rep.reporter_id = u.id
      ORDER BY rep.id DESC
    `).all();

    res.json(reports);
  } catch (err) {
    console.error('Fetch reports error:', err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// UPDATE report status (Admin only)
router.put('/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  try {
    const { status, action } = req.body;

    db.prepare(`
      UPDATE reports
      SET status = ?
      WHERE id = ?
    `).run(status, req.params.id);

    res.json({ message: `Report marked as ${status}` });
  } catch (err) {
    console.error('Update report error:', err);
    res.status(500).json({ error: 'Failed to update report status' });
  }
});

module.exports = router;

