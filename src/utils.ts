import pako from "pako";

export function setLocalStorage(name: string, value: string, maxAge: number) {
  // Store the value and expiration time as a JSON string
  const expiresAt = Date.now() + maxAge * 1000;
  localStorage.setItem(name, JSON.stringify({ value, expiresAt }));
}

export function getLocalStorage(name: string): string | undefined {
  const item = localStorage.getItem(name);
  if (!item) return undefined;
  try {
    const { value, expiresAt } = JSON.parse(item);
    if (typeof expiresAt === "number" && Date.now() > expiresAt) {
      localStorage.removeItem(name); // Remove expired item
      return undefined;
    }
    return value;
  } catch {
    // If parsing fails, remove the corrupted entry
    localStorage.removeItem(name);
    return undefined;
  }
}

export function getRandomElement(urlMap: Record<string, string>): string | undefined {
  const urls = Object.keys(urlMap);
  if (urls.length === 0) return undefined;
  const randomIndex = Math.floor(Math.random() * urls.length);
  return urlMap[urls[randomIndex]];
}

export function urlencode(obj: Record<string, string>): string {
  const params = new URLSearchParams(obj);
  return params.toString();
}

// Convert Uint8Array to base64 string
// This helper function is needed because btoa expects a string
export function uint8ToBase64(u8: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < u8.length; i++) {
    binary += String.fromCharCode(u8[i]);
  }
  return btoa(binary);
}

export function base64ToUint8(b64: string): Uint8Array {
  // Pad the base64 string if necessary
  let base64 = b64.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  // atob decodes base64 to binary string
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
