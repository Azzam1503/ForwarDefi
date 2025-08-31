import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepaymentService } from './repayment.service';
import { RepaymentController } from './repayment.controller';
import { Repayment } from './entities/repayment.entity';
import { LoggerModule } from 'src/core/logger/logger.module';
import { DefiPaymentsModule } from 'src/defi_payments/defi_payments.module';
import { TransactionModule } from 'src/transaction/transaction.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Repayment]),
    LoggerModule,
    DefiPaymentsModule,
    TransactionModule,
    UserModule,
  ],
  controllers: [RepaymentController],
  providers: [RepaymentService],
  exports: [RepaymentService],
})
export class RepaymentModule {}
