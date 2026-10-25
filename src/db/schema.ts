import { pgTable, text, integer, real, timestamp, uniqueIndex, uuid, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── Users ──────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("operateur"), // admin | operateur
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Clients ────────────────────────────────────────────────
export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull().default("Entreprise"),
  nom: text("nom").notNull(),
  contact: text("contact"),
  telephone: text("telephone"),
  email: text("email"),
  adresse: text("adresse"),
  tvaNumber: text("tva_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Workshop Stations ──────────────────────────────────────
export const STATIONS = [
  { code: "ACC", label: "Accueil" },
  { code: "NHP", label: "Nettoyage HP" },
  { code: "SAB", label: "Sablage" },
  { code: "MIC", label: "Microbillage / Ponçage" },
  { code: "MET", label: "Métallisation" },
  { code: "PRI", label: "Primaire" },
  { code: "TL_ACC", label: "TL - Accrochage" },
  { code: "TL_POU", label: "TL - Poudrage" },
  { code: "TL_FOU", label: "TL - Four" },
  { code: "TL_DEC", label: "TL - Décrochage" },
  { code: "PL_CAC", label: "PL - Cabine" },
  { code: "PL_FIN", label: "PL - Finition" },
  { code: "PL_DCA", label: "PL - Décrochage" },
  { code: "EMB", label: "Emballage" },
  { code: "EXP", label: "Expédition" },
] as const;

export type StationCode = (typeof STATIONS)[number]["code"];

// ─── Orders (BDC) ───────────────────────────────────────────
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  ref: text("ref").notNull().unique(),
  parentId: uuid("parent_id"), // self-ref for sub-orders
  dateDepot: text("date_depot").notNull(),
  priorite: text("priorite").notNull().default("Normal"),
  clientId: uuid("client_id").notNull().references(() => clients.id),
  nDevis: text("n_devis"),

  // Traitements (checkboxes stored as "Oui"/"Non")
  nettoyageHP: text("nettoyage_hp").notNull().default("Non"),
  sablage: text("sablage").notNull().default("Non"),
  prepDecapante: text("prep_decapante"), // legacy/import
  metallisation: text("metallisation").notNull().default("Non"),
  primaire: text("primaire").notNull().default("Non"), // "Non" | "Liquide" | "Epoxy four"
  thermolaquage: text("thermolaquage").notNull().default("Non"),
  peintureLiquide: text("peinture_liquide").notNull().default("Non"),
  typeFinition: text("type_finition"), // legacy/import
  ral: text("ral"),
  texture: text("texture"),
  brillance: text("brillance"),

  // Pieces
  nbPieces: integer("nb_pieces"),
  description: text("description"),
  remarques: text("remarques"),

  // Dates & pricing
  delaiSouhaite: text("delai_souhaite"),
  dateCreation: timestamp("date_creation").defaultNow(),
  dateExpedition: text("date_expedition"),
  prixHT: real("prix_ht"),
  tvaPercent: real("tva_percent"),
  prixTTC: real("prix_ttc"),

  // Lifecycle
  statut: text("statut").notNull().default("En attente"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Station Statuses ───────────────────────────────────────
export const stationStatuses = pgTable("station_statuses", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  station: text("station").notNull(),
  status: text("status").notNull().default("En attente"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  orderStationIdx: uniqueIndex("order_station_idx").on(table.orderId, table.station),
}));

// ─── Scan Logs ──────────────────────────────────────────────
export const scanLogs = pgTable("scan_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  station: text("station").notNull(),
  status: text("status").notNull(),
  userId: uuid("user_id").references(() => users.id),
  remark: text("remark"),
  synced: boolean("synced").notNull().default(true),
  scannedAt: timestamp("scanned_at").defaultNow(),
});

// ─── Photos ─────────────────────────────────────────────────
export const photos = pgTable("photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  url: text("url").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// ─── Audit Logs ─────────────────────────────────────────────
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  field: text("field"),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  userId: uuid("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Config ─────────────────────────────────────────────────
export const config = pgTable("config", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});
