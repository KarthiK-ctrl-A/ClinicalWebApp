import assert from 'node:assert/strict';

import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, DEMO_PASSWORD } = process.env;

const API_URL = process.env.API_URL ?? 'http://localhost:3001/api/v1';

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !DEMO_PASSWORD) {
  throw new Error('Required environment variables are missing');
}

async function login(email) {
  const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password: DEMO_PASSWORD,
  });

  if (error || !data.session) {
    throw new Error(`Login failed: ${email}`);
  }

  return data.session.access_token;
}

async function apiRequest(path, token) {
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, { headers });

  return {
    status: response.status,
    body: await response.json(),
  };
}

async function main() {
  const doctor1 = await login('doctor1@clinic-demo.example');

  const doctor2 = await login('doctor2@clinic-demo.example');

  const patient1 = await login('patient01@clinic-demo.example');
  const profile = await apiRequest('/me', doctor1);

  assert.equal(profile.status, 200);
  assert.equal(profile.body.role, 'doctor');
  assert.equal(profile.body.accessToken, undefined);

  console.log('PASS: Doctor authentication');
  const firstDoctor = await apiRequest('/patients', doctor1);

  assert.equal(firstDoctor.status, 200);
  assert.equal(firstDoctor.body.pagination.total, 20);

  console.log('PASS: Doctor 1 has 20 patients');
  const secondDoctor = await apiRequest('/patients', doctor2);

  assert.equal(secondDoctor.status, 200);
  assert.equal(secondDoctor.body.pagination.total, 20);

  console.log('PASS: Doctor 2 has 20 patients');
  const ownPatientId = firstDoctor.body.data[0].id;

  const ownPatient = await apiRequest(`/patients/${ownPatientId}`, doctor1);

  assert.equal(ownPatient.status, 200);

  console.log('PASS: Authorized patient access');
  const otherPatientId = secondDoctor.body.data[0].id;

  const unauthorized = await apiRequest(`/patients/${otherPatientId}`, doctor1);

  assert.equal(unauthorized.status, 404);

  console.log('PASS: Cross-doctor access blocked');
  const patientAccess = await apiRequest('/patients', patient1);

  assert.equal(patientAccess.status, 403);

  console.log('PASS: Patient role restrictions');
  const anonymous = await apiRequest('/patients');

  assert.equal(anonymous.status, 401);

  console.log('PASS: Anonymous access rejected');
  const invalid = await apiRequest('/patients', 'invalid-token');

  assert.equal(invalid.status, 401);

  console.log('PASS: Invalid token rejected');
  const invalidId = await apiRequest('/patients/invalid-id', doctor1);

  assert.equal(invalidId.status, 400);

  console.log('PASS: Invalid UUID rejected');

  console.log('\nAll Phase 2 checks passed.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
