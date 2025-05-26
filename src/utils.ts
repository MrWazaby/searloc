function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)};max-age=${maxAge};path=/`;
}

function getCookie(name: string): string | undefined {
  const cookies = document.cookie.split("; ").map(v => v.split("="));
  for (const [key, val] of cookies) {
    if (decodeURIComponent(key) === name) return decodeURIComponent(val);
  }
  return undefined;
}

function getRandomElement(urlMap: Record<string, string>): string | undefined {
  const urls = Object.keys(urlMap);
  if (urls.length === 0) return undefined;
  const randomIndex = Math.floor(Math.random() * urls.length);
  return urlMap[urls[randomIndex]];
}

export { setCookie, getCookie, getRandomElement };
