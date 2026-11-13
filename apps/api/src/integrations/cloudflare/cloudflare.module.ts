import { Module } from '@nestjs/common';

import { CloudflareRealtimeKitService } from './cloudflare-realtimekit.service';

@Module({
  providers: [CloudflareRealtimeKitService],
  exports: [CloudflareRealtimeKitService],
})
export class CloudflareModule {}
