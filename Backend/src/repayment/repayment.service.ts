import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Repayment, RepaymentStatus } from './entities/repayment.entity';
import { CreateRepaymentDto } from './dto/create-repayment.dto';
import { UpdateRepaymentDto } from './dto/update-repayment.dto';
import { v4 as uuidv4 } from 'uuid';
import { CustomLogger } from 'src/core/logger/logger.service';

@Injectable()
export class RepaymentService {
  constructor(
    @InjectRepository(Repayment)
    private readonly repaymentRepository: Repository<Repayment>,
    private readonly logger: CustomLogger,
  ) {}

  private generateId(): string {
    return uuidv4().replace(/-/g, '');
  }

  async create(
    correlation_id: string,
    createRepaymentDto: CreateRepaymentDto,
  ): Promise<Repayment> {
    this.logger.setContext(this.constructor.name + '/create');
    this.logger.debug(correlation_id, 'Starting repayment creation process');

    const repayment_id = this.generateId();
    this.logger.debug(
      correlation_id,
      `Generated repayment ID: ${repayment_id}`,
    );

    const repayment = this.repaymentRepository.create({
      repayment_id,
      ...createRepaymentDto,
      due_date: new Date(createRepaymentDto.due_date),
      status: RepaymentStatus.PENDING,
    });

    this.logger.debug(correlation_id, 'Saving repayment to database');
    const savedRepayment = await this.repaymentRepository.save(repayment);
    this.logger.debug(
      correlation_id,
      `Repayment created successfully with ID: ${repayment_id}`,
    );

    return savedRepayment;
  }

  async findAll(correlation_id: string): Promise<Repayment[]> {
    this.logger.setContext(this.constructor.name + '/findAll');
    this.logger.debug(correlation_id, 'Fetching all repayments');

    const repayments = await this.repaymentRepository.find({
      order: { created_at: 'DESC' },
    });

    this.logger.debug(correlation_id, `Found ${repayments.length} repayments`);
    return repayments;
  }

  async findOne(
    correlation_id: string,
    repayment_id: string,
  ): Promise<Repayment | null> {
    this.logger.setContext(this.constructor.name + '/findOne');
    this.logger.debug(
      correlation_id,
      `Finding repayment by ID: ${repayment_id}`,
    );

    const repayment = await this.repaymentRepository.findOne({
      where: { repayment_id },
    });

    if (repayment) {
      this.logger.debug(
        correlation_id,
        `Repayment found successfully: ${repayment_id}`,
      );
    } else {
      this.logger.debug(correlation_id, `Repayment not found: ${repayment_id}`);
    }

    return repayment;
  }

  async findByLoanId(
    correlation_id: string,
    loan_id: string,
  ): Promise<Repayment[]> {
    this.logger.setContext(this.constructor.name + '/findByLoanId');
    this.logger.debug(
      correlation_id,
      `Finding repayments for loan ID: ${loan_id}`,
    );

    const repayments = await this.repaymentRepository.find({
      where: { loan_id },
      order: { due_date: 'ASC' },
    });

    this.logger.debug(
      correlation_id,
      `Found ${repayments.length} repayments for loan: ${loan_id}`,
    );
    return repayments;
  }

  async update(
    correlation_id: string,
    repayment_id: string,
    updateRepaymentDto: UpdateRepaymentDto,
  ): Promise<Repayment | null> {
    this.logger.setContext(this.constructor.name + '/update');
    this.logger.debug(correlation_id, `Updating repayment ID: ${repayment_id}`);

    const updateData: any = { ...updateRepaymentDto };
    if (updateRepaymentDto.due_date) {
      updateData.due_date = new Date(updateRepaymentDto.due_date);
    }
    if (updateRepaymentDto.paid_date) {
      updateData.paid_date = new Date(updateRepaymentDto.paid_date);
    }

    await this.repaymentRepository.update(repayment_id, updateData);
    this.logger.debug(
      correlation_id,
      `Repayment updated successfully: ${repayment_id}`,
    );

    return await this.findOne(correlation_id, repayment_id);
  }

  async markAsPaid(
    correlation_id: string,
    repayment_id: string,
  ): Promise<Repayment | null> {
    this.logger.setContext(this.constructor.name + '/markAsPaid');
    this.logger.debug(
      correlation_id,
      `Marking repayment as paid for ID: ${repayment_id}`,
    );

    await this.repaymentRepository.update(repayment_id, {
      status: RepaymentStatus.PAID,
      paid_date: new Date(),
    });
    this.logger.debug(
      correlation_id,
      `Repayment marked as paid successfully: ${repayment_id}`,
    );

    return await this.findOne(correlation_id, repayment_id);
  }

  async remove(correlation_id: string, repayment_id: string): Promise<void> {
    this.logger.setContext(this.constructor.name + '/remove');
    this.logger.debug(correlation_id, `Deleting repayment ID: ${repayment_id}`);

    await this.repaymentRepository.delete(repayment_id);
    this.logger.debug(
      correlation_id,
      `Repayment deleted successfully: ${repayment_id}`,
    );
  }
}
