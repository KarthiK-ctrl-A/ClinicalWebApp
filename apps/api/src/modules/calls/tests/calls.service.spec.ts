import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { CallsRepository } from '../repositories/calls.repository';
import { CallsService } from '../services/calls.service';
import { PatientsService } from '../../patients/services/patients.service';
import { CloudflareRealtimeKitService } from '../../../integrations/cloudflare/cloudflare-realtimekit.service';

describe('CallsService', () => {
  let service: CallsService;

  const cloudflare = {
    createMeeting: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        CallsService,
        { provide: CallsRepository, useValue: {} },
        { provide: PatientsService, useValue: {} },
        { provide: CloudflareRealtimeKitService, useValue: cloudflare },
      ],
    }).compile();

    service = module.get(CallsService);
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

    expect(cloudflare.createMeeting).not.toHaveBeenCalled();
  });
});
