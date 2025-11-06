import path from "path-browserify";

const blockchainsIconGlob = import.meta.glob("../assets/blockchains/*.png", {
  eager: true,
  import: "default",
  query: {
    w: 128,
    h: 128,
    format: "webp",
  },
}) as Record<string, string>;

const tokensIconGlob = import.meta.glob("../assets/tokens/*.png", {
  eager: true,
  import: "default",
  query: {
    w: 64,
    h: 64,
    format: "webp",
  },
}) as Record<string, string>;

const blockchainIcons = Object.entries(blockchainsIconGlob).reduce(
  (result: Record<string, string>, [filepath, icon]) => {
    result[path.basename(filepath, ".png")] = icon;
    return result;
  },
  {}
);

const tokenIcons = Object.entries(tokensIconGlob).reduce(
  (result: Record<string, string>, [filepath, icon]) => {
    result[path.basename(filepath, ".png")] = icon;
    return result;
  },
  {}
);

export { blockchainIcons, tokenIcons };
