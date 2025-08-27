import { NestMiddleware, Injectable } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    req.headers["x-correlation-id"] =
      req.headers["x-correlation-id"] || uuidv4().replace(/-/g, "");
    next();
  }
}
