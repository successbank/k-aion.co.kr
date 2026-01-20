import { SetMetadata } from '@nestjs/common';
import { MemberGrade } from '@prisma/client';

/**
 * Roles 데코레이터 (신규 등급 체계)
 * @example @Roles(MemberGrade.ADMIN)
 * @example @Roles(MemberGrade.ADMIN, MemberGrade.CENTER)
 */
export const Roles = (...roles: MemberGrade[]) => SetMetadata('roles', roles);
