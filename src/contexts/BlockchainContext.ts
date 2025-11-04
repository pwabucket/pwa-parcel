import { createContext } from "react";
import type { useBlockchain } from "../hooks/useBlockChain";

const BlockchainContext = createContext<ReturnType<
  typeof useBlockchain
> | null>(null);

export { BlockchainContext };
