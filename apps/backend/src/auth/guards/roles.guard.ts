import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// 등급 계층 구조 정의 (낮은 숫자 = 높은 권한)
const GRADE_HIERARCHY = {
  ADMIN: 0,
  CENTER: 1,
  DIVISION_CHIEF: 2,
  BRANCH_CHIEF: 3,
  MANAGER: 4,
  AGENT: 5,
  MEMBER: 6,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // @Roles() 데코레이터에서 필요한 등급 가져오기
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // 등급 제한이 없으면 통과
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.grade) {
      throw new ForbiddenException('접근 권한이 없습니다');
    }

    // 사용자의 등급이 필요한 등급 중 하나에 해당하는지 확인
    const hasRequiredRole = requiredRoles.some((role) => {
      const userGradeLevel = GRADE_HIERARCHY[user.grade];
      const requiredGradeLevel = GRADE_HIERARCHY[role];

      // 사용자 등급이 필요 등급보다 높거나 같으면 접근 허용
      return (
        userGradeLevel !== undefined &&
        requiredGradeLevel !== undefined &&
        userGradeLevel <= requiredGradeLevel
      );
    });

    if (!hasRequiredRole) {
      throw new ForbiddenException('이 기능을 사용할 권한이 없습니다');
    }

    return true;
  }
}
