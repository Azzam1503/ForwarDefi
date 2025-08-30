import { Module } from '@nestjs/common';
import { DefiPaymentsService } from './defi_payments.service';
import { DefiPaymentsController } from './defi_payments.controller';

@Module({
  providers: [DefiPaymentsService],
  controllers: [DefiPaymentsController],
})
export class DefiPaymentsModule {}
