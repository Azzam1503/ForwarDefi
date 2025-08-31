import { Test, TestingModule } from '@nestjs/testing';
import { DefiPaymentsService } from './defi_payments.service';

describe('DefiPaymentsService', () => {
  let service: DefiPaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DefiPaymentsService],
    }).compile();

    service = module.get<DefiPaymentsService>(DefiPaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
