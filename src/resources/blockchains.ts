import path from "path-browserify";
import type { Blockchain } from "../types";
import { blockchainIcons, tokenIcons } from "./icons";

const blockchainGlob = import.meta.glob("../blockchains/*/index.ts", {
  eager: true,
}) as Record<string, Blockchain>;

const blockchains = Object.entries(blockchainGlob).reduce(
  (result: Record<string, Blockchain>, [filepath, blockchain]) => {
    const id = path.basename(path.dirname(filepath));
    result[id] = {
      ...blockchain,
      id,
      icon: blockchainIcons[id],
      tokens: blockchain.tokens.map((token) => ({
        ...token,
        icon: tokenIcons[token.id],
      })),
    };
    return result;
  },
  {}
);

export { blockchains };
