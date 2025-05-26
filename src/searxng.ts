import { getCookie, setCookie } from "./utils";

type SearxngInstance = {
    network_type: string;
    http: {
        status_code: number;
        error: string | null;
    };
    timing: {
        initial: {
            success_percentage: number;
        };
        search: {
            success_percentage: number;
        };
    }
}

const COOKIE_NAME = "searx_instances";
const COOKIE_MAX_AGE = 24 * 60 * 60; // 1 day in seconds

async function fetchAndStoreSearxngInstances(): Promise<{}> {
  // If cookie exists, return parsed value
  const cookie = getCookie(COOKIE_NAME);
  if (cookie) {
    try {
      return JSON.parse(cookie);
    } catch {
      // fallback to refetch if cookie is corrupted
    }
  }

  const response = await fetch("https://searx.space/data/instances.json");
  if (!response.ok) throw new Error("Failed to fetch instances.json");

  const data = await response.json();
  const instancesObj: Record<string, SearxngInstance> = data.instances;

  // Filter for normal network, search, initial_success_percentage 100%
  const urlMap: Record<string, string> = {};
  Object.entries(instancesObj).forEach(([url, instance]) => {
    if (
      instance.network_type === "normal" &&
      instance.http?.status_code === 200 &&
      instance.http?.error === null &&
      instance.timing?.search?.success_percentage === 100 &&
      instance.timing?.initial?.success_percentage === 100
    ) {
      urlMap[url] = url;
    }
  });

  setCookie(COOKIE_NAME, JSON.stringify(urlMap), COOKIE_MAX_AGE);
  return urlMap;
}

export { fetchAndStoreSearxngInstances };
