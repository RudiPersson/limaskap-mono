import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const protocol =
  process.env.NODE_ENV === "production" ? "https" : "http";
export const rootDomain =
  process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateAge(
  birthDate: string | undefined
): number | undefined {
  if (!birthDate) return undefined;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function formatPrice(amount: number): string {
  const formatted = new Intl.NumberFormat("dk-DK", {
    style: "currency",
    currency: "DKK",
  }).format(amount);
  return formatted;
}

type ApiError = {
  error?: {
    issues?: Array<{
      code: string;
      path: (string | number)[];
      message?: string;
    }>;
    name: string;
  };
  message?: string;
};

export function formatApiError(error: ApiError): string {
  // Handle Zod validation errors (422 status)
  if ("error" in error && error.error?.issues) {
    // Format Zod validation errors into a readable message
    const validationErrors = error.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");

    return validationErrors;
  }

  // Handle other errors (401, 500, etc.)
  return "message" in error ? error.message! : "An error occurred";
}
