import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * shadcn/ui utility function for merging Tailwind CSS classes
 * Combines clsx and tailwind-merge for intelligent class merging
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
