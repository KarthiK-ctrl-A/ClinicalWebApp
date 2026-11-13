import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SECRET_KEY, DEMO_PASSWORD } = process.env;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY || !DEMO_PASSWORD) {
  throw new Error('Missing Supabase credentials or DEMO_PASSWORD');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

function check(result, operation) {
  if (result.error) {
    throw new Error(`${operation}: ${result.error.message}`);
  }

  return result.data;
}

const authResponse = check(
  await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  }),
  'List authentication users',
);

const existingUsers = new Map(
  authResponse.users.map((user) => [user.email.toLowerCase(), user]),
);

async function createAuthUser(email, fullName, role) {
  const normalizedEmail = email.toLowerCase();

  const existing = existingUsers.get(normalizedEmail);

  if (existing) {
    return existing.id;
  }

  const data = check(
    await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role,
      },
    }),
    `Create user ${email}`,
  );

  existingUsers.set(normalizedEmail, data.user);

  return data.user.id;
}

async function createProfile(userId, fullName, role, specialty = null) {
  check(
    await supabase.from('profiles').upsert(
      {
        id: userId,
        full_name: fullName,
        role,
        specialty,
      },
      {
        onConflict: 'id',
      },
    ),
    `Create profile ${fullName}`,
  );
}

const doctors = [
  {
    name: 'Dr. Maya Patel',
    email: 'doctor1@clinic-demo.example',
    specialty: 'General Physician',
  },
  {
    name: 'Dr. Daniel Brooks',
    email: 'doctor2@clinic-demo.example',
    specialty: 'General Surgeon',
  },
];

const doctorIds = [];

for (const doctor of doctors) {
  const userId = await createAuthUser(doctor.email, doctor.name, 'doctor');

  await createProfile(userId, doctor.name, 'doctor', doctor.specialty);

  doctorIds.push(userId);

  console.log(`Doctor ready: ${doctor.name}`);
}

const firstNames = [
  'Avery',
  'Jordan',
  'Taylor',
  'Morgan',
  'Casey',
  'Riley',
  'Parker',
  'Quinn',
  'Reese',
  'Cameron',
  'Drew',
  'Hayden',
  'Alex',
  'Jamie',
  'Skyler',
  'Robin',
  'Sam',
  'Blake',
  'Charlie',
  'Emerson',
];

const lastNames = [
  'Parker',
  'Rivera',
  'Bennett',
  'Collins',
  'Mitchell',
  'Hughes',
  'Reed',
  'Foster',
  'Hayes',
  'Morgan',
  'Brooks',
  'Turner',
  'Cooper',
  'Bailey',
  'Russell',
  'Ward',
  'Gray',
  'Price',
  'Kelly',
  'James',
];

async function seedIfEmpty(tableName, patientId, records) {
  const existing = check(
    await supabase
      .from(tableName)
      .select('id')
      .eq('patient_id', patientId)
      .limit(1),
    `Read ${tableName}`,
  );

  if (existing.length > 0) {
    return;
  }

  check(await supabase.from(tableName).insert(records), `Seed ${tableName}`);
}

for (let i = 1; i <= 40; i++) {
  const number = String(i).padStart(2, '0');

  const doctorIndex = Math.floor((i - 1) / 20);
  let gender = 'Female';
  let allergies = 'None known';
  let imagingType = 'Chest X-ray';

  if (i % 2 === 0) {
    gender = 'Male';
  }
  if (i % 5 === 0) {
    allergies = 'Penicillin';
  }
  if (doctorIndex === 1) {
    imagingType = 'Abdominal Ultrasound';
  }

  const fullName = `${firstNames[(i - 1) % 20]} ${lastNames[(i + 3) % 20]}`;

  const email = `patient${number}@clinic-demo.example`;

  const userId = await createAuthUser(email, fullName, 'patient');

  await createProfile(userId, fullName, 'patient');

  const year = 1955 + ((i * 7) % 45);
  const month = 1 + ((i * 3) % 12);
  const day = 1 + ((i * 11) % 27);

  const dateOfBirth = [
    year,
    String(month).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-');

  const patient = check(
    await supabase
      .from('patients')
      .upsert(
        {
          user_id: userId,
          doctor_id: doctorIds[doctorIndex],
          date_of_birth: dateOfBirth,
          gender,
          phone: `202-555-${String(100 + i).padStart(4, '0')}`,
          address: 'Fictional Test Address, USA',
          allergies,
          medical_notes: 'Synthetic record for application testing.',
        },
        {
          onConflict: 'user_id',
        },
      )
      .select('id')
      .single(),
    `Create patient ${number}`,
  );

  const patientId = patient.id;
  const doctorId = doctorIds[doctorIndex];

  await seedIfEmpty('lab_results', patientId, [
    {
      patient_id: patientId,
      test_name: 'Hemoglobin',
      result_value: '13.8',
      unit: 'g/dL',
      reference_range: '12.0-17.5',
      collected_at: '2026-10-01',
    },
    {
      patient_id: patientId,
      test_name: 'Glucose',
      result_value: String(85 + (i % 15)),
      unit: 'mg/dL',
      reference_range: '70-99',
      collected_at: '2026-10-01',
    },
  ]);

  await seedIfEmpty('imaging_reports', patientId, [
    {
      patient_id: patientId,
      imaging_type: imagingType,
      findings: 'No acute abnormality in synthetic example.',
      impression: 'Sample imaging report for UI testing.',
      report_date: '2026-09-20',
    },
  ]);

  await seedIfEmpty('prescriptions', patientId, [
    {
      patient_id: patientId,
      doctor_id: doctorId,
      medication_name: 'Acetaminophen',
      dosage: '500 mg',
      frequency: 'As needed',
      duration_days: 5,
      instructions: 'Fictional historical prescription.',
      status: 'completed',
    },
    {
      patient_id: patientId,
      doctor_id: doctorId,
      medication_name: 'Vitamin D3',
      dosage: '1000 IU',
      frequency: 'Once daily',
      duration_days: 30,
      instructions: 'Fictional sample medication record.',
      status: 'active',
    },
  ]);

  console.log(`Patient ${number}/40 ready: ${fullName}`);
}

console.log('\n================================');
console.log('CLINIC DATABASE SEED COMPLETE');
console.log('================================');
console.log('Doctors: 2');
console.log('Patients: 40');
console.log('Lab results: 80');
console.log('Imaging reports: 40');
console.log('Prescriptions: 80');
console.log('================================');
