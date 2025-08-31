import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { LoanModule } from './loan/loan.module';
import { RepaymentModule } from './repayment/repayment.module';
import { TransactionModule } from './transaction/transaction.module';
import { AvalancheModule } from './avalanche/avalanche.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from './core/logger/logger.module';
import { ConfigModule } from '@nestjs/config';

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
      autoLoadEntities: true, // Automatically loads all entities
      synchronize: true, // ❗ For dev only (auto-create tables)
    }),
    LoggerModule,
    UserModule,
    LoanModule,
    RepaymentModule,
    TransactionModule,
    AvalancheModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
