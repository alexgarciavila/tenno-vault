import type { IncarnonWeapon } from "../../data/catalog-schema";
import { computeInventorySummary, type InventorySummary } from "../../lib/inventory";
import type { UserIncarnonProgress } from "../../lib/user-types";

export type WeaponViewModel = InventorySummary;

export function buildWeaponViewModel(
  weapon: IncarnonWeapon,
  progress?: UserIncarnonProgress,
): WeaponViewModel {
  return computeInventorySummary(weapon, progress);
}
