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

  if (res.properties === undefined)
    throw new Error(
      `Didn't receive properties back from mafia for ${property}`
    );

  return res.properties[0];
}

export async function remoteProperties(properties: string[]) {
  const pwd = await getHash();
  const res = await apiCall(
    {
      properties,
    },
    pwd
  );

  if (res.properties === undefined)
    throw new Error(
      `Didn't receive properties back from mafia for ${properties}`
    );

  return res.properties;
}

export async function remoteFunction(
  name: string,
  args: (string | number)[] = []
) {
  const pwd = await getHash();
  const res = await apiCall(
    {
      functions: [{ name, args }],
    },
    pwd
  );

  if (res.functions === undefined)
    throw new Error(`Didn't receive functions back from mafia for ${name}`);

  return res.functions[0];
}

export async function remoteFunctions(
  names: string[],
  args?: (string | number)[][]
) {
  const pwd = await getHash();
  const res = await apiCall(
    {
      functions: names.map((name, i) => ({
        name,
        args: args === undefined ? [] : args[i],
      })),
    },
    pwd
  );

  if (res.functions === undefined)
    throw new Error(`Didn't receive functions back from mafia for ${names}`);

  return res.functions;
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
  if (response.status === 401) {
    // our pwd is stale, refresh
    window.location.reload();
  }

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
  const response = await fetch("/api.php?what=status&for=safe-visit");
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
