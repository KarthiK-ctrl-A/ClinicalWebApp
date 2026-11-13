import { ForbiddenException } from '@nestjs/common';

import { CallsService } from '../services/calls.service';

describe('CallsService', () => {
  let service: CallsService;

  const repository = {
    create: jest.fn(),
  };

  const patientsService = {
    findOne: jest.fn(),
  };

  const cloudflare = {
    createMeeting: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new CallsService(
      repository as any,
      patientsService as any,
      cloudflare as any,
    );
  });

  it('prevents patients from initiating calls', async () => {
    const patient = {
      id: 'patient-user-id',
      role: 'patient',
      accessToken: 'test-token',
      fullName: 'Test Patient',
      email: 'patient@example.com',
    } as const;

    await expect(
      service.initiate(patient, {
        patientId: 'patient-record-id',
        callType: 'video',
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(
      cloudflare.createMeeting,
    ).not.toHaveBeenCalled();
  });
});