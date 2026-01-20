import AuthGuard from '@/components/Auth/AuthGuard';
import DashboardLayout from '@/components/Layout/DashboardLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}
