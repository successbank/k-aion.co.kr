import MemberLayout from '@/components/MemberLayout';

export default function MyPageLayout({ children }: { children: React.ReactNode }) {
  return <MemberLayout>{children}</MemberLayout>;
}
