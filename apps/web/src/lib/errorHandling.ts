// Error handling utilities for SoulAI
import { analytics } from "./analytics";

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export class SoulError extends Error {
  code: string;
  details?: any;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = "SoulError";
  }
}

export function handleError(error: Error | SoulError, context?: Record<string, any>) {
  // Log error to console
  console.error("SoulAI Error:", error);

  // Track error in analytics
  analytics.trackError(error, context);

  // Return user-friendly error message
  return {
    success: false,
    error: getUserFriendlyMessage(error)
  };
}

function getUserFriendlyMessage(error: Error | SoulError): string {
  // Map error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    "NETWORK_ERROR": "Unable to connect to the server. Please check your internet connection.",
    "API_ERROR": "Service is temporarily unavailable. Please try again later.",
    "VALIDATION_ERROR": "Please check your input and try again.",
    "AUTH_ERROR": "Please log in to continue.",
    "PERMISSION_ERROR": "You don't have permission to perform this action.",
    "NOT_FOUND": "The requested resource was not found.",
    "TIMEOUT_ERROR": "The request timed out. Please try again.",
    "UNKNOWN_ERROR": "An unexpected error occurred. Please try again."
  };

  if (error instanceof SoulError && errorMessages[error.code]) {
    return errorMessages[error.code];
  }

  // Default error messages based on error type
  if (error.message.includes("fetch") || error.message.toLowerCase().includes("network")) {
    return errorMessages["NETWORK_ERROR"];
  }

  if (error.message.toLowerCase().includes("timeout") || error.message.toLowerCase().includes("timed out")) {
    return errorMessages["TIMEOUT_ERROR"];
  }

  if (error.message.toLowerCase().includes("api") || error.message.toLowerCase().includes("server")) {
    return errorMessages["API_ERROR"];
  }

  return errorMessages["UNKNOWN_ERROR"];
}

export function createError(code: string, message: string, details?: any): SoulError {
  return new SoulError(code, message, details);
}

export function isNetworkError(error: Error): boolean {
  return error.message.includes("fetch") || 
         error.message.toLowerCase().includes("network") ||
         error.message.includes("Failed to fetch");
}

export function isTimeoutError(error: Error): boolean {
  return error.message.includes("timeout") ||
         error.message.includes("timed out");
}

export function isApiError(error: Error): boolean {
  return error.message.toLowerCase().includes("api") ||
         error.message.toLowerCase().includes("server") ||
         error.message.includes("500") ||
         error.message.includes("503");
}
