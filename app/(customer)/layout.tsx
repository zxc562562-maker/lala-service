import CustomerHeader from '@/components/CustomerHeader';
import CustomerFooterNav from '@/components/CustomerFooterNav';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CustomerHeader />
      <main className="wrap page-with-account-footer">{children}</main>
      <CustomerFooterNav />
    </>
  );
}
