import { Global, Module } from '@nestjs/common';
import { PrismaControlService } from './prisma-control.service.js';

@Global()
@Module({
  providers: [PrismaControlService],
  exports: [PrismaControlService],
})
export class PrismaControlModule {}
