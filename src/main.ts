import { bangs } from "./bang";
import { fetchAndStoreSearxngInstances } from "./searxng";
import { getRandomElement } from "./utils";

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

async function doRedirect() {
  const searchUrl = await getBangredirectUrl();
  if (!searchUrl) return;
  window.location.replace(searchUrl);
}

doRedirect();
