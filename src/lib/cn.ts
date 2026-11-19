import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names and lets a caller's class win over a component's default:
 * `hidden` passed to a button whose base class list has `inline-flex` must hide it.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
