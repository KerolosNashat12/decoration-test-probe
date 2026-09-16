import { Module } from '@nestjs/common';
import { RfqsController } from './rfqs.controller.js';
import { RfqsInternalController } from './rfqs-internal.controller.js';
import { RfqsService } from './rfqs.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [RfqsController, RfqsInternalController],
  providers: [RfqsService],
  exports: [RfqsService],
})
export class RfqsModule {}
