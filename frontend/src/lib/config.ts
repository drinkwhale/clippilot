/**
 * Global runtime configuration helpers for the ClipPilot frontend
 */

const API_MODE = (process.env.NEXT_PUBLIC_API_MODE || 'live').toLowerCase();

/**
 * Whether the application should use mock API responses instead of
 * hitting the real backend. Useful for local development and testing.
 */
export const isMockApi = API_MODE === 'mock';

/**
 * Small helper that waits for the provided milliseconds.
 * Gives mock responses a slightly more realistic feel.
 */
export const waitFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
