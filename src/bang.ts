import { fetchAndStoreSearxngInstances } from "./searxng";
import { getRandomElement, setLocalStorage, getLocalStorage } from "./utils";
import { loadSettings } from "./settings";

export type Bang = {
  s: string;
  d: string;
  t: string;
  u: string;
  c?: string;
  sc?: string;
};

export async function fetchBangs(): Promise<Bang[]> {
  const bangs = getLocalStorage("bangs_json");
  if (bangs) {
    try {
      return JSON.parse(bangs);
    } catch {
      console.error("Failed to parse bangs JSON from localStorage:", bangs);
      localStorage.removeItem("bangs_json"); // Clear corrupted data
    }
  }
  const settings = loadSettings();
  const storageMaxAgeHours = settings.bangRefreshHours || 24;
  const resp = await fetch("/bangs.json");
  if (!resp.ok) return [];
  const data = await resp.json();
  setLocalStorage("bangs_json", JSON.stringify(data), storageMaxAgeHours * 3600);
  return data;
}

async function getDefaultSearch() : Promise<{ d: string; u: string } | undefined> {
  const urls = await fetchAndStoreSearxngInstances();
  const instance = getRandomElement(urls);
  if (!instance) {
    return undefined;
  }
  return {
    d: instance.replace(/^https?:\/\//, "").replace(/\/$/, ""),
    u: instance + "search?q={{{s}}}",
  }
}

async function getBangredirectUrl() {
  const url = new URL(window.location.href);
  const query = url.searchParams.get("q")?.trim() ?? "";
  if (!query) {
    return null;
  }

  // Replace .search-container with a loader
  const searchContainer = document.querySelector(".search-container");
  if (searchContainer) {
    searchContainer.innerHTML = '<div class="loader"></div>';
  }

  const match = query.match(/!!(\S+)/i);

  let bangs: Bang[] = [];
  if (match) {
    bangs = await fetchBangs();
  }

  const bangCandidate = match?.[1]?.toLowerCase();
  const selectedBang = bangs.find((b) => b.t === bangCandidate) ?? await getDefaultSearch();
 
  // Remove the first bang from the query
  const cleanQuery = query.replace(/!!\S+\s*/i, "").trim();

  // If the query is just `!gh`, use `github.com` instead of `github.com/search?q=`
  if (cleanQuery === "")
    return selectedBang ? `https://${selectedBang.d}` : null;

  // Format of the url is:
  // https://www.google.com/search?q={{{s}}}
  const searchUrl = selectedBang?.u.replace(
    "{{{s}}}",
    // Replace %2F with / to fix formats like "!ghr+t3dotgg/unduck"
    encodeURIComponent(cleanQuery).replace(/%2F/g, "/"),
  );
  if (!searchUrl) return null;

  return searchUrl;
}

export async function doRedirect() {
  const searchUrl = await getBangredirectUrl();
  if (!searchUrl) return;
  window.open(searchUrl, '_self', 'noreferrer');
}

