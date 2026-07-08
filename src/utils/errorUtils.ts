/**
 * Extracts a user-friendly error message from an Axios error response.
 *
 * Supports the backend ErrorResponse shape:
 *   { status, error, message?, details?, path, timestamp }
 *
 * - If `details` is present (array of strings), joins them with newlines.
 * - If `message` is present, returns it directly.
 * - Falls back to the provided default message.
 */
export function extractErrorMessage(
  error: unknown,
  fallback = "An unexpected error occurred. Please try again.",
): string {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    (error as any).response?.data
  ) {
    const data = (error as any).response.data;

    if (data.details && Array.isArray(data.details) && data.details.length > 0) {
      return data.details.join("\n");
    }

    if (data.message) {
      return data.message;
    }
  }

  return fallback;
}
