import { blockchainIcons } from "../resources/icons";
import { BasePicker } from "./BasePicker";

const parcels = [
  { id: "bsc", name: "Binance Smart Chain" },
  { id: "ton", name: "The Open Network" },
  { id: "base", name: "Base" },
];

interface BlockchainPickerProps {
  onSelect?: (blockchainId: string) => void;
}

const BlockchainPicker = ({ onSelect }: BlockchainPickerProps) => {
  return (
    <>
      <BasePicker
        title="Select a Blockchain"
        items={parcels.map((parcel) => ({
          id: parcel.id,
          name: parcel.name,
          icon: blockchainIcons[parcel.id],
        }))}
        onSelect={onSelect}
      />
    </>
  );
};

export { BlockchainPicker };
