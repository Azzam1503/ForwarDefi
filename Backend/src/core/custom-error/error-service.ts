import { HttpException, HttpStatus } from "@nestjs/common";
export interface ErrorCode {
  code: number;
  description: string;
}
export const customHttpError = (
  error_code: ErrorCode,
  error_name: string,
  error_message: string,
  https_status_code: HttpStatus,
  status_text?: string
): HttpException => {
  return new HttpException(
    {
      // status_code: https_status_code,
      code: error_code.code,
      name: error_name,
      message: error_message,
      status_text,
    },
    https_status_code
  );
};
