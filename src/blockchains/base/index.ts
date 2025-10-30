import { EVMParcel } from "../../parcels/EVMParcel";
import type { Token } from "../../types";

export const id = "base";
export const name = "Base";
export const tokens: Token[] = [
  {
    id: "eth",
    name: "Ether",
    symbol: "ETH",
  },
  {
    id: "usdt",
    name: "Tether",
    symbol: "USDT",
    decimals: 18,
    address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
  },
];

export class Parcel extends EVMParcel {
  constructor() {
    super({
      network: "base",
    });
  }
}

export { EVMWalletForm as WalletForm } from "../../partials/evm/EVMWalletForm";
export { EVMCustomTokenForm as CustomTokenForm } from "../../partials/evm/EVMCustomTokenForm";
