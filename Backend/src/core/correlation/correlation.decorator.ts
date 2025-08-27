import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";

export const Correlation = createParamDecorator(
  (data: any, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    if (!!req.headers["x-correlation-id"]) {
      return req.headers["x-correlation-id"];
    } else {
      return uuidv4().replace(/-/g, "");
    }
  }
);
