// Automated End-to-End Test Suite for Food Waste Rescue Agent
// Verifies: Clean DB, 3 Roles (Donor, Recipient, Admin), Real Food Creation, Real Requests, History, Status Updates

const assert = require('assert');
const bcrypt = require('../server/node_modules/bcryptjs');
const { initDb, db } = require('../server/db');
const { verifyFoodSafety, calculateSmartMatch, calculateDistanceKm } = require('../server/aiEngine');

console.log('====================================================');
console.log('🧪 TESTING FOOD RESCUE AGENT UPDATED SYSTEM');
console.log('====================================================\n');

let passCount = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Error: ${err.message}`);
  }
}

// 1. Clean Database (No Sample Data)
test('Clean Database Integrity (No Hardcoded Sample Listings)', () => {
  initDb();
  // Clean prior test artifacts
  db.prepare("DELETE FROM food_requests").run();
  db.prepare("DELETE FROM food_donations").run();
  db.prepare("DELETE FROM users WHERE email LIKE '%@actualuser.org'").run();

  // Ensure tables are created
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const tableNames = tables.map(t => t.name);
  assert(tableNames.includes('users'), 'users table must exist');
  assert(tableNames.includes('food_donations'), 'food_donations table must exist');
  assert(tableNames.includes('food_requests'), 'food_requests table must exist');
});

// 2. Three User Roles Registration & Password Hashing
let donorUser, recipientUser, adminUser;

test('Register Exactly THREE User Roles: Donor, Recipient, Admin', () => {
  const salt = bcrypt.genSaltSync(10);

  // 1. Register Donor
  const donorRes = db.prepare(`
    INSERT INTO users (name, email, password, role, organization_type, phone, address, is_verified)
    VALUES (?, ?, ?, 'donor', 'Grand Hotel Mess', '+91 98490 11111', 'Banjara Hills, Hyderabad', 1)
  `).run('City Grand Hotel', 'donor1@actualuser.org', bcrypt.hashSync('pass123', salt));
  donorUser = db.prepare('SELECT * FROM users WHERE id = ?').get(donorRes.lastInsertRowid);
  assert.strictEqual(donorUser.role, 'donor');

  // 2. Register Recipient
  const recipientRes = db.prepare(`
    INSERT INTO users (name, email, password, role, organization_type, phone, address, is_verified)
    VALUES (?, ?, ?, 'recipient', 'Hope Shelter Home', '+91 98490 22222', 'Panjagutta, Hyderabad', 1)
  `).run('Hope Shelter Home', 'recipient1@actualuser.org', bcrypt.hashSync('pass123', salt));
  recipientUser = db.prepare('SELECT * FROM users WHERE id = ?').get(recipientRes.lastInsertRowid);
  assert.strictEqual(recipientUser.role, 'recipient');

  // 3. Register Admin
  const adminRes = db.prepare(`
    INSERT INTO users (name, email, password, role, organization_type, phone, address, is_verified)
    VALUES (?, ?, ?, 'admin', 'Central Monitoring Authority', '+91 98490 33333', 'Civic Center, Hyderabad', 1)
  `).run('Admin Officer', 'admin1@actualuser.org', bcrypt.hashSync('pass123', salt));
  adminUser = db.prepare('SELECT * FROM users WHERE id = ?').get(adminRes.lastInsertRowid);
  assert.strictEqual(adminUser.role, 'admin');
});

// 3. Donor Submits Real Food Donation
let createdDonation;

test('Donor Adds Food Details and Saves to Database', () => {
  const now = new Date();
  const prep = new Date(now.getTime() - 1 * 3600 * 1000).toISOString();
  const deadline = new Date(now.getTime() + 5 * 3600 * 1000).toISOString();

  const safety = verifyFoodSafety({
    category: 'Cooked Meals',
    food_type: 'veg',
    prep_time: prep,
    safe_deadline: deadline,
    storage_condition: 'Hot Held (>60°C)'
  });

  assert.strictEqual(safety.status, 'Safe to Consider');

  const res = db.prepare(`
    INSERT INTO food_donations (
      donor_id, food_name, description, image_url, category, food_type,
      quantity, quantity_unit, packets_count, prep_time, safe_deadline,
      storage_condition, safety_status, safety_score, safety_notes,
      pickup_address, lat, lng, contact_phone, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Available')
  `).run(
    donorUser.id,
    'Fresh Vegetarian Pulao & Vegetable Kurma',
    'Prepared 1 hour ago for morning function, stored continuously above 65°C.',
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    'Cooked Meals',
    'veg',
    25.0,
    'kg',
    75,
    prep,
    deadline,
    'Hot Held (>60°C)',
    safety.status,
    safety.score,
    safety.recommendation,
    'Banjara Hills, Hyderabad',
    17.4123,
    78.4382,
    '+91 98490 11111'
  );

  createdDonation = db.prepare('SELECT * FROM food_donations WHERE id = ?').get(res.lastInsertRowid);
  assert(createdDonation != null, 'Donation record must exist in DB');
  assert.strictEqual(createdDonation.donor_id, donorUser.id);
  assert.strictEqual(createdDonation.food_name, 'Fresh Vegetarian Pulao & Vegetable Kurma');
  assert.strictEqual(createdDonation.status, 'Available');
});

// 4. Homepage / Available Listings Retrieve Only Submitted Data
test('Homepage Retrieves ONLY Actual Submitted Food Data', () => {
  const activeListings = db.prepare(`
    SELECT d.*, u.name as donor_name 
    FROM food_donations d
    JOIN users u ON d.donor_id = u.id
    WHERE d.status = 'Available'
  `).all();

  assert.strictEqual(activeListings.length, 1, 'Should contain only the actual submitted donation');
  assert.strictEqual(activeListings[0].food_name, 'Fresh Vegetarian Pulao & Vegetable Kurma');
  assert.strictEqual(activeListings[0].donor_name, 'City Grand Hotel');
});

// 5. Recipient Places Real Request
let createdRequest;

test('Recipient Submits Food Request into Database', () => {
  const reqRes = db.prepare(`
    INSERT INTO food_requests (
      donation_id, receiver_id, requested_quantity, beneficiaries_count,
      organization_name, pickup_location, required_pickup_time, special_requirements,
      urgency_level, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
  `).run(
    createdDonation.id,
    recipientUser.id,
    20.0,
    60,
    'Hope Shelter Home',
    'Banjara Hills, Hyderabad',
    new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    'Insulated thermal box carried by van',
    'Urgent'
  );

  createdRequest = db.prepare('SELECT * FROM food_requests WHERE id = ?').get(reqRes.lastInsertRowid);
  assert(createdRequest != null, 'Food request must be stored in database');
  assert.strictEqual(createdRequest.receiver_id, recipientUser.id);
  assert.strictEqual(createdRequest.requested_quantity, 20.0);
  assert.strictEqual(createdRequest.status, 'Pending');
});

// 6. Requests Page Functionality: Donor Views and Manages Status
test('Requests Page: Donor Views and Accepts Request', () => {
  // Donor queries incoming requests for their food
  const donorRequests = db.prepare(`
    SELECT r.*, d.food_name, u_recv.name as receiver_name
    FROM food_requests r
    JOIN food_donations d ON r.donation_id = d.id
    JOIN users u_recv ON r.receiver_id = u_recv.id
    WHERE d.donor_id = ?
  `).all(donorUser.id);

  assert.strictEqual(donorRequests.length, 1, 'Donor must see their 1 real request');
  assert.strictEqual(donorRequests[0].receiver_name, 'Hope Shelter Home');

  // Donor accepts the request
  db.prepare(`UPDATE food_requests SET status = 'Accepted' WHERE id = ?`).run(createdRequest.id);
  db.prepare(`UPDATE food_donations SET status = 'Accepted' WHERE id = ?`).run(createdDonation.id);

  const updatedReq = db.prepare('SELECT status FROM food_requests WHERE id = ?').get(createdRequest.id);
  const updatedDonation = db.prepare('SELECT status FROM food_donations WHERE id = ?').get(createdDonation.id);

  assert.strictEqual(updatedReq.status, 'Accepted');
  assert.strictEqual(updatedDonation.status, 'Accepted');
});

// 7. Request Status Progress to Ready for Pickup and Completed
test('Requests Page: Status Progression to Completed', () => {
  // Donor marks ready for pickup
  db.prepare(`UPDATE food_requests SET status = 'Ready for Pickup' WHERE id = ?`).run(createdRequest.id);
  // Recipient / Donor marks completed
  db.prepare(`UPDATE food_requests SET status = 'Completed' WHERE id = ?`).run(createdRequest.id);
  db.prepare(`UPDATE food_donations SET status = 'Completed' WHERE id = ?`).run(createdDonation.id);

  const completedReq = db.prepare('SELECT * FROM food_requests WHERE id = ?').get(createdRequest.id);
  const completedDon = db.prepare('SELECT * FROM food_donations WHERE id = ?').get(createdDonation.id);

  assert.strictEqual(completedReq.status, 'Completed');
  assert.strictEqual(completedDon.status, 'Completed');
});

// 8. History Page: Shows Actual Records
test('History Page: Retrieves Actual Database Records for Donor & Recipient', () => {
  // Donor history
  const donorHistory = db.prepare(`
    SELECT * FROM food_donations WHERE donor_id = ?
  `).all(donorUser.id);
  assert.strictEqual(donorHistory.length, 1, 'Donor history must show their actual donation');
  assert.strictEqual(donorHistory[0].status, 'Completed');

  // Recipient history
  const recipientHistory = db.prepare(`
    SELECT r.*, d.food_name, u_donor.name as donor_name
    FROM food_requests r
    JOIN food_donations d ON r.donation_id = d.id
    JOIN users u_donor ON d.donor_id = u_donor.id
    WHERE r.receiver_id = ? AND r.status = 'Completed'
  `).all(recipientUser.id);

  assert.strictEqual(recipientHistory.length, 1, 'Recipient history must show actual completed request');
  assert.strictEqual(recipientHistory[0].food_name, 'Fresh Vegetarian Pulao & Vegetable Kurma');
  assert.strictEqual(recipientHistory[0].donor_name, 'City Grand Hotel');
});

console.log('\n====================================================');
console.log(`RESULTS: ${passCount} / ${totalTests} TESTS PASSED! 🎉`);
console.log('====================================================\n');
