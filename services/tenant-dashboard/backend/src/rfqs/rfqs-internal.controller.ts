import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { InternalSecretGuard } from '../provisioning/internal-secret.guard.js';
import { RfqsService } from './rfqs.service.js';
import { SeedTestRfqDto } from './dto/seed-test-rfq.dto.js';

// Internal, service-to-service only — same shared-secret pattern as
// provisioning (see internal-secret.guard.ts). Stands in for the Public
// Website's future RFQ-submission endpoint until Phase 3 (SRS §14).
@UseGuards(InternalSecretGuard)
@Controller('internal/rfqs')
export class RfqsInternalController {
  constructor(private readonly rfqsService: RfqsService) {}

  @Post('seed-test')
  @HttpCode(HttpStatus.CREATED)
  seedTest(@Body() dto: SeedTestRfqDto) {
    return this.rfqsService.seedTest(dto);
  }
}
