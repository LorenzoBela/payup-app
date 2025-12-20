import { headers } from "next/headers";

/**
 * Server-side mobile detection utility
 * Detects mobile devices from user-agent string
 */
export async function isMobileDevice(): Promise<boolean> {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}

/**
 * Get device type from user-agent
 */
export async function getDeviceType(): Promise<"mobile" | "tablet" | "desktop"> {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";
  
  if (/iPhone|iPod|Android.*Mobile/i.test(userAgent)) {
    return "mobile";
  }
  
  if (/iPad|Android(?!.*Mobile)/i.test(userAgent)) {
    return "tablet";
  }
  
  return "desktop";
}

/**
 * Check if device is iOS
 */
export async function isIOS(): Promise<boolean> {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";
  
  return /iPhone|iPad|iPod/i.test(userAgent);
}

/**
 * Check if device is Android
 */
export async function isAndroid(): Promise<boolean> {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";
  
  return /Android/i.test(userAgent);
}

/**
 * Get screen size category based on user-agent hints or defaults
 */
export async function getScreenSize(): Promise<"small" | "medium" | "large"> {
  const deviceType = await getDeviceType();
  
  // Default sizes based on device type
  if (deviceType === "mobile") return "small";
  if (deviceType === "tablet") return "medium";
  return "large";
}
