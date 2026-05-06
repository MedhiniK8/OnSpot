import Footer from "@/components/Footer";

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#fff" }}>
      {children}
      <Footer />
    </div>
  );
}
