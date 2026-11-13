'use client';

import { getErrorMessage } from '@/lib/error-message';

import { FormEvent, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { clinicApi } from '@/lib/api/clinic-api';

import { CreatePrescriptionInput, Prescription } from '@/types/clinic';

interface PrescriptionFormProps {
  patientId: string;
  onCreated: () => Promise<void>;
}

const initialValues: CreatePrescriptionInput = {
  medicationName: '',
  dosage: '',
  frequency: '',
  durationDays: 7,
  instructions: '',
};

export function PrescriptionForm({ patientId, onCreated }: PrescriptionFormProps) {
  const [form, setForm] = useState<CreatePrescriptionInput>({
    ...initialValues,
  });

  const [submitting, setSubmitting] = useState(false);

  function updateField<K extends keyof CreatePrescriptionInput>(
    field: K,
    value: CreatePrescriptionInput[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);

    try {
      await clinicApi<Prescription>(`/api/v1/patients/${patientId}/prescriptions`, {
        method: 'POST',
        body: JSON.stringify(form),
      });

      setForm({ ...initialValues });

      toast.success('Prescription saved successfully');

      await onCreated();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save prescription'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-5">
      <h3 className="text-lg font-semibold">Add Prescription</h3>

      <div className="space-y-2">
        <Label htmlFor="medication">Medication Name</Label>

        <Input
          id="medication"
          value={form.medicationName}
          onChange={(event) => updateField('medicationName', event.target.value)}
          maxLength={120}
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dosage">Dosage</Label>

          <Input
            id="dosage"
            value={form.dosage}
            onChange={(event) => updateField('dosage', event.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequency">Frequency</Label>

          <Input
            id="frequency"
            value={form.frequency}
            onChange={(event) => updateField('frequency', event.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Duration (days)</Label>

        <Input
          id="duration"
          type="number"
          min={1}
          max={365}
          value={form.durationDays}
          onChange={(event) => updateField('durationDays', Number(event.target.value))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructions">Instructions</Label>

        <textarea
          id="instructions"
          className="min-h-24 w-full rounded-md border p-3 text-sm"
          value={form.instructions}
          maxLength={500}
          onChange={(event) => updateField('instructions', event.target.value)}
        />
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Saving...' : 'Save Prescription'}
      </Button>
    </form>
  );
}
