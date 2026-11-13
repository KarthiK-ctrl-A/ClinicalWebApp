'use client';

import { getErrorMessage } from '@/lib/error-message';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { clinicApi } from '@/lib/api/clinic-api';

import { PrescriptionForm } from '@/components/doctor/prescription-form';
import { MessageThread } from '@/features/messaging/components/message-thread';

import { CallActions } from '@/features/calls/components/call-actions';
import { CallHistory } from '@/features/calls/components/call-history';

import { PatientDetails, PatientRecords, Prescription } from '@/types/clinic';

export default function PatientDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const [patient, setPatient] = useState<PatientDetails | null>(null);

  const [records, setRecords] = useState<PatientRecords | null>(null);

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadPatient() {
      try {
        const [patientData, recordData, medicationData] = await Promise.all([
          clinicApi<PatientDetails>(`/api/v1/patients/${id}`),

          clinicApi<PatientRecords>(`/api/v1/patients/${id}/records`),

          clinicApi<Prescription[]>(`/api/v1/patients/${id}/prescriptions`),
        ]);

        if (active) {
          setPatient(patientData);
          setRecords(recordData);
          setPrescriptions(medicationData);
        }
      } catch (err) {
        if (active) {
          setError(getErrorMessage(err, 'Unable to load patient records'));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPatient();

    return () => {
      active = false;
    };
  }, [id]);

  async function refreshPrescriptions() {
    const medicationData = await clinicApi<Prescription[]>(`/api/v1/patients/${id}/prescriptions`);

    setPrescriptions(medicationData);
  }

  if (loading) {
    return <p>Loading patient records...</p>;
  }

  if (error || !patient || !records) {
    return (
      <p role="alert" className="text-red-600">
        {error || 'Patient not found'}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/doctor/patients" className="text-sm text-blue-600 hover:underline">
        ← Back to Patients
      </Link>

      <div>
        <h1 className="text-3xl font-semibold">{patient.fullName}</h1>

        <p className="text-slate-500">Patient Medical Record</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 text-sm md:grid-cols-3">
            <div>
              <p className="text-slate-500">Date of Birth</p>
              <p>{patient.dateOfBirth ?? '—'}</p>
            </div>

            <div>
              <p className="text-slate-500">Gender</p>
              <p>{patient.gender ?? '—'}</p>
            </div>

            <div>
              <p className="text-slate-500">Phone</p>
              <p>{patient.phone ?? '—'}</p>
            </div>

            <div>
              <p className="text-slate-500">Allergies</p>
              <p>{patient.allergies ?? '—'}</p>
            </div>

            <div>
              <p className="text-slate-500">Address</p>
              <p>{patient.address ?? '—'}</p>
            </div>

            <div>
              <p className="text-slate-500">Medical Notes</p>
              <p>{patient.medicalNotes ?? '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <CallActions key={id} patientId={id} />

      <CallHistory key={`history-${id}`} patientId={id} />

      <Card>
        <CardHeader>
          <CardTitle>Medical Records</CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="labs">
            <TabsList>
              <TabsTrigger value="labs">Lab Results</TabsTrigger>

              <TabsTrigger value="imaging">Imaging</TabsTrigger>

              <TabsTrigger value="medications">Medications</TabsTrigger>

              <TabsTrigger value="messages">Messages</TabsTrigger>
            </TabsList>

            <TabsContent value="labs" className="mt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-3">Test</th>
                      <th className="p-3">Result</th>
                      <th className="p-3">Reference Range</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {records.labResults.map((lab) => (
                      <tr key={lab.id} className="border-b">
                        <td className="p-3">{lab.testName}</td>

                        <td className="p-3">
                          {lab.result ?? '—'} {lab.unit ?? ''}
                        </td>

                        <td className="p-3">{lab.referenceRange ?? '—'}</td>

                        <td className="p-3">{lab.collectedAt ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {records.labResults.length === 0 && (
                  <p className="py-5 text-slate-500">No lab results available.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="imaging" className="mt-6">
              <div className="space-y-4">
                {records.imagingReports.map((report) => (
                  <Card key={report.id}>
                    <CardContent className="space-y-3 pt-5">
                      <div className="flex justify-between">
                        <h3 className="font-semibold">{report.imagingType}</h3>

                        <span className="text-sm text-slate-500">{report.reportDate ?? '—'}</span>
                      </div>

                      <div>
                        <p className="font-medium">Findings</p>
                        <p className="text-sm">{report.findings ?? '—'}</p>
                      </div>

                      <div>
                        <p className="font-medium">Impression</p>
                        <p className="text-sm">{report.impression ?? '—'}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {records.imagingReports.length === 0 && (
                  <p className="text-slate-500">No imaging reports available.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="medications" className="mt-6 space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-3">Medication</th>
                      <th className="p-3">Dosage</th>
                      <th className="p-3">Frequency</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Prescribed</th>
                    </tr>
                  </thead>

                  <tbody>
                    {prescriptions.map((prescription) => (
                      <tr key={prescription.id} className="border-b">
                        <td className="p-3">{prescription.medicationName}</td>

                        <td className="p-3">{prescription.dosage}</td>

                        <td className="p-3">{prescription.frequency ?? '—'}</td>

                        <td className="p-3">{prescription.status}</td>

                        <td className="p-3">{prescription.prescribedAt.slice(0, 10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {prescriptions.length === 0 && (
                  <p className="py-5 text-slate-500">No prescriptions available.</p>
                )}
              </div>

              <PrescriptionForm patientId={id} onCreated={refreshPrescriptions} />
            </TabsContent>

            <TabsContent value="messages" className="mt-6">
              <MessageThread key={id} mode="doctor" patientId={id} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
