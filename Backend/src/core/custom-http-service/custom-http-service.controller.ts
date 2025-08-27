import { Controller } from "@nestjs/common";
import { CustomHttpService } from "./custom-http-service.service";

@Controller("custom-http-service")
export class CustomHttpController {
  constructor(private readonly customHttpService: CustomHttpService) {}
}
