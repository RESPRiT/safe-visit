// from: packages/tome-kolmafia-lib/src/api/base.ts
type ApiRequest = {
  properties?: readonly string[];
  functions?: readonly { name: string; args: unknown[] }[];
};

type ApiResponse = {
  properties?: string[];
  functions?: unknown[];
};

export async function remoteProperty(property: string) {
  const pwd = await getHash();
  const res = await apiCall(
    {
      properties: [property],
    },
    pwd
  );

  // property doesn't exist
  if (res.properties === undefined) return null;

  return res.properties[0];
}

export async function remoteFunction(name: string, args: string[] = []) {
  const pwd = await getHash();
  const res = await apiCall(
    {
      functions: [{ name, args }],
    },
    pwd
  );

  // void functions
  if (res.functions === undefined) return null;

  return res.functions[0];
}

export async function apiCall(
  request: ApiRequest,
  pwd: string
): Promise<ApiResponse> {
  const response = await fetch(
    "http://127.0.0.1:60080/KoLmafia/jsonApi/KoLmafia/jsonApi",
    {
      method: "post",
      body: new URLSearchParams({
        body: JSON.stringify(request),
        pwd,
      }),
      headers: {
        // Mafia only accepts this format.
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  const json = await response.json();
  if ("error" in json) {
    throw new Error(json.error);
  }
  return json;
}

// from: packages/tome-kolmafia-lib/src/api/hash.ts
declare global {
  interface Window {
    mainpane?: Window;
  }
}

const PWD_RE = /pwd:\s+"([0-9a-f]+)"/m;
let lastHash: string | null = null;
export function getHashIfAvailable(): string {
  if (lastHash) return lastHash;

  const current =
    window.parent.frames.mainpane?.document?.body?.innerHTML?.match(
      PWD_RE
    )?.[1];
  if (current !== undefined) {
    lastHash = current;
  }
  return lastHash ?? "";
}

export async function updateHashFromServer(): Promise<void> {
  const response = await fetch("/api.php?what=status&for=tome-kolmafia");
  const apiObject = await response.json();
  const newHash = apiObject?.pwd ?? null;
  lastHash = newHash;
}

export async function getHash(): Promise<string> {
  const attempt = getHashIfAvailable();
  if (attempt === "") {
    await updateHashFromServer();
    return lastHash ?? "";
  } else {
    return attempt;
  }
}
