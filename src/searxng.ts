import { getLocalStorage, setLocalStorage } from "./utils";

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

const STORAGE_NAME = "searxng_instances";
const STORAGE_MAX_AGE = 24 * 60 * 60; // 1 day in seconds

async function fetchAndStoreSearxngInstances(): Promise<{}> {
  // If cookie exists, return parsed value
  const storage = getLocalStorage(STORAGE_NAME);
  if (storage) {
    try {
      return JSON.parse(storage);
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

  setLocalStorage(STORAGE_NAME, JSON.stringify(urlMap), STORAGE_MAX_AGE);
  return urlMap;
}

export { fetchAndStoreSearxngInstances };
