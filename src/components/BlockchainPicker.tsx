import { blockchains } from "../resources/blockchains";
import { BasePicker } from "./BasePicker";

interface BlockchainPickerProps {
  onSelect?: (blockchainId: string) => void;
}

const BlockchainPicker = ({ onSelect }: BlockchainPickerProps) => {
  return (
    <>
      <BasePicker
        title="Select a Blockchain"
        items={Object.values(blockchains).map((blockchain) => ({
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
