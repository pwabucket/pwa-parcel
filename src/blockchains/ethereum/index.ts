import { EVMParcel, type EVMParcelOptions } from "../../parcels/EVMParcel";
import type { Token } from "../../types";
export * from "../../partials/evm";

export const id = "ethereum";
export const name = "Ethereum";
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
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  },
];

export class Parcel extends EVMParcel {
  constructor(options: EVMParcelOptions) {
    super({
      ...options,
      network: "ethereum",
    });
  }
}
