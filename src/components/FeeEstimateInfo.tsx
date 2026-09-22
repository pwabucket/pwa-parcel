import Decimal from "decimal.js";
import type { FeeEstimate } from "../types";

/** Props for Fee Estimate Information */
interface FeeEstimateInfoProps {
  estimate?: FeeEstimate;
  isLoading: boolean;
  isError: boolean;
  symbol?: string;
}

/** Format a native amount to a few significant digits */
const formatAmount = (amount: string) =>
  new Decimal(amount).toSignificantDigits(4).toFixed();

/** Fee Estimate Information Component */
const FeeEstimateInfo = ({
  estimate,
  isLoading,
  isError,
  symbol = "",
}: FeeEstimateInfoProps) => {
  if (isLoading) {
    return (
      <p className="text-xs px-4 text-center text-neutral-400">
        Estimating fees...
      </p>
    );
  }

  if (isError) {
    return (
      <p className="text-xs px-4 text-center text-red-400">
        Couldn't estimate fees.
      </p>
    );
  }

  if (!estimate) return null;

  const prefix = estimate.approximate ? "~" : "≈";

  return (
    <div className="flex flex-col gap-1 text-xs px-4 text-center">
      <p>
        Estimated network fee:{" "}
        <span className="font-bold text-lime-300">
          {prefix} {formatAmount(estimate.fee)} {symbol}
        </span>{" "}
        <span className="text-neutral-400">
          ({estimate.transactions} transaction
          {estimate.transactions === 1 ? "" : "s"})
        </span>
      </p>

      {estimate.feePerSender && (
        <p className="text-neutral-400">
          Each sender needs {prefix} {formatAmount(estimate.feePerSender)}{" "}
          {symbol} for gas
        </p>
      )}

      {estimate.refundable && (
        <p className="text-neutral-400">
          + {formatAmount(estimate.refundable)} {symbol} attached for delivery
          (most is refunded)
        </p>
      )}
    </div>
  );
};

export { FeeEstimateInfo };
