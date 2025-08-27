import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { CustomLogger } from 'src/core/logger/logger.service';
import { customHttpError } from 'src/core/custom-error/error-service';
import {
  DATA_VALIDATION_ERROR,
  ENTITY_NOT_FOUND,
} from 'src/core/custom-error/error-constant';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly user_repo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly logger: CustomLogger,
  ) {}

  async signup(correlation_id: string, create_user_dto: CreateUserDto) {
    this.logger.setContext(this.constructor.name + '/signup');
    this.logger.debug(correlation_id, 'Starting user signup process');

    this.logger.debug(
      correlation_id,
      'Checking if user already exists in database',
    );
    const existing_user = await this.user_repo.findOne({
      where: { email: create_user_dto.email },
    });

    if (existing_user) {
      this.logger.debug(correlation_id, 'User already exists with this email');
      throw customHttpError(
        DATA_VALIDATION_ERROR,
        'EMAIL_EXISTS',
        'Email already registered',
        HttpStatus.BAD_REQUEST,
      );
    }

    this.logger.debug(correlation_id, 'Hashing user password');
    const hashed_password = await bcrypt.hash(create_user_dto.password, 10);

    this.logger.debug(correlation_id, 'Creating new user entity');
    const user = this.user_repo.create({
      ...create_user_dto,
      user_id: uuidv4(),
      password: hashed_password,
    });

    this.logger.debug(correlation_id, 'Saving user to database');
    const saved_user = await this.user_repo.save(user);
    this.logger.debug(
      correlation_id,
      `User saved successfully with ID: ${saved_user.user_id}`,
    );

    return {
      message: 'User registered successfully',
      data: {
        user_id: saved_user.user_id,
        first_name: saved_user.first_name,
        last_name: saved_user.last_name,
        email: saved_user.email,
        phone_number: saved_user.phone_number,
        is_admin: saved_user.is_admin,
        is_active: saved_user.is_active,
        created_at: saved_user.created_at,
      },
    };
  }

  async login(correlation_id: string, login_user_dto: LoginUserDto) {
    this.logger.setContext(this.constructor.name + '/login');
    this.logger.debug(correlation_id, 'Starting user login process');

    this.logger.debug(correlation_id, 'Finding user in database');
    const user = await this.user_repo.findOne({
      where: { email: login_user_dto.email },
    });

    if (!user) {
      this.logger.debug(correlation_id, 'User not found in database');
      throw customHttpError(
        ENTITY_NOT_FOUND,
        'INVALID_CREDENTIALS',
        'Invalid credentials',
        HttpStatus.UNAUTHORIZED,
      );
    }

    this.logger.debug(correlation_id, 'Validating user password');
    const is_password_valid = await bcrypt.compare(
      login_user_dto.password,
      user.password,
    );

    if (!is_password_valid) {
      this.logger.debug(correlation_id, 'Invalid password provided');
      throw customHttpError(
        ENTITY_NOT_FOUND,
        'INVALID_CREDENTIALS',
        'Invalid credentials',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!user.is_active || user.is_deleted) {
      this.logger.debug(correlation_id, 'User account is inactive or deleted');
      throw customHttpError(
        DATA_VALIDATION_ERROR,
        'ACCOUNT_INACTIVE',
        'Account is not active',
        HttpStatus.UNAUTHORIZED,
      );
    }

    this.logger.debug(correlation_id, 'Generating JWT token');
    const payload = {
      first_name: user.first_name,
      last_name: user.last_name,
      user_id: user.user_id,
      email: user.email,
      is_admin: user.is_admin,
    };
    const token = await this.jwtService.signAsync(payload);
    this.logger.debug(correlation_id, 'JWT token generated successfully');

    return {
      message: 'Login successful',
      data: {
        token,
        user: {
          user_id: user.user_id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone_number: user.phone_number,
          is_admin: user.is_admin,
          is_active: user.is_active,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      },
    };
  }

  async findById(correlation_id: string, id: string) {
    this.logger.setContext(this.constructor.name + '/findById');
    this.logger.debug(correlation_id, `Finding user by ID: ${id}`);

    const user = await this.user_repo.findOne({ where: { user_id: id } });

    if (user) {
      this.logger.debug(correlation_id, `User found successfully: ${id}`);
      return {
        message: 'User found successfully',
        data: {
          user_id: user.user_id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone_number: user.phone_number,
          is_admin: user.is_admin,
          is_active: user.is_active,
          is_deleted: user.is_deleted,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      };
    } else {
      this.logger.debug(correlation_id, `User not found: ${id}`);
      throw customHttpError(
        ENTITY_NOT_FOUND,
        'USER_NOT_FOUND',
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
