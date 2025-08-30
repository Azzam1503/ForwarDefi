import { Module } from '@nestjs/common';
import { DefiPaymentsService } from './defi_payments.service';
import { DefiPaymentsController } from './defi_payments.controller';
import { LoggerModule } from 'src/core/logger/logger.module';

@Module({
  imports: [LoggerModule],
  providers: [DefiPaymentsService],
  controllers: [DefiPaymentsController],
})
export class DefiPaymentsModule {}
