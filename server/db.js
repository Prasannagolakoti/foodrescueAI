const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'food_rescue.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('donor', 'receiver', 'recipient', 'admin')),
      organization_type TEXT,
      phone TEXT,
      address TEXT,
      lat REAL,
      lng REAL,
      is_verified INTEGER DEFAULT 1,
      avatar TEXT,
      bio TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS food_donations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      donor_id INTEGER NOT NULL,
      food_name TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      category TEXT NOT NULL,
      food_type TEXT NOT NULL CHECK(food_type IN ('veg', 'non-veg')),
      quantity REAL NOT NULL,
      quantity_unit TEXT DEFAULT 'kg',
      packets_count INTEGER DEFAULT 1,
      prep_time DATETIME NOT NULL,
      safe_deadline DATETIME NOT NULL,
      storage_condition TEXT NOT NULL,
      safety_status TEXT DEFAULT 'Safe to Consider' CHECK(safety_status IN ('Safe to Consider', 'Needs Verification', 'Expired / Unsafe')),
      safety_score INTEGER DEFAULT 95,
      safety_notes TEXT,
      pickup_address TEXT NOT NULL,
      lat REAL,
      lng REAL,
      contact_phone TEXT,
      status TEXT DEFAULT 'Available' CHECK(status IN ('Available', 'Requested', 'Accepted', 'Ready for Pickup', 'Picked Up', 'Completed', 'Cancelled', 'Expired', 'Rejected')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (donor_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS food_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      donation_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      requested_quantity REAL NOT NULL,
      beneficiaries_count INTEGER NOT NULL,
      organization_name TEXT,
      pickup_location TEXT,
      required_pickup_time DATETIME,
      special_requirements TEXT,
      urgency_level TEXT DEFAULT 'Normal' CHECK(urgency_level IN ('Low', 'Normal', 'Urgent', 'Critical')),
      status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Accepted', 'Ready for Pickup', 'Picked Up', 'Completed', 'Rejected')),
      donor_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (donation_id) REFERENCES food_donations(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      related_donation_id INTEGER,
      related_request_id INTEGER,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ratings_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      donation_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      donor_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (donation_id) REFERENCES food_donations(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (donor_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_id INTEGER NOT NULL,
      target_type TEXT NOT NULL CHECK(target_type IN ('donation', 'user')),
      target_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      details TEXT,
      status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Investigated', 'Resolved', 'Dismissed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_donations_status ON food_donations(status);
    CREATE INDEX IF NOT EXISTS idx_donations_category ON food_donations(category);
    CREATE INDEX IF NOT EXISTS idx_donations_coords ON food_donations(lat, lng);
    CREATE INDEX IF NOT EXISTS idx_requests_receiver ON food_requests(receiver_id);
    CREATE INDEX IF NOT EXISTS idx_requests_donation ON food_requests(donation_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
  `);

  console.log('Database initialized successfully with clean tables (no sample data).');
}

module.exports = {
  db,
  initDb
};
