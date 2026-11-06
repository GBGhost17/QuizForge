import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../auth.constants';

/**
 * Decorator to assign required user roles to a controller method or class.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
