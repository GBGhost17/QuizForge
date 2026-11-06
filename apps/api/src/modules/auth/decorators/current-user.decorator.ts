import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserProfile } from '@quizforge/shared-types';

/**
 * Decorator to extract the authenticated user from the request.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof UserProfile | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
