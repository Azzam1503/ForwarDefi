import { Module } from '@nestjs/common';
import { CustomHttpService } from './custom-http-service.service';
import { CustomHttpController } from './custom-http-service.controller';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from 'src/core/logger/logger.module';
import { AsyncStorageModule } from '../async-storage/async-storage.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [LoggerModule, HttpModule, AsyncStorageModule, ConfigModule],

  controllers: [CustomHttpController],
  providers: [CustomHttpService],
  exports: [CustomHttpService],
})
export class CustomHttpModule {}
