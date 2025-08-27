import { Test, TestingModule } from "@nestjs/testing";
import { CustomHttpController } from "./custom-http-service.controller";
import { CustomHttpService } from "./custom-http-service.service";

describe("CustomHttpController", () => {
  let controller: CustomHttpController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomHttpController],
      providers: [CustomHttpService],
    }).compile();

    controller = module.get<CustomHttpController>(CustomHttpController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
