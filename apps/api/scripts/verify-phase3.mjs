import assert from 'node:assert/strict';

import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, DEMO_PASSWORD } = process.env;

const apiUrl = process.env.API_URL ?? 'http://localhost:3001/api/v1';

async function login(email) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: DEMO_PASSWORD,
  });

  if (error || !data.session) {
    throw new Error(`Login failed: ${email}`);
  }

  return data.session.access_token;
}

async function request(path, token, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return {
    status: response.status,
    body: await response.json(),
  };
}

async function main() {
  const doctor1 = await login('doctor1@clinic-demo.example');

  const doctor2 = await login('doctor2@clinic-demo.example');

  const patient = await login('patient01@clinic-demo.example');

  const patients = await request('/patients', doctor1);

  assert.equal(patients.status, 200);

  const patientId = patients.body.data[0].id;

  const records = await request(`/patients/${patientId}/records`, doctor1);

  assert.equal(records.status, 200);
  assert.ok(Array.isArray(records.body.labResults));
  assert.ok(Array.isArray(records.body.imagingReports));

  console.log('PASS: Medical records');

  const prescription = {
    medicationName: 'TEST_MEDICATION_NOT_FOR_USE',
    dosage: 'TEST_ONLY',
    frequency: 'TEST_ONLY',
    durationDays: 1,
    instructions: 'Synthetic integration test record.',
  };

  const created = await request(
    `/patients/${patientId}/prescriptions`,
    doctor1,
    {
      method: 'POST',
      body: JSON.stringify(prescription),
    },
  );

  assert.equal(created.status, 201);

  console.log('PASS: Prescription creation');

  const history = await request(
    `/patients/${patientId}/prescriptions`,
    doctor1,
  );

  assert.equal(history.status, 200);

  assert.ok(history.body.some((item) => item.id === created.body.id));

  console.log('PASS: Prescription persistence');

  const unauthorized = await request(
    `/patients/${patientId}/prescriptions`,
    doctor2,
    {
      method: 'POST',
      body: JSON.stringify(prescription),
    },
  );

  assert.equal(unauthorized.status, 404);

  console.log('PASS: Cross-doctor write blocked');

  const patientAttempt = await request(
    `/patients/${patientId}/prescriptions`,
    patient,
    {
      method: 'POST',
      body: JSON.stringify(prescription),
    },
  );

  assert.equal(patientAttempt.status, 403);

  console.log('PASS: Patient write blocked');

  console.log('\nPhase 3 verification passed.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
