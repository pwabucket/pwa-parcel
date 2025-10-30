import { EVMParcel } from "../../parcels/EVMParcel";
import type { Token } from "../../types";

export const id = "arbitrum";
export const name = "Arbitrum";
export const tokens: Token[] = [
  {
    id: "eth",
    name: "Ether",
    symbol: "ETH",
  },
  {
    id: "arb",
    name: "Arbitrum",
    symbol: "ARB",
    decimals: 18,
    address: "0x912CE59144191C1204E64559FE8253a0e49E6548",
  },
  {
    id: "usdt",
    name: "Tether",
    symbol: "USDT",
    decimals: 18,
    address: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
  },
];

export class Parcel extends EVMParcel {
  constructor() {
    super({
      network: "arbitrum",
    });
  }
}

export { EVMWalletForm as WalletForm } from "../../partials/evm/EVMWalletForm";
export { EVMCustomTokenForm as CustomTokenForm } from "../../partials/evm/EVMCustomTokenForm";
