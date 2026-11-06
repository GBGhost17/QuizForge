import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../auth.constants';

/**
 * Decorator to mark an endpoint as public (bypassing JwtAuthGuard).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
