import type { Token } from "../../types";

const bscTokens: Token[] = [
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

export { bscTokens };
