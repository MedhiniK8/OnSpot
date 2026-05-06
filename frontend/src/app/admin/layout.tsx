import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div className="main-content" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {children}
        <Footer />
      </div>
    </div>
  );
}
