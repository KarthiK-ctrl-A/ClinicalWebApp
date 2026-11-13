import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import type { CallType } from '../../modules/calls/interfaces/call.interface';

interface CloudflareResponse<T> {
  success: boolean;
  data?: T;
}

interface CloudflareMeeting {
  id: string;
}

interface CloudflareParticipant {
  id: string;
  token: string;
}

@Injectable()
export class CloudflareRealtimeKitService {
  constructor(
    private readonly config: ConfigService,
  ) {}

  private get baseUrl(): string {
    const accountId = this.config.getOrThrow<string>(
      'CLOUDFLARE_ACCOUNT_ID',
    );

    const appId = this.config.getOrThrow<string>(
      'CLOUDFLARE_REALTIMEKIT_APP_ID',
    );

    return (
      `https://api.cloudflare.com/client/v4/accounts/` +
      `${accountId}/realtime/kit/${appId}`
    );
  }

  private async request<T>(
    path: string,
    method: 'POST' | 'PATCH',
    body?: object,
  ): Promise<T> {
    let response: Response;

    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.config.getOrThrow<string>(
            'CLOUDFLARE_API_TOKEN',
          )}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      throw new ServiceUnavailableException(
        'Cloudflare RealtimeKit is unavailable',
      );
    }

    if (!response.ok) {
      throw new ServiceUnavailableException(
        `Cloudflare request failed with status ${response.status}`,
      );
    }

    const result =
      (await response.json()) as CloudflareResponse<T>;

    if (!result.success || !result.data) {
      throw new ServiceUnavailableException(
        'Cloudflare returned an unsuccessful response',
      );
    }

    return result.data;
  }

  async createMeeting(): Promise<string> {
    const meeting = await this.request<CloudflareMeeting>(
      '/meetings',
      'POST',
      {
        title: 'Clinic Consultation',
        record_on_start: false,
        transcribe_on_end: false,
      },
    );

    return meeting.id;
  }

  async addParticipant(
    meetingId: string,
    userId: string,
    name: string,
    callType: CallType,
  ): Promise<CloudflareParticipant> {
    let presetKey: string;

    if (callType === 'audio') {
        presetKey = 'CLOUDFLARE_AUDIO_PRESET';
    } else {
        presetKey = 'CLOUDFLARE_VIDEO_PRESET';
    }

    const presetName = this.config.getOrThrow<string>(presetKey);

    return this.request<CloudflareParticipant>(
      `/meetings/${meetingId}/participants`,
      'POST',
      {
        name,
        custom_participant_id: userId,
        preset_name: presetName,
        token: {
          expires_on: new Date(
            Date.now() + 60 * 60 * 1000,
          ).toISOString(),
        },
      },
    );
  }

  async refreshParticipantToken(
    meetingId: string,
    participantId: string,
  ): Promise<string> {
    const result = await this.request<{ token: string }>(
      `/meetings/${meetingId}/participants/${participantId}/token`,
      'POST',
    );

    return result.token;
  }

  async endMeeting(meetingId: string): Promise<void> {
    await this.request<CloudflareMeeting>(
      `/meetings/${meetingId}`,
      'PATCH',
      {
        status: 'INACTIVE',
      },
    );
  }
}