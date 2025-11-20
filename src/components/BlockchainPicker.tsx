import { blockchains } from "../resources/blockchains";
import { BasePicker } from "./BasePicker";
import { BlockchainInfo } from "./BlockchainInfo";

interface BlockchainPickerProps {
  group: string | null;
  onSelect?: (blockchainId: string) => void;
}

const BlockchainPicker = ({ group, onSelect }: BlockchainPickerProps) => {
  return (
    <>
      {/* Blockchain Info */}
      <BlockchainInfo />

      <BasePicker
        title="Select a Blockchain"
        items={Object.values(blockchains)
          .filter((blockchain) => !group || blockchain.group === group)
          .map((blockchain) => ({
            id: blockchain.id,
            name: blockchain.name,
            icon: blockchain.icon,
          }))}
        onSelect={onSelect}
      />
    </>
  );
};

export { BlockchainPicker };
