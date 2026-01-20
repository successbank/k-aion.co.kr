import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT 인증 가드
 * TODO: Task #56에서 Passport JWT Strategy와 함께 구현 예정
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // TODO: Task #56에서 구현
    // 현재는 모든 요청 허용
    return true;
  }
}
