import { tokenIcons } from "../resources/icons";
import type { Token } from "../types";
import { BasePicker } from "./BasePicker";
import AppIcon from "../assets/icon.svg";

interface TokenPickerProps {
  tokens: Token[];
  onSelect?: (tokenId: string) => void;
}

const TokenPicker = ({ tokens, onSelect }: TokenPickerProps) => {
  return (
    <>
      <BasePicker
        title="Select a Token"
        items={[
          ...tokens.map((token) => ({
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
