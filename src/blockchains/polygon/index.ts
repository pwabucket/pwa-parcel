import { EVMParcel, type EVMParcelOptions } from "../../parcels/EVMParcel";
import type { Token } from "../../types";
export * from "../../partials/evm";

export const id = "polygon";
export const name = "Polygon";
export const tokens: Token[] = [
  {
    id: "pol",
    name: "Polygon",
    symbol: "POL",
  },
  {
    id: "usdt",
    name: "Tether",
    symbol: "USDT",
    decimals: 18,
    address: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
  },
];

export class Parcel extends EVMParcel {
  constructor(options: EVMParcelOptions) {
    super({
      ...options,
      network: "polygon",
    });
  }
}
