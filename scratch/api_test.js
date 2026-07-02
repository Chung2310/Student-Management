/* eslint-disable */
const BASE_URL = 'http://localhost:3001/api/v1';

async function run() {
  console.log('1. Logging in as Superadmin...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'superadmin@studentmanagement.com',
      password: 'SuperAdminPass123'
    })
  });
  if (!loginRes.ok) {
    throw new Error(`Login failed: ${await loginRes.text()}`);
  }
  const loginData = await loginRes.json();
  const superToken = loginData.data.accessToken;
  console.log('Superadmin token retrieved successfully.');

  const testEmail = `center_language_${Date.now()}@test.com`;

  console.log(`2. Creating a new center with businessType 'language' (Email: ${testEmail})...`);
  const createRes = await fetch(`${BASE_URL}/auth/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${superToken}`
    },
    body: JSON.stringify({
      displayName: 'Trung tâm Ngoại ngữ Test',
      email: testEmail,
      password: 'Password123',
      role: 'admin',
      centerId: '',
      bankAccountNo: '123456789',
      bankId: 'mbbank',
      businessType: 'language'
    })
  });
  if (!createRes.ok) {
    throw new Error(`Create center failed: ${await createRes.text()}`);
  }
  const createData = await createRes.json();
  const newCenterUser = createData.data.user;
  console.log('Center created successfully:', newCenterUser);

  if (newCenterUser.businessType !== 'language') {
    throw new Error(`Expected businessType to be 'language', got '${newCenterUser.businessType}'`);
  }
  console.log('Verified businessType is correctly assigned as "language" during creation.');

  console.log('3. Logging in as the new Center Admin...');
  const centerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'Password123'
    })
  });
  if (!centerLoginRes.ok) {
    throw new Error(`Center login failed: ${await centerLoginRes.text()}`);
  }
  const centerLoginData = await centerLoginRes.json();
  const centerUser = centerLoginData.data.user;
  console.log('New Center Admin user object:', centerUser);
  if (centerUser.businessType !== 'language') {
    throw new Error(`Expected logged-in center user businessType to be 'language', got '${centerUser.businessType}'`);
  }
  console.log('Verified businessType is correct on login response.');

  console.log('4. Editing center business type as Superadmin...');
  const editRes = await fetch(`${BASE_URL}/auth/users/${newCenterUser.uid}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${superToken}`
    },
    body: JSON.stringify({
      displayName: 'Trung tâm Ngoại ngữ Test (Updated)',
      email: testEmail,
      isActive: true,
      bankAccountNo: '987654321',
      bankId: 'vietcombank',
      businessType: 'general'
    })
  });
  if (!editRes.ok) {
    throw new Error(`Edit center failed: ${await editRes.text()}`);
  }
  const editData = await editRes.json();
  console.log('Edited user response:', editData.data.user);
  if (editData.data.user.businessType !== 'general') {
    throw new Error(`Expected businessType to be updated to 'general', got '${editData.data.user.businessType}'`);
  }
  console.log('Verified businessType can be edited by superadmin.');

  console.log('ALL API TESTS PASSED SUCCESSFULLY!');
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
