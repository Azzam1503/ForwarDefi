import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Param,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { Correlation } from 'src/core/correlation/correlation.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { GetUser } from 'src/auth/get-user.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly user_service: UserService) {}

  @Post('signup')
  async signup(
    @Correlation() correlation_id: string,
    @Body() create_user_dto: CreateUserDto,
  ) {
    return await this.user_service.signup(correlation_id, create_user_dto);
  }

  @Post('login')
  async login(
    @Correlation() correlation_id: string,
    @Body() login_user_dto: LoginUserDto,
  ) {
    return await this.user_service.login(correlation_id, login_user_dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Correlation() correlation_id: string, @GetUser() user: any) {
    return await this.user_service.findById(correlation_id, user.user_id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findById(
    @Correlation() correlation_id: string,
    @Param('id') id: string,
  ) {
    return await this.user_service.findById(correlation_id, id);
  }
}
