"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Order {
  id: string; ref: string; dateDepot: string; statut: string; priorite: string;
  delaiSouhaite: string | null; description: string | null; remarques: string | null;
  nbPieces: number | null;
  nettoyageHP: string; sablage: string; metallisation: string; primaire: string;
  thermolaquage: string; peintureLiquide: string;
  ral: string | null; texture: string | null; brillance: string | null;
  client?: { nom: string; contact: string | null; telephone: string | null };
  subOrders?: Order[];
  stationStatuses?: { station: string; status: string }[];
}

const STATION_LABELS: Record<string, string> = {
  ACC: "Accueil", NHP: "Nettoyage HP", SAB: "Sablage",
  MIC: "Microbillage / Ponçage", MET: "Métallisation", PRI: "Primaire",
  TL_ACC: "TL — Accrochage", TL_POU: "TL — Poudrage",
  TL_FOU: "TL — Four", TL_DEC: "TL — Décrochage",
  PL_CAC: "PL — Cabine", PL_FIN: "PL — Finition", PL_DCA: "PL — Décrochage",
  EMB: "Emballage", EXP: "Expédition",
};

function FicheSheet({ order, clientNom }: { order: Order; clientNom: string }) {
  const stations = order.stationStatuses ?? [];
  const hasFinition = order.thermolaquage === "Oui" || order.peintureLiquide === "Oui";

  return (
    <div className="fiche-sheet bg-white p-6 mb-8 border-2 border-slate-300 print:border-0 print:mb-0 print:p-4" style={{ minHeight: "270mm", pageBreakAfter: "always" }}>
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-800 pb-3 mb-4">
        <div>
          <div className="text-base font-bold text-slate-900">MAHIEU SABLAGE PEINTURE</div>
          <div className="text-xs text-slate-500">Fiche Atelier</div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold font-mono text-slate-900">{order.ref}</div>
          <div className="text-xs text-slate-500">
            {order.priorite === "Urgent" && <span className="text-red-600 font-bold mr-1">⚡ URGENT</span>}
            Dépôt: {order.dateDepot}
          </div>
        </div>
      </div>

      {/* Client + delivery */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-xs text-slate-500 uppercase font-semibold">Client</span>
          <div className="font-bold">{clientNom}</div>
          {order.client?.contact && <div className="text-slate-600">{order.client.contact}</div>}
          {order.client?.telephone && <div className="text-slate-600">{order.client.telephone}</div>}
        </div>
        <div>
          <span className="text-xs text-slate-500 uppercase font-semibold">Délai souhaité</span>
          <div className="font-bold text-lg">{order.delaiSouhaite || "—"}</div>
        </div>
      </div>

      {/* Pieces + description */}
      <div className="border border-slate-300 rounded p-3 mb-4 grid grid-cols-3 gap-3 text-sm">
        <div>
          <div className="text-xs text-slate-500 uppercase font-semibold">Nb pièces</div>
          <div className="text-2xl font-bold">{order.nbPieces ?? "—"}</div>
        </div>
        <div className="col-span-2">
          <div className="text-xs text-slate-500 uppercase font-semibold">Description</div>
          <div>{order.description || "—"}</div>
        </div>
      </div>

      {/* Finition params */}
      {hasFinition && (
        <div className="border border-blue-300 bg-blue-50 rounded p-3 mb-4 flex gap-6 text-sm">
          {order.ral && (
            <div>
              <span className="text-xs text-slate-500 uppercase font-semibold">RAL</span>
              <div className="font-bold text-lg">{order.ral}</div>
            </div>
          )}
          {order.texture && (
            <div>
              <span className="text-xs text-slate-500 uppercase font-semibold">Texture</span>
              <div className="font-bold">{order.texture}</div>
            </div>
          )}
          {order.brillance && (
            <div>
              <span className="text-xs text-slate-500 uppercase font-semibold">Brillance</span>
              <div className="font-bold">{order.brillance}</div>
            </div>
          )}
        </div>
      )}

      {/* Station checklist */}
      <div className="mb-4">
        <div className="text-xs text-slate-500 uppercase font-semibold mb-2">Suivi postes</div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 px-3 py-1.5 text-left font-semibold">Poste</th>
              <th className="border border-slate-300 px-3 py-1.5 text-center font-semibold w-20">Fait</th>
              <th className="border border-slate-300 px-3 py-1.5 text-left font-semibold">Initiales</th>
              <th className="border border-slate-300 px-3 py-1.5 text-left font-semibold">Heure</th>
              <th className="border border-slate-300 px-3 py-1.5 text-left font-semibold">Remarque</th>
            </tr>
          </thead>
          <tbody>
            {stations.length > 0 ? stations.map((s) => (
              <tr key={s.station}>
                <td className="border border-slate-300 px-3 py-2 font-medium">{STATION_LABELS[s.station] ?? s.station}</td>
                <td className="border border-slate-300 px-3 py-2 text-center">
                  <div className="w-5 h-5 border-2 border-slate-400 rounded mx-auto"></div>
                </td>
                <td className="border border-slate-300 px-3 py-2 w-24"></td>
                <td className="border border-slate-300 px-3 py-2 w-20"></td>
                <td className="border border-slate-300 px-3 py-2"></td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="border border-slate-300 px-3 py-2 text-slate-400 text-center">Aucun poste défini</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Remarks */}
      {order.remarques && (
        <div className="border border-orange-300 bg-orange-50 rounded p-3 text-sm">
          <span className="font-semibold text-orange-800">Remarques: </span>
          <span>{order.remarques}</span>
        </div>
      )}

      {/* Footer signature */}
      <div className="mt-6 pt-3 border-t border-slate-300 flex justify-between text-xs text-slate-400">
        <span>Mahieu Sablage Peinture — Fiche atelier</span>
        <span>Imprimé le {new Date().toLocaleDateString("fr-BE")}</span>
      </div>
    </div>
  );
}

export default function FicheAtelierPage() {
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(setOrder)
      .catch((e) => setError(e.message));
  }, [params.id]);

  useEffect(() => {
    if (order) {
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [order]);

  if (error) return <div className="p-8 text-red-500">Erreur: {error}</div>;
  if (!order) return <div className="p-8 text-slate-400">Chargement…</div>;

  const hasSubOrders = order.subOrders && order.subOrders.length > 0;
  const clientNom = order.client?.nom ?? "";

  return (
    <div className="max-w-[210mm] mx-auto bg-slate-100 p-4 print:p-0 print:bg-white">
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 8mm; size: A4; }
          .fiche-sheet { page-break-after: always; }
          .fiche-sheet:last-child { page-break-after: avoid; }
        }
      `}</style>

      {/* Print button */}
      <div className="print:hidden mb-4 flex gap-2 items-center">
        <button onClick={() => window.print()} className="bg-slate-800 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-slate-900">
          🖨 Imprimer / PDF
        </button>
        <span className="text-sm text-slate-500">
          {hasSubOrders ? `${order.subOrders!.length} fiches` : "1 fiche"}
        </span>
      </div>

      {hasSubOrders ? (
        order.subOrders!.map((sub) => (
          <FicheSheet key={sub.id} order={sub} clientNom={clientNom} />
        ))
      ) : (
        <FicheSheet order={{ ...order, stationStatuses: order.stationStatuses ?? [] }} clientNom={clientNom} />
      )}
    </div>
  );
}
