import { EVMParcel } from "../../parcels/EVMParcel";
import type { Token } from "../../types";

export const id = "bsc";
export const name = "Binance Smart Chain";
export const tokens: Token[] = [
  {
    id: "bnb",
    name: "Binance Coin",
    symbol: "BNB",
  },
  {
    id: "usdt",
    name: "Tether",
    symbol: "USDT",
    decimals: 18,
    address: "0x55d398326f99059ff775485246999027b3197955",
  },
];

export class Parcel extends EVMParcel {
  constructor() {
    super({
      network: "bsc",
    });
  }
}

export { EVMCustomTokenForm as CustomTokenForm } from "../../partials/evm/EVMCustomTokenForm";
export { EVMWalletForm as WalletForm } from "../../partials/evm/EVMWalletForm";
