import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="pt-16 px-4 pb-6 sm:pt-6 sm:pl-60 sm:pr-6">{children}</main>
    </div>
  );
}
