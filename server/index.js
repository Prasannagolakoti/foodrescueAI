const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb, db } = require('./db');

const authRoutes = require('./routes/auth');
const donationRoutes = require('./routes/donations');
const requestRoutes = require('./routes/requests');
const matchingRoutes = require('./routes/matching');
const analyticsRoutes = require('./routes/analytics');
const notificationRoutes = require('./routes/notifications');
const ratingRoutes = require('./routes/ratings');
const reportRoutes = require('./routes/reports');
const chatbotRoutes = require('./routes/chatbot');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database & Tables
initDb();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Background worker: Periodically checks and expires foods that crossed safe deadline
function runExpiryCheckWorker() {
  try {
    const nowIso = new Date().toISOString();
    // Find active donations that have crossed safe deadline
    const expiredListings = db.prepare(`
      SELECT id, food_name, donor_id, quantity, quantity_unit
      FROM food_donations
      WHERE status = 'Available' AND safe_deadline < ?
    `).all(nowIso);

    if (expiredListings.length > 0) {
      const updateStmt = db.prepare(`
        UPDATE food_donations
        SET status = 'Expired',
            safety_status = 'Expired / Unsafe'
        WHERE id = ?
      `);

      const notifStmt = db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, related_donation_id)
        VALUES (?, ?, ?, 'expiry_alert', ?)
      `);

      for (const item of expiredListings) {
        updateStmt.run(item.id);
        notifStmt.run(
          item.donor_id,
          'Donation Safe Deadline Expired',
          `Your food listing "${item.food_name}" (${item.quantity} ${item.quantity_unit}) passed its safe consumption deadline and has been closed for public safety.`,
          item.id
        );
      }
      console.log(`[Expiry Worker] Automatically locked ${expiredListings.length} expired donation(s).`);
    }

    // Check for approaching deadlines (< 2 hours remaining) and send proactive alerts
    const twoHoursFromNow = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
    const urgentItems = db.prepare(`
      SELECT d.id, d.food_name, d.safe_deadline, d.donor_id
      FROM food_donations d
      WHERE d.status = 'Available'
        AND d.safe_deadline > ?
        AND d.safe_deadline <= ?
        AND NOT EXISTS (
          SELECT 1 FROM notifications n 
          WHERE n.related_donation_id = d.id AND n.type = 'expiry_warning_imminent'
        )
    `).all(nowIso, twoHoursFromNow);

    for (const item of urgentItems) {
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, related_donation_id)
        VALUES (?, ?, ?, 'expiry_warning_imminent', ?)
      `).run(
        item.donor_id,
        'Urgent: Safe Consumption Deadline in <2 Hours',
        `"${item.food_name}" expires soon! Matching algorithms are giving top priority to nearby shelters.`,
        item.id
      );
    }
  } catch (err) {
    console.error('Expiry worker error:', err);
  }
}

// Run immediately on boot, then every 30 seconds
runExpiryCheckWorker();
setInterval(runExpiryCheckWorker, 30000);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    appName: 'AI-Powered Smart Food Rescue & Donation Agent',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/admin', adminRoutes);

// Serve Client Static Build if available
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    const indexPath = path.join(clientDistPath, 'index.html');
    return res.sendFile(indexPath, (err) => {
      if (err) next();
    });
  }
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal server error occurred.' });
});

const os = require('os');
const HOST = '0.0.0.0';
const ALT_PORT = 8080;

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('169.254')) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const localIp = getLocalIp();

// Start primary server on port 5000
const server5000 = app.listen(PORT, HOST, () => {
  console.log(`Food Rescue Agent running on Port ${PORT}:`);
  console.log(`  ➔ Direct IP: http://127.0.0.1:${PORT}`);
  console.log(`  ➔ Localhost: http://localhost:${PORT}`);
  console.log(`  ➔ Network:   http://${localIp}:${PORT}`);
});

// Also start secondary server on alternate Port 8080
const server8080 = app.listen(ALT_PORT, HOST, () => {
  console.log(`Food Rescue Agent running on Alternate Port ${ALT_PORT}:`);
  console.log(`  ➔ Direct IP: http://127.0.0.1:${ALT_PORT}`);
  console.log(`  ➔ Localhost: http://localhost:${ALT_PORT}`);
  console.log(`  ➔ Network:   http://${localIp}:${ALT_PORT}`);
});
