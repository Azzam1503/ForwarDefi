import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { LoanModule } from './loan/loan.module';
import { RepaymentModule } from './repayment/repayment.module';
import { TransactionModule } from './transaction/transaction.module';
import { AvalancheModule } from './avalanche/avalanche.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from './core/logger/logger.module';
import { ConfigModule } from '@nestjs/config';
import { DefiPaymentsModule } from './defi_payments/defi_payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: 3306,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true,
    }),
    LoggerModule,
    AuthModule,
    UserModule,
    LoanModule,
    RepaymentModule,
    TransactionModule,
    AvalancheModule,
    DefiPaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
