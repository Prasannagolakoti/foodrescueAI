const assert = require('assert');

async function runTests() {
  console.log('====================================================');
  console.log('🧪 VERIFYING FOOD RESCUE AI - API & AUTHENTICATION');
  console.log('====================================================');

  const targets = [
    { name: 'Direct Backend (Port 5000)', base: 'http://127.0.0.1:5000' },
    { name: 'Vite Dev Proxy (Port 3000)', base: 'http://127.0.0.1:3000' }
  ];

  for (const target of targets) {
    console.log(`\n--- Testing ${target.name} ---`);

    // 1. Health Check
    const healthRes = await fetch(`${target.base}/api/health`);
    assert.strictEqual(healthRes.status, 200, 'Health check should be 200');
    const healthData = await healthRes.json();
    console.log('✓ 1. Health Check OK:', healthData.status);

    // 2. Registration (unique test user)
    const testEmail = `testuser_${Date.now()}@actualuser.org`;
    const regRes = await fetch(`${target.base}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Automated Test User',
        email: testEmail,
        password: 'Password123!',
        role: 'donor',
        address: 'Banjara Hills, Hyderabad',
        phone: '+91 9988776655'
      })
    });
    assert.strictEqual(regRes.status, 201, 'Registration should be 201');
    const regData = await regRes.json();
    assert.ok(regData.token, 'Registration should return JWT token');
    console.log('✓ 2. Registration OK: User ID', regData.user.id, regData.user.email);

    // 3. Login with newly created user
    const loginRes = await fetch(`${target.base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password123!',
        role: 'donor'
      })
    });
    assert.strictEqual(loginRes.status, 200, 'Login should be 200');
    const loginData = await loginRes.json();
    assert.ok(loginData.token, 'Login should return token');
    const token = loginData.token;
    console.log('✓ 3. Login OK: Token generated successfully');

    // 4. Authenticated Profile Fetch (/api/auth/me)
    const meRes = await fetch(`${target.base}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(meRes.status, 200, 'Profile fetch should be 200');
    const meData = await meRes.json();
    assert.strictEqual(meData.user.email, testEmail);
    console.log('✓ 4. Profile Fetch OK: Verified user profile for', meData.user.name);

    // 5. Quick Login for Persona Switcher
    const quickDonorRes = await fetch(`${target.base}/api/auth/quick-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'donor' })
    });
    assert.strictEqual(quickDonorRes.status, 200, 'Quick login donor should be 200');
    const quickDonorData = await quickDonorRes.json();
    console.log('✓ 5a. Quick Login Donor OK:', quickDonorData.user.name, `(${quickDonorData.user.role})`);

    const quickRecipRes = await fetch(`${target.base}/api/auth/quick-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'recipient' })
    });
    assert.strictEqual(quickRecipRes.status, 200, 'Quick login recipient should be 200');
    const quickRecipData = await quickRecipRes.json();
    console.log('✓ 5b. Quick Login Recipient OK:', quickRecipData.user.name, `(${quickRecipData.user.role})`);

    // 6. Preview Food Safety Check
    const safetyRes = await fetch(`${target.base}/api/donations/preview-safety`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'Cooked Meals',
        food_type: 'veg',
        prep_time: new Date(Date.now() - 3600000).toISOString(),
        safe_deadline: new Date(Date.now() + 18000000).toISOString(),
        storage_condition: 'Ambient / Room Temp'
      })
    });
    assert.strictEqual(safetyRes.status, 200, 'Safety preview should be 200');
    const safetyData = await safetyRes.json();
    console.log('✓ 6. Food Safety Preview OK: Status =', safetyData.status, 'Score =', safetyData.score);

    // 7. Create Food Donation with Base64 Image (Test image upload)
    const sampleBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
    const createDonationRes = await fetch(`${target.base}/api/donations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        food_name: 'Fresh Veg Dum Biryani & Raitha',
        description: 'Nutritious freshly prepared biryani from event',
        image_url: sampleBase64,
        category: 'Cooked Meals',
        food_type: 'veg',
        quantity: 12,
        quantity_unit: 'kg',
        packets_count: 28,
        prep_time: new Date(Date.now() - 1800000).toISOString(),
        safe_deadline: new Date(Date.now() + 21600000).toISOString(),
        storage_condition: 'Ambient / Room Temp',
        pickup_address: 'vignan university ,guntur',
        contact_phone: '+91 98491 12345'
      })
    });
    assert.strictEqual(createDonationRes.status, 201, 'Create donation should be 201');
    const donData = await createDonationRes.json();
    console.log('✓ 7. Create Donation & Image Upload OK: ID', donData.donation.id, donData.donation.food_name);

    // 8. Fetch Active Food Donations
    const donListRes = await fetch(`${target.base}/api/donations?status=Available`);
    assert.strictEqual(donListRes.status, 200, 'Donations list should be 200');
    const donList = await donListRes.json();
    console.log('✓ 8. Donations Catalog OK: Total listings =', donList.length);

    // 9. AI Smart Matching Engine
    const matchRes = await fetch(`${target.base}/api/matching/recommendations?food_name=biryani`);
    assert.strictEqual(matchRes.status, 200, 'Smart match should be 200');
    const matchData = await matchRes.json();
    console.log('✓ 9. AI Smart Matching OK: Matches found =', matchData.length);
    if (matchData.length > 0) {
      console.log('   Top Match:', matchData[0].foodName, '➔', matchData[0].receiverName, `(${matchData[0].matchPercentage}%)`);
    }

    // 10. Analytics Dashboard
    const analyticsRes = await fetch(`${target.base}/api/analytics/dashboard`);
    assert.strictEqual(analyticsRes.status, 200, 'Analytics should be 200');
    const analyticsData = await analyticsRes.json();
    console.log('✓ 10. Analytics Dashboard OK: Rescued kg =', analyticsData.summary.totalKgRescued, 'Packets =', analyticsData.summary.totalPacketsDistributed);

    // 11. Chatbot Interaction
    const chatRes = await fetch(`${target.base}/api/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'How do I donate food?' })
    });
    assert.strictEqual(chatRes.status, 200, 'Chatbot should be 200');
    const chatData = await chatRes.json();
    console.log('✓ 11. AI Chatbot OK: Reply length =', chatData.reply.length, 'characters');
  }

  console.log('\n====================================================');
  console.log('🎉 ALL 22 VERIFICATION TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
