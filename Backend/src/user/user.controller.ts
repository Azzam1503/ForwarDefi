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
  HttpStatus,
  Put,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateWalletAddressDto } from './dto/update-wallet-address.dto';
import { Correlation } from 'src/core/correlation/correlation.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { GetUser } from 'src/auth/get-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly user_service: UserService) {}

  @Post('signup')
  @ApiOperation({
    summary: 'User registration',
    description: 'Register a new user account',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User registered successfully' },
        data: {
          type: 'object',
          properties: {
            user_id: { type: 'string', example: 'uuid-string' },
            first_name: { type: 'string', example: 'John' },
            last_name: { type: 'string', example: 'Doe' },
            email: { type: 'string', example: 'john.doe@example.com' },
            phone_number: { type: 'string', example: '+1234567890' },
            is_admin: { type: 'boolean', example: false },
            is_active: { type: 'boolean', example: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Email already exists or validation failed',
  })
  async signup(
    @Correlation() correlation_id: string,
    @Body() create_user_dto: CreateUserDto,
  ) {
    return await this.user_service.signup(correlation_id, create_user_dto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user and return JWT token',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Login successful' },
        data: {
          type: 'object',
          properties: {
            token: { type: 'string', example: 'jwt-token-string' },
            user: {
              type: 'object',
              properties: {
                user_id: { type: 'string', example: 'uuid-string' },
                first_name: { type: 'string', example: 'John' },
                last_name: { type: 'string', example: 'Doe' },
                email: { type: 'string', example: 'john.doe@example.com' },
                phone_number: { type: 'string', example: '+1234567890' },
                is_admin: { type: 'boolean', example: false },
                is_active: { type: 'boolean', example: true },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid credentials',
  })
  async login(
    @Correlation() correlation_id: string,
    @Body() login_user_dto: LoginUserDto,
  ) {
    return await this.user_service.login(correlation_id, login_user_dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Get the profile of the currently authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  async me(@Correlation() correlation_id: string, @GetUser() user: any) {
    return await this.user_service.findById(correlation_id, user.user_id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Get user profile by user ID',
  })
  @ApiResponse({
    status: 200,
    description: 'User found successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async findById(
    @Correlation() correlation_id: string,
    @Param('id') id: string,
  ) {
    return await this.user_service.findById(correlation_id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/wallet-address')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update user wallet address',
    description: 'Update the wallet address for a specific user',
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet address updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Wallet address updated successfully' },
        data: {
          type: 'object',
          properties: {
            user_id: { type: 'string', example: 'uuid-string' },
            wallet_address: { type: 'string', example: '0x1234567890123456789012345678901234567890' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid wallet address format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async updateWalletAddress(
    @Correlation() correlation_id: string,
    @Param('id') id: string,
    @Body() updateWalletAddressDto: UpdateWalletAddressDto,
  ) {
    return await this.user_service.updateWalletAddress(
      correlation_id,
      id,
      updateWalletAddressDto.wallet_address,
    );
  }
}
