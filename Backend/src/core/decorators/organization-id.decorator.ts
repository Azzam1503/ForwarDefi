import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const OrganizationId = createParamDecorator(
  (data: any, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return (
      req.headers["x-organization-id"] ||
      req.headers["x-org-id"] ||
      req.headers["X-ORGANIZATION-ID"] ||
      req.headers["X-ORG-ID"]
    );
  },
);
