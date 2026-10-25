"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Client {
  id: string;
  nom: string;
  type: string;
  contact: string | null;
  telephone: string | null;
  email: string | null;
}

interface PhotoPreview {
  id: string;
  file: File;
  url: string;
}

interface SubOrder {
  key: string;
  nettoyageHP: boolean;
  sablage: boolean;
  metallisation: boolean;
  primaire: string;
  thermolaquage: boolean;
  peintureLiquide: boolean;
  ral: string;
  texture: string;
  brillance: string;
  nbPieces: string;
  description: string;
  remarques: string;
  prixHT: string;
  photos: PhotoPreview[];
}

function createEmptySubOrder(): SubOrder {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    nettoyageHP: false, sablage: false, metallisation: false,
    primaire: "Non", thermolaquage: false, peintureLiquide: false,
    ral: "", texture: "", brillance: "",
    nbPieces: "", description: "", remarques: "", prixHT: "",
    photos: [],
  };
}

// ─── Searchable Client Combobox ───────────────────────────
function ClientCombobox({
  clients, value, onChange, onCreateNew,
}: {
  clients: Client[]; value: string; onChange: (id: string) => void; onCreateNew: () => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selected = clients.find((c) => c.id === value);
  const filtered = query
    ? clients.filter((c) => c.nom.toLowerCase().includes(query.toLowerCase()))
    : clients;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <input
        type="text"
        value={open ? query : selected ? selected.nom : query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); if (!e.target.value) onChange(""); }}
        onFocus={() => { setOpen(true); if (selected) setQuery(selected.nom); }}
        placeholder="Rechercher un client..."
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      {open && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filtered.length > 0 ? filtered.map((c) => (
            <button key={c.id} type="button"
              onClick={() => { onChange(c.id); setQuery(c.nom); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${c.id === value ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-700"}`}>
              {c.nom}<span className="text-slate-400 ml-2 text-xs">{c.type}</span>
            </button>
          )) : (
            <div className="px-3 py-3 text-sm text-slate-500 text-center">Aucun client trouvé</div>
          )}
          <button type="button" onClick={() => { setOpen(false); onCreateNew(); }}
            className="w-full text-left px-3 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 border-t border-slate-100 transition-colors">
            + Créer un nouveau client
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Treatment Block (reused per sub-order) ──────────────
function TreatmentBlock({
  sub, index, total, onUpdate, onRemove, onPhotos, onRemovePhoto,
}: {
  sub: SubOrder; index: number; total: number;
  onUpdate: (updates: Partial<SubOrder>) => void;
  onRemove: () => void;
  onPhotos: (files: FileList | null) => void;
  onRemovePhoto: (photoId: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleMetallisation = (checked: boolean) => {
    if (checked) onUpdate({ metallisation: true, sablage: true });
    else onUpdate({ metallisation: false });
  };

  const hasFinition = sub.thermolaquage || sub.peintureLiquide;

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-5 relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
          {total > 1 ? `Sous-BDC ${String.fromCharCode(65 + index)}` : "Traitements & Pièces"}
        </h2>
        {total > 1 && (
          <button type="button" onClick={onRemove} className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">Supprimer</button>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
            <input type="checkbox" checked={sub.nettoyageHP} onChange={(e) => onUpdate({ nettoyageHP: e.target.checked })} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
            <span className="text-sm font-medium text-slate-900">Nettoyage HP</span>
          </label>

          <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
            <input type="checkbox" checked={sub.sablage} onChange={(e) => onUpdate({ sablage: e.target.checked })} disabled={sub.metallisation} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 disabled:opacity-60" />
            <span className="text-sm font-medium text-slate-900">
              Sablage
              {sub.metallisation && <span className="text-xs text-slate-400 block">(auto: métallisation)</span>}
            </span>
          </label>

          <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
            <input type="checkbox" checked={sub.metallisation} onChange={(e) => handleMetallisation(e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
            <span className="text-sm font-medium text-slate-900">Métallisation</span>
          </label>

          <div className="p-3 border border-slate-200 rounded-lg col-span-2 sm:col-span-1">
            <span className="text-sm font-medium text-slate-900 block mb-2">Primaire</span>
            <select value={sub.primaire} onChange={(e) => onUpdate({ primaire: e.target.value })} className="w-full text-sm px-2 py-1.5 border border-slate-300 rounded bg-white">
              <option value="Non">Non</option>
              <option value="Liquide">Liquide</option>
              <option value="Epoxy four">Époxy au four</option>
            </select>
          </div>

          <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
            <input type="checkbox" checked={sub.thermolaquage} onChange={(e) => onUpdate({ thermolaquage: e.target.checked })} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
            <span className="text-sm font-medium text-slate-900">Thermolaquage</span>
          </label>

          <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
            <input type="checkbox" checked={sub.peintureLiquide} onChange={(e) => onUpdate({ peintureLiquide: e.target.checked })} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
            <span className="text-sm font-medium text-slate-900">Peinture liquide</span>
          </label>
        </div>

        {hasFinition && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">RAL</label>
              <input type="text" value={sub.ral} onChange={(e) => onUpdate({ ral: e.target.value })} placeholder="ex: 9005" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Texture</label>
              <select value={sub.texture} onChange={(e) => onUpdate({ texture: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                <option value="">--</option>
                <option value="Lisse">Lisse</option>
                <option value="Texture">Texturé</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Brillance</label>
              <select value={sub.brillance} onChange={(e) => onUpdate({ brillance: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                <option value="">--</option>
                <option value="Mat">Mat</option>
                <option value="Satine">Satiné</option>
                <option value="Brillant">Brillant</option>
              </select>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de pièces</label>
              <input type="number" value={sub.nbPieces} onChange={(e) => onUpdate({ nbPieces: e.target.value })} min="0" placeholder="Optionnel" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prix HT (€)</label>
              <input type="number" value={sub.prixHT} onChange={(e) => onUpdate({ prixHT: e.target.value })} step="0.01" min="0" placeholder="0.00" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea value={sub.description} onChange={(e) => onUpdate({ description: e.target.value })} rows={2} placeholder="Type de pièces, dimensions..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Remarques</label>
            <textarea value={sub.remarques} onChange={(e) => onUpdate({ remarques: e.target.value })} rows={2} placeholder="Instructions spéciales..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <label className="block text-sm font-medium text-slate-700 mb-2">Photos</label>
          {sub.photos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
              {sub.photos.map((photo) => (
                <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200">
                  <img src={photo.url} alt="Photo" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => onRemovePhoto(photo.id)} className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs">&times;</button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => cameraRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 text-sm transition-colors">
              📷 Photo
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 text-sm transition-colors">
              📁 Fichiers
            </button>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={(e) => onPhotos(e.target.files)} className="hidden" />
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={(e) => onPhotos(e.target.files)} className="hidden" />
          </div>
          {sub.photos.length > 0 && <p className="text-xs text-slate-400 mt-1">{sub.photos.length} photo{sub.photos.length > 1 ? "s" : ""}</p>}
        </div>
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function NewOrderPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientNom, setNewClientNom] = useState("");
  const [newClientType, setNewClientType] = useState("Entreprise");
  const [newClientTelephone, setNewClientTelephone] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [dateDepot, setDateDepot] = useState(new Date().toISOString().split("T")[0]);
  const [priorite, setPriorite] = useState("Normal");
  const [nDevis, setNDevis] = useState("");
  const [delaiSouhaite, setDelaiSouhaite] = useState("");
  const [tvaPercent, setTvaPercent] = useState("21");
  const [subOrders, setSubOrders] = useState<SubOrder[]>([createEmptySubOrder()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const totalHT = subOrders.reduce((sum, s) => sum + (parseFloat(s.prixHT) || 0), 0);
  const totalTTC = totalHT ? (totalHT * (1 + (parseFloat(tvaPercent) || 21) / 100)).toFixed(2) : "";

  useEffect(() => {
    fetch("/api/clients").then((r) => r.json()).then(setClients).catch(() => {});
  }, []);

  const updateSubOrder = useCallback((index: number, updates: Partial<SubOrder>) => {
    setSubOrders((prev) => prev.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  }, []);

  const removeSubOrder = useCallback((index: number) => {
    setSubOrders((prev) => {
      prev[index].photos.forEach((p) => URL.revokeObjectURL(p.url));
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const addPhotos = useCallback((index: number, files: FileList | null) => {
    if (!files) return;
    const newPhotos: PhotoPreview[] = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((file) => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, file, url: URL.createObjectURL(file) }));
    setSubOrders((prev) => prev.map((s, i) => i === index ? { ...s, photos: [...s.photos, ...newPhotos] } : s));
  }, []);

  const removePhoto = useCallback((index: number, photoId: string) => {
    setSubOrders((prev) => prev.map((s, i) => {
      if (i !== index) return s;
      const photo = s.photos.find((p) => p.id === photoId);
      if (photo) URL.revokeObjectURL(photo.url);
      return { ...s, photos: s.photos.filter((p) => p.id !== photoId) };
    }));
  }, []);

  const handleCreateClient = async () => {
    if (!newClientNom.trim()) return;
    try {
      const res = await fetch("/api/clients", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: newClientType, nom: newClientNom, telephone: newClientTelephone || undefined, email: newClientEmail || undefined }),
      });
      if (!res.ok) throw new Error();
      const client = await res.json();
      setClients((prev) => [...prev, client].sort((a, b) => a.nom.localeCompare(b.nom)));
      setClientId(client.id);
      setShowNewClient(false);
      setNewClientNom(""); setNewClientTelephone(""); setNewClientEmail("");
    } catch { setError("Impossible de créer le client"); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!clientId) { setError("Veuillez sélectionner un client"); return; }
    setSubmitting(true);

    try {
      const payload = subOrders.length === 1
        ? {
            clientId, dateDepot, priorite,
            nDevis: nDevis || undefined, delaiSouhaite: delaiSouhaite || undefined,
            ...subOrders[0],
          }
        : {
            clientId, dateDepot, priorite,
            nDevis: nDevis || undefined, delaiSouhaite: delaiSouhaite || undefined,
            subOrders: subOrders.map((s) => ({
              nettoyageHP: s.nettoyageHP, sablage: s.sablage, metallisation: s.metallisation,
              primaire: s.primaire, thermolaquage: s.thermolaquage, peintureLiquide: s.peintureLiquide,
              ral: s.ral || undefined, texture: s.texture || undefined, brillance: s.brillance || undefined,
              nbPieces: s.nbPieces || undefined, description: s.description || undefined,
              remarques: s.remarques || undefined, prixHT: s.prixHT || undefined,
            })),
          };

      const res = await fetch("/api/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Erreur création commande"); }
      const result = await res.json();

      // Upload photos
      for (let i = 0; i < subOrders.length; i++) {
        const photos = subOrders[i].photos;
        if (photos.length > 0) {
          for (const p of photos) {
            const fd = new FormData();
            fd.append("orderId", result.id);
            fd.append("file", p.file);
            await fetch("/api/photos", { method: "POST", body: fd });
          }
        }
      }

      router.push("/orders");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Nouveau Bon de Commande</h1>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Client */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Client</h2>
          {!showNewClient ? (
            <ClientCombobox clients={clients} value={clientId} onChange={setClientId} onCreateNew={() => setShowNewClient(true)} />
          ) : (
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">Nouveau client</span>
                <button type="button" onClick={() => setShowNewClient(false)} className="text-sm text-blue-600 hover:text-blue-800">Annuler</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select value={newClientType} onChange={(e) => setNewClientType(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                  <option value="Entreprise">Entreprise</option>
                  <option value="Particulier">Particulier</option>
                </select>
                <input type="text" placeholder="Nom *" value={newClientNom} onChange={(e) => setNewClientNom(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                <input type="tel" placeholder="Téléphone" value={newClientTelephone} onChange={(e) => setNewClientTelephone(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                <input type="email" placeholder="Email" value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
              <button type="button" onClick={handleCreateClient} disabled={!newClientNom.trim()} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">Créer</button>
            </div>
          )}
        </section>

        {/* Informations générales */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Informations générales</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date de dépôt *</label>
              <input type="date" value={dateDepot} onChange={(e) => setDateDepot(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priorité</label>
              <select value={priorite} onChange={(e) => setPriorite(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                <option value="Normal">Normal</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">N° Devis</label>
              <input type="text" value={nDevis} onChange={(e) => setNDevis(e.target.value)} placeholder="Optionnel" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Délai souhaité</label>
              <input type="text" value={delaiSouhaite} onChange={(e) => setDelaiSouhaite(e.target.value)} placeholder="ex: 2 semaines" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
        </section>

        {/* Sub-order blocks */}
        {subOrders.map((sub, i) => (
          <TreatmentBlock key={sub.key} sub={sub} index={i} total={subOrders.length}
            onUpdate={(updates) => updateSubOrder(i, updates)} onRemove={() => removeSubOrder(i)}
            onPhotos={(files) => addPhotos(i, files)} onRemovePhoto={(photoId) => removePhoto(i, photoId)} />
        ))}

        <button type="button" onClick={() => setSubOrders((prev) => [...prev, createEmptySubOrder()])}
          className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-600 text-sm font-medium transition-colors">
          + Ajouter un sous bon de commande
        </button>

        {/* Total */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Total</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Total HT</label>
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700">
                {totalHT > 0 ? `${totalHT.toFixed(2)} €` : "—"}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">TVA (%)</label>
              <input type="number" value={tvaPercent} onChange={(e) => setTvaPercent(e.target.value)} step="0.01" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Total TTC</label>
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900">
                {totalTTC ? `${totalTTC} €` : "—"}
              </div>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 pb-8">
          <button type="button" onClick={() => router.back()} className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">Annuler</button>
          <button type="submit" disabled={submitting} className="w-full sm:w-auto px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors">
            {submitting ? "Création..." : `Créer le BDC${subOrders.length > 1 ? ` (${subOrders.length} sous-BDC)` : ""}`}
          </button>
        </div>
      </form>
    </div>
  );
}
