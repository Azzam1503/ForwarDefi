import { Test, TestingModule } from '@nestjs/testing';
import { DefiPaymentsController } from './defi_payments.controller';

describe('DefiPaymentsController', () => {
  let controller: DefiPaymentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DefiPaymentsController],
    }).compile();

    controller = module.get<DefiPaymentsController>(DefiPaymentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
