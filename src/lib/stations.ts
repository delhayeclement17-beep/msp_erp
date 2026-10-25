import { STATIONS } from "@/db/schema";
import type { StationCode } from "@/db/schema";

export function getApplicableStations(order: {
  nettoyageHP: string;
  sablage?: string;
  prepDecapante?: string | null;
  metallisation: string;
  primaire: string;
  thermolaquage?: string;
  peintureLiquide?: string;
  typeFinition?: string | null;
}): StationCode[] {
  const codes: StationCode[] = ["ACC"];

  if (order.nettoyageHP === "Oui") codes.push("NHP");

  if (order.sablage === "Oui" || order.prepDecapante === "Sablage" || order.prepDecapante === "Grenaillage") {
    codes.push("SAB");
  }
  if (order.prepDecapante === "Microbillage" || order.prepDecapante === "Poncage") {
    codes.push("MIC");
  }

  if (order.metallisation === "Oui") codes.push("MET");
  if (order.primaire && order.primaire !== "Non") codes.push("PRI");

  if (order.thermolaquage === "Oui" || order.typeFinition === "Thermo laquage") {
    codes.push("TL_ACC", "TL_POU", "TL_FOU", "TL_DEC");
  }
  if (order.peintureLiquide === "Oui" || order.typeFinition === "Peinture liquide") {
    codes.push("PL_CAC", "PL_FIN", "PL_DCA");
  }

  codes.push("EMB", "EXP");
  return codes;
}

export function getStationLabel(code: StationCode): string {
  return STATIONS.find((s) => s.code === code)?.label ?? code;
}
