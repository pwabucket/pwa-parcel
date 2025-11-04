import { EVMParcel, type EVMParcelOptions } from "../../parcels/EVMParcel";
import type { Token } from "../../types";
export * from "../../partials/evm";

export const id = "optimism";
export const name = "Optimism";
export const tokens: Token[] = [
  {
    id: "eth",
    name: "Ether",
    symbol: "ETH",
  },
  {
    id: "op",
    name: "Optimism",
    symbol: "OP",
    decimals: 18,
    address: "0x4200000000000000000000000000000000000042",
  },
  {
    id: "usdt",
    name: "Tether",
    symbol: "USDT",
    decimals: 18,
    address: "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58",
  },
];

export class Parcel extends EVMParcel {
  constructor(options: EVMParcelOptions) {
    super({
      ...options,
      network: "optimism",
    });
  }
}
