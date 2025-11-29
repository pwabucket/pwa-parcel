import clsx, { type ClassValue } from "clsx";
import { Decimal } from "decimal.js";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}

export function* chunkArrayGenerator<T>(arr: T[], size: number) {
  for (let i = 0; i < arr.length; i += size) {
    yield arr.slice(i, i + size);
  }
}

export function calculateAmountPerRecipient(
  totalAmount: string,
  numberOfRecipients: number
): string {
  if (numberOfRecipients === 0) return "0";

  const amount = new Decimal(totalAmount)
    .dividedBy(numberOfRecipients)
    .toString();

  return amount;
}
