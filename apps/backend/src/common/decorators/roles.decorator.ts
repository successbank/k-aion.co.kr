import { SetMetadata } from '@nestjs/common';
import { MemberGrade } from '@prisma/client';

/**
 * Roles 데코레이터
 * @example @Roles(MemberGrade.ADMIN)
 * @example @Roles(MemberGrade.ADMIN, MemberGrade.DIVISION_CHIEF)
 */
export const Roles = (...roles: MemberGrade[]) => SetMetadata('roles', roles);
