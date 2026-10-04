/**
 * CIVIC PULSE — API Client Service
 * Centralized API communication with the FastAPI backend
 * Compatible facade delegating to the unified api service in @/lib/api
 */

export * from '@/lib/api';
export { api as default } from '@/lib/api';
