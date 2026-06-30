/**
 * Egyptian Governorates (المحافظات المصرية)
 * All 27 governorates of Egypt
 */

export const EGYPTIAN_GOVERNORATES = [
  "Cairo",
  "Giza",
  "Qalyubia",
  "Alexandria",
  "Beheira",
  "Matrouh",
  "Kafr El Sheikh",
  "Dakahlia",
  "Damietta",
  "Sharqia",
  "Gharbia",
  "Monufia",
  "Port Said",
  "Ismailia",
  "Suez",
  "North Sinai",
  "South Sinai",
  "Fayoum",
  "Beni Suef",
  "Minya",
  "Asyut",
  "Sohag",
  "Qena",
  "Luxor",
  "Aswan",
  "Banha",
  "Red Sea",
  "New Valley",
] as const;

export type EgyptianGovernorate = typeof EGYPTIAN_GOVERNORATES[number];
