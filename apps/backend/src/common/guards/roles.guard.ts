import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MemberGrade } from '@prisma/client';

/**
 * 역할 기반 접근 제어 가드
 * TODO: Task #56에서 JWT 인증과 함께 완전히 구현 예정
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<MemberGrade[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    // TODO: Task #56에서 구현
    // const request = context.switchToHttp().getRequest();
    // const user = request.user;
    // return requiredRoles.some((role) => user.grade === role);

    // 현재는 모든 요청 허용
    return true;
  }
}
