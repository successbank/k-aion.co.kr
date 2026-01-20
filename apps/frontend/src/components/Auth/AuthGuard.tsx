'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Spin } from 'antd';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  // Zustand hydration 대기
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Hydration 완료 후에만 인증 체크
    if (!isHydrated) return;

    // 인증되지 않은 경우 로그인 페이지로 리다이렉트
    if (!user || !token) {
      const loginUrl = `/login?from=${encodeURIComponent(pathname)}`;
      router.push(loginUrl);
    }
  }, [isHydrated, user, token, router, pathname]);

  // Hydration 대기 중이거나 인증되지 않은 경우
  if (!isHydrated || !user || !token) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return <>{children}</>;
}
