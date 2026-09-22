export class ReleaseCompassError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ReleaseCompassError";
    this.status = status;
    this.body = body;
  }
}

export type FetchLike = typeof fetch;

export interface HttpOptions {
  baseUrl: string;
  fetchImpl?: FetchLike;
  apiKey?: string;
}

function trimSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export async function requestJson<T>(
  options: HttpOptions,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (options.apiKey) {
    headers.Authorization = `Bearer ${options.apiKey}`;
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(`${trimSlash(options.baseUrl)}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let parsed: unknown = undefined;
  if (text) {
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof parsed === "object" &&
      parsed !== null &&
      "message" in parsed &&
      typeof (parsed as { message: unknown }).message === "string"
        ? (parsed as { message: string }).message
        : `Request failed with ${response.status}`;
    throw new ReleaseCompassError(message, response.status, parsed);
  }

  return parsed as T;
}
