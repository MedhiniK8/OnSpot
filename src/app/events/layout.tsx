import Sidebar from "@/components/Sidebar";

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div className="main-content" style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  );
}
