import { tokenIcons } from "../resources/icons";
import type { Blockchain } from "../types";
import { BasePicker } from "./BasePicker";
import AppIcon from "../assets/icon.svg";
import { BlockchainInfo } from "./BlockchainInfo";

interface TokenPickerProps {
  blockchain: Blockchain;
  onSelect?: (tokenId: string) => void;
}

const TokenPicker = ({ blockchain, onSelect }: TokenPickerProps) => {
  return (
    <>
      {/* Blockchain Info */}
      <BlockchainInfo />

      <BasePicker
        title="Select a Token"
        items={[
          ...blockchain.tokens.map((token) => ({
            id: token.id,
            name: `${token.name} (${token.symbol || ""})`,
            icon: tokenIcons[token.id],
          })),
          {
            id: "custom",
            name: "Custom Token",
            icon: AppIcon,
          },
        ]}
        onSelect={onSelect}
      />
    </>
  );
};

export { TokenPicker };
