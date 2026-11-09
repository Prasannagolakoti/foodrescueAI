const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Add rating & review (Receiver or Admin)
router.post('/', authenticateToken, authorizeRoles('receiver', 'admin'), (req, res) => {
  try {
    const { donation_id, donor_id, rating, comment } = req.body;

    if (!donation_id || !donor_id || !rating) {
      return res.status(400).json({ error: 'Donation ID, donor ID, and rating (1-5) are required.' });
    }

    const parsedRating = parseInt(rating);
    if (parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5 stars.' });
    }

    // Check if rating already exists for this donation & receiver
    const existing = db.prepare(`
      SELECT id FROM ratings_feedback WHERE donation_id = ? AND receiver_id = ?
    `).get(donation_id, req.user.id);

    if (existing) {
      db.prepare(`
        UPDATE ratings_feedback
        SET rating = ?, comment = ?, created_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(parsedRating, comment || '', existing.id);
      return res.json({ message: 'Rating updated successfully!' });
    }

    const result = db.prepare(`
      INSERT INTO ratings_feedback (donation_id, receiver_id, donor_id, rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `).run(donation_id, req.user.id, donor_id, parsedRating, comment || '');

    // Notify donor of review
    const reviewer = db.prepare('SELECT name FROM users WHERE id = ?').get(req.user.id);
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, related_donation_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      donor_id,
      'New Donor Review Received!',
      `${reviewer.name} gave you a ${parsedRating}-star rating: "${comment || 'Excellent food rescue partnership!'}"`,
      'rating_received',
      donation_id
    );

    res.status(201).json({
      message: 'Feedback and rating submitted successfully!',
      ratingId: result.lastInsertRowid
    });
  } catch (err) {
    console.error('Submit rating error:', err);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

// GET ratings for a donor
router.get('/donor/:donorId', (req, res) => {
  try {
    const reviews = db.prepare(`
      SELECT 
        rf.*,
        u.name as receiver_name,
        u.organization_type as receiver_org,
        u.avatar as receiver_avatar,
        d.food_name
      FROM ratings_feedback rf
      JOIN users u ON rf.receiver_id = u.id
      JOIN food_donations d ON rf.donation_id = d.id
      WHERE rf.donor_id = ?
      ORDER BY rf.id DESC
    `).all(req.params.donorId);

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_reviews,
        COALESCE(AVG(rating), 5.0) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_stars,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_stars,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_stars,
        COUNT(CASE WHEN rating <= 2 THEN 1 END) as low_stars
      FROM ratings_feedback
      WHERE donor_id = ?
    `).get(req.params.donorId);

    res.json({
      reviews,
      stats: {
        totalReviews: stats.total_reviews,
        averageRating: Math.round(stats.average_rating * 10) / 10,
        breakdown: {
          5: stats.five_stars,
          4: stats.four_stars,
          3: stats.three_stars,
          2: stats.low_stars
        }
      }
    });
  } catch (err) {
    console.error('Fetch ratings error:', err);
    res.status(500).json({ error: 'Failed to fetch donor ratings' });
  }
});

module.exports = router;

