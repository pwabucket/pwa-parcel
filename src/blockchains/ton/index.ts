import type { Token } from "../../types";

export const id = "ton";
export const name = "The Open Network";
export const tokens: Token[] = [
  {
    id: "ton",
    name: "Toncoin",
    symbol: "TON",
  },
  {
    id: "usdt",
    name: "Tether",
    symbol: "USDT",
    address: "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs",
  },
];
export { TONParcel as Parcel } from "../../parcels/TONParcel";

export { TONCustomTokenForm as CustomTokenForm } from "./TONCustomTokenForm";
export { TONWalletForm as WalletForm } from "./TONWalletForm";
export { TONConfigForm as ConfigForm } from "./TONConfigForm";
