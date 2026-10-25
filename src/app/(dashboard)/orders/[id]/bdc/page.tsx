"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Order {
  id: string; ref: string; dateDepot: string; statut: string; priorite: string;
  nDevis: string | null; delaiSouhaite: string | null; description: string | null;
  remarques: string | null; nbPieces: number | null; prixHT: number | null;
  nettoyageHP: string; sablage: string; metallisation: string; primaire: string;
  thermolaquage: string; peintureLiquide: string;
  ral: string | null; texture: string | null; brillance: string | null;
  client?: { nom: string; contact: string | null; telephone: string | null; email: string | null; adresse: string | null; tvaNumber: string | null };
  subOrders?: Order[];
}

function TreatmentLine({ order }: { order: Order }) {
  const items: string[] = [];
  if (order.nettoyageHP === "Oui") items.push("Nettoyage HP");
  if (order.sablage === "Oui") items.push("Sablage");
  if (order.metallisation === "Oui") items.push("Métallisation");
  if (order.primaire !== "Non") items.push(`Primaire (${order.primaire})`);
  if (order.thermolaquage === "Oui") items.push("Thermolaquage");
  if (order.peintureLiquide === "Oui") items.push("Peinture liquide");
  return <>{items.join(" → ")}</>;
}

function OrderBlock({ order, isChild }: { order: Order; isChild?: boolean }) {
  return (
    <div className={`${isChild ? "border-t border-dashed border-slate-300 pt-3 mt-3" : ""}`}>
      {isChild && <div className="font-mono font-bold text-sm mb-1">{order.ref}</div>}
      <table className="w-full text-xs border-collapse">
        <tbody>
          <tr>
            <td className="border border-slate-300 px-2 py-1 bg-slate-50 font-semibold w-32">Traitements</td>
            <td className="border border-slate-300 px-2 py-1"><TreatmentLine order={order} /></td>
          </tr>
          {(order.ral || order.texture || order.brillance) && (
            <tr>
              <td className="border border-slate-300 px-2 py-1 bg-slate-50 font-semibold">Finition</td>
              <td className="border border-slate-300 px-2 py-1">
                {[order.ral && `RAL ${order.ral}`, order.texture, order.brillance].filter(Boolean).join(" / ")}
              </td>
            </tr>
          )}
          {order.nbPieces && (
            <tr>
              <td className="border border-slate-300 px-2 py-1 bg-slate-50 font-semibold">Nb pièces</td>
              <td className="border border-slate-300 px-2 py-1">{order.nbPieces}</td>
            </tr>
          )}
          {order.description && (
            <tr>
              <td className="border border-slate-300 px-2 py-1 bg-slate-50 font-semibold">Description</td>
              <td className="border border-slate-300 px-2 py-1">{order.description}</td>
            </tr>
          )}
          {order.remarques && (
            <tr>
              <td className="border border-slate-300 px-2 py-1 bg-slate-50 font-semibold">Remarques</td>
              <td className="border border-slate-300 px-2 py-1">{order.remarques}</td>
            </tr>
          )}
          {order.prixHT != null && (
            <tr>
              <td className="border border-slate-300 px-2 py-1 bg-slate-50 font-semibold">Prix HT</td>
              <td className="border border-slate-300 px-2 py-1">{order.prixHT.toFixed(2)} €</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function BDCPrintPage() {
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
      // Small delay to let styles render before print dialog
      const t = setTimeout(() => window.print(), 500);
      return () => clearTimeout(t);
    }
  }, [order]);

  if (error) return <div className="p-8 text-red-500">Erreur: {error}</div>;
  if (!order) return <div className="p-8 text-slate-400">Chargement…</div>;

  const hasSubOrders = order.subOrders && order.subOrders.length > 0;
  const tvaRate = 0.21;
  const totalHT = hasSubOrders
    ? order.subOrders!.reduce((sum, s) => sum + (s.prixHT || 0), 0)
    : (order.prixHT || 0);
  const totalTVA = totalHT * tvaRate;
  const totalTTC = totalHT + totalTVA;

  return (
    <div className="max-w-[210mm] mx-auto p-6 bg-white text-slate-900 print:p-4 print:text-[11px]">
      <style>{`@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } @page { margin: 10mm; } }`}</style>

      {/* Header */}
      <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-blue-600">
        <div>
          <div className="text-xl font-bold text-blue-700">MAHIEU SABLAGE PEINTURE</div>
          <div className="text-xs text-slate-500 mt-1">Sablage · Thermolaquage · Peinture · Métallisation</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold font-mono">{order.ref}</div>
          <div className="text-xs text-slate-500">BON DE COMMANDE</div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
        <div className="border border-slate-200 rounded p-3">
          <div className="font-semibold text-slate-500 text-[10px] uppercase mb-1">Client</div>
          <div className="font-bold">{order.client?.nom}</div>
          {order.client?.contact && <div>{order.client.contact}</div>}
          {order.client?.adresse && <div className="text-slate-600">{order.client.adresse}</div>}
          {order.client?.telephone && <div>Tél: {order.client.telephone}</div>}
          {order.client?.tvaNumber && <div>TVA: {order.client.tvaNumber}</div>}
        </div>
        <div className="border border-slate-200 rounded p-3">
          <div className="font-semibold text-slate-500 text-[10px] uppercase mb-1">Commande</div>
          <div>Date dépôt: <strong>{order.dateDepot}</strong></div>
          <div>Priorité: <strong>{order.priorite}</strong></div>
          {order.nDevis && <div>N° devis: {order.nDevis}</div>}
          {order.delaiSouhaite && <div>Délai souhaité: {order.delaiSouhaite}</div>}
        </div>
      </div>

      {/* Treatments */}
      <div className="mb-6">
        <div className="font-semibold text-sm mb-2 text-blue-700">Détail des traitements</div>
        {hasSubOrders ? (
          order.subOrders!.map((sub) => <OrderBlock key={sub.id} order={sub} isChild />)
        ) : (
          <OrderBlock order={order} />
        )}
      </div>

      {/* Totals */}
      {totalHT > 0 && (
        <div className="flex justify-end mb-6">
          <table className="text-xs border-collapse">
            <tbody>
              <tr><td className="px-3 py-1 text-right text-slate-500">Total HT</td><td className="px-3 py-1 font-medium text-right">{totalHT.toFixed(2)} €</td></tr>
              <tr><td className="px-3 py-1 text-right text-slate-500">TVA 21%</td><td className="px-3 py-1 font-medium text-right">{totalTVA.toFixed(2)} €</td></tr>
              <tr className="border-t border-slate-300"><td className="px-3 py-1 text-right font-bold">Total TTC</td><td className="px-3 py-1 font-bold text-right">{totalTTC.toFixed(2)} €</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8 mt-8 pt-4 border-t border-slate-200 text-xs">
        <div>
          <div className="font-semibold mb-8">Signature client</div>
          <div className="border-b border-slate-300 w-full"></div>
        </div>
        <div>
          <div className="font-semibold mb-8">Signature atelier</div>
          <div className="border-b border-slate-300 w-full"></div>
        </div>
      </div>

      {/* Print button (hidden in print) */}
      <div className="mt-6 text-center print:hidden">
        <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          Imprimer / PDF
        </button>
      </div>
    </div>
  );
}
