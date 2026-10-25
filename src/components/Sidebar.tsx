"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

const nav = [
  { label: "Bons de commande", href: "/orders", icon: "📋", section: "PRODUCTION" },
  { label: "Suivi Atelier", href: "/suivi", icon: "🏭", section: "PRODUCTION" },
  { label: "Scanner QR", href: "/scan", icon: "📷", section: "PRODUCTION" },
  { label: "Clients", href: "/clients", icon: "👥", section: "ADMINISTRATION" },
  { label: "Tableau de bord", href: "/dashboard", icon: "📊", section: "ADMINISTRATION" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  let currentSection = "";

  return (
    <>
      {/* Mobile top bar */}
      <div className="sm:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
          <span className="font-semibold text-sm text-slate-900">Mahieu ERP</span>
        </div>
        <button onClick={() => setOpen(!open)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></> : <><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></>}
          </svg>
        </button>
      </div>

      {/* Mobile overlay */}
      {open && <div className="sm:hidden fixed inset-0 bg-black/30 z-40" onClick={() => setOpen(false)} />}

      {/* Sidebar panel */}
      <aside className={`fixed left-0 top-0 bottom-0 w-56 bg-white border-r border-slate-200 flex flex-col z-50 transition-transform ${open ? "translate-x-0" : "-translate-x-full"} sm:translate-x-0`}>
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
            <div>
              <div className="font-semibold text-sm text-slate-900">Mahieu ERP</div>
              <div className="text-xs text-slate-400">Sablage & Peinture</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          {nav.map((item) => {
            const showSection = item.section !== currentSection;
            if (showSection) currentSection = item.section;
            const active = pathname.startsWith(item.href);
            return (
              <div key={item.href}>
                {showSection && (
                  <div className="px-4 pt-4 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {item.section}
                  </div>
                )}
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 mx-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    active ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              </div>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs">
            <div className="font-medium text-slate-700">{session?.user?.name || "..."}</div>
            <div className="text-slate-400">{(session?.user as any)?.role || ""}</div>
          </div>
          <button onClick={() => signOut()} className="text-slate-400 hover:text-slate-600 p-1" title="Déconnexion">⎋</button>
        </div>
      </aside>
    </>
  );
}
