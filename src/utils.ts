function setLocalStorage(name: string, value: string, maxAge: number) {
  // Store the value and expiration time as a JSON string
  const expiresAt = Date.now() + maxAge * 1000;
  localStorage.setItem(name, JSON.stringify({ value, expiresAt }));
}

function getLocalStorage(name: string): string | undefined {
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

function getRandomElement(urlMap: Record<string, string>): string | undefined {
  const urls = Object.keys(urlMap);
  if (urls.length === 0) return undefined;
  const randomIndex = Math.floor(Math.random() * urls.length);
  return urlMap[urls[randomIndex]];
}

export { setLocalStorage, getLocalStorage, getRandomElement };
