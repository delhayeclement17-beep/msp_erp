"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Order {
  id: string; ref: string; dateDepot: string; statut: string; priorite: string;
  nDevis: string | null; delaiSouhaite: string | null; description: string | null;
  remarques: string | null; nbPieces: number | null; prixHT: number | null;
  nettoyageHP: string; sablage: string; metallisation: string; primaire: string;
  thermolaquage: string; peintureLiquide: string;
  ral: string | null; texture: string | null; brillance: string | null;
  client?: { id: string; nom: string; contact: string | null; telephone: string | null; email: string | null };
  subOrders?: Order[];
  stationStatuses?: { station: string; status: string }[];
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

const NEXT_STATUS: Record<string, string> = {
  "En attente": "En cours",
  "En cours": "Termine",
  "Termine": "Expedie",
  "Expedie": "Facture",
  "Facture": "Paye",
  "Paye": "Archive",
};

function TreatmentBadge({ label, value }: { label: string; value: string }) {
  if (value === "Non") return null;
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700">
      {label}{value !== "Oui" ? `: ${value}` : ""}
    </span>
  );
}

function OrderDetail({ order }: { order: Order }) {
  const treatments = [
    { label: "Nettoyage HP", value: order.nettoyageHP },
    { label: "Sablage", value: order.sablage },
    { label: "Métallisation", value: order.metallisation },
    { label: "Primaire", value: order.primaire },
    { label: "Thermolaquage", value: order.thermolaquage },
    { label: "Peinture liquide", value: order.peintureLiquide },
  ];
  const activeTreatments = treatments.filter((t) => t.value !== "Non");

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 space-y-4">
      {activeTreatments.length > 0 && (
        <div>
          <div className="text-xs font-medium text-slate-500 mb-2">Traitements</div>
          <div className="flex flex-wrap gap-2">
            {activeTreatments.map((t) => <TreatmentBadge key={t.label} label={t.label} value={t.value} />)}
          </div>
        </div>
      )}
      {(order.ral || order.texture || order.brillance) && (
        <div className="flex flex-wrap gap-4 text-sm">
          {order.ral && <div><span className="text-slate-500">RAL:</span> <span className="font-medium">{order.ral}</span></div>}
          {order.texture && <div><span className="text-slate-500">Texture:</span> <span className="font-medium">{order.texture}</span></div>}
          {order.brillance && <div><span className="text-slate-500">Brillance:</span> <span className="font-medium">{order.brillance}</span></div>}
        </div>
      )}
      <div className="flex flex-wrap gap-4 text-sm">
        {order.nbPieces && <div><span className="text-slate-500">Pièces:</span> <span className="font-medium">{order.nbPieces}</span></div>}
        {order.prixHT != null && <div><span className="text-slate-500">Prix HT:</span> <span className="font-medium">{order.prixHT.toFixed(2)} €</span></div>}
      </div>
      {order.description && <div className="text-sm"><span className="text-slate-500">Description:</span> <span className="text-slate-700">{order.description}</span></div>}
      {order.remarques && <div className="text-sm"><span className="text-slate-500">Remarques:</span> <span className="text-slate-700">{order.remarques}</span></div>}
      {order.stationStatuses && order.stationStatuses.length > 0 && (
        <div>
          <div className="text-xs font-medium text-slate-500 mb-2">Postes</div>
          <div className="flex flex-wrap gap-2">
            {order.stationStatuses.map((s) => (
              <span key={s.station} className={`px-2.5 py-1 rounded-lg text-xs font-medium ${STATUS_COLORS[s.status] || "bg-slate-100 text-slate-600"}`}>
                {s.station}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  function loadOrder() {
    fetch(`/api/orders/${params.id}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data) => { setOrder(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }

  useEffect(() => { loadOrder(); }, [params.id]);

  async function advanceStatus() {
    if (!order) return;
    const next = NEXT_STATUS[order.statut];
    if (!next) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: next }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      loadOrder();
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
    setUpdating(false);
  }

  if (loading) return <div className="text-center py-12 text-slate-400">Chargement…</div>;
  if (error) return <div className="text-center py-12 text-red-500">Erreur: {error}</div>;
  if (!order) return <div className="text-center py-12 text-slate-400">Commande introuvable</div>;

  const hasSubOrders = order.subOrders && order.subOrders.length > 0;
  const nextStatus = NEXT_STATUS[order.statut];

  return (
    <div className="max-w-3xl">
      <button onClick={() => router.push("/orders")} className="text-sm text-slate-500 hover:text-slate-700 mb-4 flex items-center gap-1">
        ← Retour
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">{order.ref}</h1>
          {order.client && <p className="text-sm text-slate-500 mt-0.5">{order.client.nom}</p>}
        </div>
        <span className={`self-start px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[order.statut] || "bg-slate-100 text-slate-600"}`}>
          {order.statut}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => { window.open(`/orders/${order.id}/bdc`, "_blank"); setTimeout(() => window.open(`/orders/${order.id}/fiche`, "_blank"), 300); }}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          🖨 BDC + Fiche Atelier
        </button>
        {nextStatus && (
          <button
            onClick={advanceStatus}
            disabled={updating}
            className="flex items-center gap-1.5 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-900 disabled:opacity-50 transition-colors"
          >
            → Passer à « {nextStatus} »
          </button>
        )}
      </div>

      {/* Info card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 mb-4 space-y-2 text-sm">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <div><span className="text-slate-500">Date dépôt:</span> <span className="font-medium">{order.dateDepot}</span></div>
          <div><span className="text-slate-500">Priorité:</span> <span className="font-medium">{order.priorite}</span></div>
          {order.nDevis && <div><span className="text-slate-500">N° devis:</span> <span className="font-medium">{order.nDevis}</span></div>}
          {order.delaiSouhaite && <div><span className="text-slate-500">Délai:</span> <span className="font-medium">{order.delaiSouhaite}</span></div>}
        </div>
        {order.client && (
          <div className="flex flex-wrap gap-x-6 gap-y-1 pt-2 border-t border-slate-100">
            {order.client.contact && <div><span className="text-slate-500">Contact:</span> {order.client.contact}</div>}
            {order.client.telephone && <div><span className="text-slate-500">Tél:</span> <a href={`tel:${order.client.telephone}`} className="text-blue-600">{order.client.telephone}</a></div>}
            {order.client.email && <div><span className="text-slate-500">Email:</span> {order.client.email}</div>}
          </div>
        )}
      </div>

      {/* Treatments */}
      {hasSubOrders ? (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-600">Sous-commandes ({order.subOrders!.length})</h2>
          {order.subOrders!.map((sub) => (
            <div key={sub.id}>
              <div className="text-sm font-mono font-medium text-blue-700 mb-2">{sub.ref}</div>
              <OrderDetail order={sub} />
            </div>
          ))}
        </div>
      ) : (
        <OrderDetail order={order} />
      )}
    </div>
  );
}
