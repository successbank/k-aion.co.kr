import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * CurrentUser 데코레이터
 * JWT 토큰에서 추출한 현재 사용자 정보를 컨트롤러에 주입
 * @example async getProfile(@CurrentUser() user: JwtPayload)
 * TODO: Task #56에서 JwtPayload 인터페이스와 함께 구현
 */
export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
