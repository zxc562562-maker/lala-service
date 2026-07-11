import CustomerHeader from '@/components/CustomerHeader';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CustomerHeader />
      <main className="wrap">{children}</main>
    </>
  );
}
