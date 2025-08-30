import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AvalancheService } from './avalanche.service';
import { AvalancheController } from './avalanche.controller';
import { LoggerModule } from 'src/core/logger/logger.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000, // 10 seconds
      maxRedirects: 5,
    }),
    LoggerModule,
  ],
  controllers: [AvalancheController],
  providers: [AvalancheService],
  exports: [AvalancheService],
})
export class AvalancheModule {}
