"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Order {
  id: string;
  ref: string;
  dateDepot: string;
  clientNom: string;
  statut: string;
  nbPieces: number | null;
  description: string | null;
  priorite: string;
}

const STATUS_COLORS: Record<string, string> = {
  "En attente": "bg-yellow-100 text-yellow-800",
  "Genere": "bg-blue-100 text-blue-800",
  "En cours": "bg-indigo-100 text-indigo-800",
  "Termine": "bg-green-100 text-green-800",
  "Expedie": "bg-teal-100 text-teal-800",
  "Facture": "bg-purple-100 text-purple-800",
  "Paye": "bg-emerald-100 text-emerald-800",
  "Archive": "bg-slate-100 text-slate-600",
  "Annule": "bg-red-100 text-red-800",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => { setOrders(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Bons de commande</h1>
        <Link href="/orders/new" className="bg-blue-600 text-white px-3 py-2 sm:px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          + Nouveau
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Chargement…</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">Erreur: {error}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-slate-500">Aucun bon de commande</p>
          <Link href="/orders/new" className="text-blue-600 text-sm hover:underline mt-1 inline-block">Créer le premier</Link>
        </div>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="sm:hidden space-y-3">
            {orders.map((o) => (
              <div key={o.id} onClick={() => router.push(`/orders/${o.id}`)} className="bg-white rounded-xl border border-slate-200 p-4 active:bg-slate-50 cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-medium text-blue-700 text-sm">{o.ref}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[o.statut] || "bg-slate-100 text-slate-600"}`}>{o.statut}</span>
                </div>
                <div className="text-sm font-medium text-slate-800">{o.clientNom}</div>
                <div className="flex items-center justify-between mt-1 text-xs text-slate-400">
                  <span>{o.dateDepot}</span>
                  <span>{o.nbPieces ? `${o.nbPieces} pcs` : ""}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Référence</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Date dépôt</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Pièces</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Statut</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Priorité</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => router.push(`/orders/${o.id}`)}>
                    <td className="px-4 py-3 font-mono font-medium text-blue-700">{o.ref}</td>
                    <td className="px-4 py-3 text-slate-700">{o.clientNom}</td>
                    <td className="px-4 py-3 text-slate-500">{o.dateDepot}</td>
                    <td className="px-4 py-3 text-slate-500">{o.nbPieces ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[o.statut] || "bg-slate-100 text-slate-600"}`}>{o.statut}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{o.priorite}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
