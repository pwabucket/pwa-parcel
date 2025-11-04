import { EVMParcel, type EVMParcelOptions } from "../../parcels/EVMParcel";
import type { Token } from "../../types";
export * from "../../partials/evm";

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
    address: import.meta.env.PROD
      ? "0x55d398326f99059ff775485246999027b3197955"
      : "0x337610d27c682e347c9cd60bd4b3b107c9d34ddd",
  },
];

export class Parcel extends EVMParcel {
  constructor(options: EVMParcelOptions) {
    super({
      ...options,
      network: "bsc",
    });
  }
}
