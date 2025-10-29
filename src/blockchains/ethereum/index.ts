import type { Token } from "../../types";

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

export { EVMCustomTokenForm as CustomTokenForm } from "../../partials/evm/EVMCustomTokenForm";
export { EVMWalletForm as WalletForm } from "../../partials/evm/EVMWalletForm";
