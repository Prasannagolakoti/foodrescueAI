const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { JWT_SECRET, authenticateToken, normalizeRole } = require('../middleware/auth');
const { geocodeAddress } = require('../geocoder');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, organization_type, phone, address, lat, lng, bio } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required.' });
    }

    const normRole = normalizeRole(role);
    if (!['donor', 'recipient', 'admin'].includes(normRole)) {
      return res.status(400).json({ error: 'Role must be Donor, Recipient, or Admin.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    let userLat = (lat != null && lat !== '') ? parseFloat(lat) : null;
    let userLng = (lng != null && lng !== '') ? parseFloat(lng) : null;

    if (userLat == null || userLng == null) {
      const geo = await geocodeAddress(address);
      if (geo) {
        userLat = geo.lat;
        userLng = geo.lng;
      }
    }

    const result = db.prepare(`
      INSERT INTO users (name, email, password, role, organization_type, phone, address, lat, lng, is_verified, avatar, bio)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      email.toLowerCase().trim(),
      hash,
      normRole,
      organization_type || (normRole === 'donor' ? 'Food Donor' : normRole === 'recipient' ? 'Recipient Organization' : 'System Administration'),
      phone || '',
      address || '',
      userLat,
      userLng,
      1, // Verified by default for actual registered users
      normRole === 'donor'
        ? 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80'
        : normRole === 'recipient'
        ? 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=200&q=80'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      bio || ''
    );

    const user = db.prepare('SELECT id, name, email, role, organization_type, phone, address, lat, lng, is_verified, avatar, bio FROM users WHERE id = ?').get(result.lastInsertRowid);

    // Welcome Notification
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `).run(
      user.id,
      'Welcome to Food Rescue Agent!',
      `Your account has been created successfully as a ${user.role}.`,
      'system'
    );

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to register account.' });
  }
});

// Login
router.post('/login', (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const match = bcrypt.compareSync(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Role check if role was selected on login
    if (role) {
      const selectedNorm = normalizeRole(role);
      const userNorm = normalizeRole(user.role);
      if (selectedNorm !== userNorm) {
        const friendlySelected = selectedNorm.charAt(0).toUpperCase() + selectedNorm.slice(1);
        const friendlyActual = userNorm.charAt(0).toUpperCase() + userNorm.slice(1);
        return res.status(401).json({
          error: `This account is registered as a ${friendlyActual}. Please select the ${friendlyActual} role tab to sign in.`
        });
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userSafe } = user;

    res.json({
      message: 'Login successful',
      token,
      user: userSafe
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Authentication failed.' });
  }
});

// Get current profile + dynamic stats
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, name, email, role, organization_type, phone, address, lat, lng, is_verified, avatar, bio, created_at
      FROM users WHERE id = ?
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let stats = {};
    const normRole = normalizeRole(user.role);

    if (normRole === 'donor') {
      const donationStats = db.prepare(`
        SELECT 
          COUNT(*) as total_donations,
          COALESCE(SUM(quantity), 0) as total_kg_donated,
          COALESCE(SUM(packets_count), 0) as total_packets_donated,
          COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_donations,
          COUNT(CASE WHEN status = 'Available' THEN 1 END) as active_donations
        FROM food_donations WHERE donor_id = ?
      `).get(user.id);

      const ratingStats = db.prepare(`
        SELECT COALESCE(AVG(rating), 5.0) as avg_rating, COUNT(*) as review_count
        FROM ratings_feedback WHERE donor_id = ?
      `).get(user.id);

      stats = { ...donationStats, ...ratingStats };
    } else if (normRole === 'recipient') {
      const requestStats = db.prepare(`
        SELECT 
          COUNT(*) as total_requests,
          COALESCE(SUM(requested_quantity), 0) as total_kg_received,
          COALESCE(SUM(beneficiaries_count), 0) as total_beneficiaries_served,
          COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_requests,
          COUNT(CASE WHEN status IN ('Pending', 'Accepted', 'Ready for Pickup') THEN 1 END) as active_requests
        FROM food_requests WHERE receiver_id = ?
      `).get(user.id);

      stats = requestStats;
    } else if (normRole === 'admin') {
      const adminStats = db.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM users WHERE role = 'donor') as total_donors,
          (SELECT COUNT(*) FROM users WHERE role IN ('receiver', 'recipient')) as total_receivers,
          (SELECT COUNT(*) FROM food_donations) as total_listings,
          (SELECT COUNT(*) FROM reports WHERE status = 'Pending') as pending_reports
      `).get();

      stats = adminStats;
    }

    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0
    `).get(user.id).count;

    res.json({
      user,
      stats,
      unreadNotifications: unreadCount
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update Profile
router.put('/profile', authenticateToken, (req, res) => {
  try {
    const { name, phone, address, organization_type, bio, avatar, lat, lng } = req.body;

    db.prepare(`
      UPDATE users
      SET name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          address = COALESCE(?, address),
          organization_type = COALESCE(?, organization_type),
          bio = COALESCE(?, bio),
          avatar = COALESCE(?, avatar),
          lat = COALESCE(?, lat),
          lng = COALESCE(?, lng)
      WHERE id = ?
    `).run(name, phone, address, organization_type, bio, avatar, lat ? parseFloat(lat) : null, lng ? parseFloat(lng) : null, req.user.id);

    const updated = db.prepare(`
      SELECT id, name, email, role, organization_type, phone, address, lat, lng, is_verified, avatar, bio
      FROM users WHERE id = ?
    `).get(req.user.id);

    res.json({ message: 'Profile updated successfully', user: updated });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
