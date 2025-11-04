import { useContext } from "react";
import { BlockchainContext } from "../contexts/BlockchainContext";

const useBlockChainContext = () => useContext(BlockchainContext)!;

export { useBlockChainContext };
