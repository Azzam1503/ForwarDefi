import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { CustomLogger } from "../logger/logger.service";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const logger = new CustomLogger();

    const request = context.switchToHttp().getRequest();
    const host = request.hostname;
    const url = request.url;
    const http_method = request.method;
    const headers = request.headers;

    const body = request.body;
    const query = request.query;
    const params = request.params;
    const client_ip = request.socket._peername;

    const req = {
      host,
      url,
      http_method,
      headers,
      body,
      query,
      params,
      client_ip,
    };

    const correlation_id =
      headers["x-correlation-id"] || "MISSING_CORRELATION_ID_HEADER";
    logger.log(correlation_id, req);

    const now = Date.now();
    return next.handle().pipe(
      tap((resp) =>
        logger.log(correlation_id, {
          api_response: resp,
          _sys_metadata: { response_time: Date.now() - now },
        }),
      ),
    );
  }
}
