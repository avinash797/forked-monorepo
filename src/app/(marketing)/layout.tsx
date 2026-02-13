import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen bg-bg">{children}</main>
      <Footer />
    </>
  );
}
