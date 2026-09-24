import { Button } from "./Button";
import { cn } from "../lib/utils";
import { useBlockChainContext } from "../hooks/useBlockchainContext";

interface ModeSelectorProps {
  disabled?: boolean;
}

const ModeSelector = ({ disabled }: ModeSelectorProps) => {
  const { mode, setMode } = useBlockChainContext();

  return (
    <>
      {/* Mode Selection */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={"outline"}
          disabled={disabled}
          className={cn(mode === "single" && "text-purple-300 font-bold")}
          onClick={() => setMode("single")}
        >
          Single Mode
        </Button>
        <Button
          type="button"
          variant={"outline"}
          disabled={disabled}
          className={cn(mode === "batch" && "text-purple-300 font-bold")}
          onClick={() => setMode("batch")}
        >
          Batch Mode
        </Button>
      </div>

      {/* Mode Information */}
      <p className="text-purple-300 text-sm text-center">
        {mode === "single"
          ? "Single mode selected - transactions will be processed sequentially. (Recommended for most users)"
          : "Batch mode selected - transactions will be processed in parallel."}
      </p>
    </>
  );
};

export { ModeSelector };
