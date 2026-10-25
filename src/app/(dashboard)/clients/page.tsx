"use client";
import { useEffect, useState } from "react";

interface Client {
  id: string; nom: string; type: string; contact: string | null;
  telephone: string | null; email: string | null;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/clients").then((r) => r.json()).then((d) => { setClients(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Clients</h1>
      {loading ? (
        <div className="text-center py-12 text-slate-400">Chargement…</div>
      ) : clients.length === 0 ? (
        <div className="text-center py-12 text-slate-500">Aucun client enregistré</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Nom</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Téléphone</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{c.nom}</td>
                  <td className="px-4 py-3 text-slate-500">{c.type}</td>
                  <td className="px-4 py-3 text-slate-500">{c.telephone || "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{c.email || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
