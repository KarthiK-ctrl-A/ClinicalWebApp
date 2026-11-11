import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY;
const password = process.env.DEMO_PASSWORD;

if (!url || !key || !password) {
  throw new Error('Missing test environment variables');
}

async function login(email) {
  const client = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(`${email}: ${error.message}`);
  }

  return client;
}

async function getPatients(client) {
  const { data, error } = await client
    .from('patients')
    .select('id, user_id, doctor_id');

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

const doctor1 = await login(
  'doctor1@clinic-demo.example'
);

const doctor2 = await login(
  'doctor2@clinic-demo.example'
);

const patient1 = await login(
  'patient01@clinic-demo.example'
);

const doctor1Patients = await getPatients(doctor1);
const doctor2Patients = await getPatients(doctor2);
const patientRecords = await getPatients(patient1);

console.log('Doctor 1:', doctor1Patients.length);
console.log('Doctor 2:', doctor2Patients.length);
console.log('Patient 1:', patientRecords.length);

const doctor2PatientId = doctor2Patients[0]?.id;

const { data: unauthorized, error } = await doctor1
  .from('patients')
  .select('id')
  .eq('id', doctor2PatientId);

if (error) {
  throw new Error(error.message);
}

console.log(
  'Doctor 1 accessing Doctor 2 patient:',
  unauthorized.length
);

const passed =
  doctor1Patients.length === 20 &&
  doctor2Patients.length === 20 &&
  patientRecords.length === 1 &&
  unauthorized.length === 0;

if (!passed) {
  throw new Error('Phase 1 access verification failed');
}

console.log('PASS: Phase 1 authentication and RLS');