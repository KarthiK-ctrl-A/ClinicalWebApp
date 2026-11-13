export interface CurrentUser {
  id: string;
  email: string | null;
  fullName: string;
  role: 'doctor' | 'patient';
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

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface LabResult {
  id: string;
  testName: string;
  result: string | null;
  unit: string | null;
  referenceRange: string | null;
  collectedAt: string | null;
}

export interface ImagingReport {
  id: string;
  imagingType: string;
  findings: string | null;
  impression: string | null;
  reportDate: string | null;
}

export interface PatientRecords {
  labResults: LabResult[];
  imagingReports: ImagingReport[];
}

export interface Prescription {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string | null;
  durationDays: number | null;
  instructions: string | null;
  status: string;
  prescribedAt: string;
}

export interface CreatePrescriptionInput {
  medicationName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions?: string;
}
