export interface PatientRecord {
  id: string;

  date_of_birth: string | null;

  gender: string | null;

  phone: string | null;

  allergies: string | null;

  address?: string | null;

  medical_notes?: string | null;

  profile: {
    full_name: string;
  } | null;
}

export interface PatientSummary {
  id: string;
  fullName: string;
  dateOfBirth: string | null;
  gender: string | null;
  phone: string | null;
  allergies: string | null;
}

export interface PatientDetails extends PatientSummary {
  address: string | null;
  medicalNotes: string | null;
}
