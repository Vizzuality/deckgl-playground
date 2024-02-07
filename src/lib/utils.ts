import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateYearlyTimestamps() {
  const startOfTheYear = new Date(new Date().getFullYear(), 0, 1); // January 1st of the current year
  const endOfTheYear = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999); // December 31st of the current year

  const timestamps = [startOfTheYear.getTime()]; // Start with the first day of the year

  for (let i = 1; i < 84; i++) {
    const randomIncrement = Math.floor(Math.random() * 4 * 24 * 60 * 60 * 1000); // Random increment between 0 and 4 days in milliseconds
    const newTimestamp = new Date(timestamps[i - 1] + randomIncrement);

    // Ensure the new timestamp doesn't go beyond the end of the year
    if (newTimestamp > endOfTheYear) {
      timestamps.push(endOfTheYear.getTime());
      break;
    }

    timestamps.push(newTimestamp.getTime());
  }

  return timestamps;
}
