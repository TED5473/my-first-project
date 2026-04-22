import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(input: number, min: number, max: number): number {
  return Math.min(Math.max(input, min), max);
}

export function toSubmoltName(input: string): string {
  return input.replace(/^m\//, "").trim();
}

export function toSubmoltLabel(input: string): string {
  return input.startsWith("m/") ? input : `m/${input}`;
}
