import { requestJson, type FetchLike } from "./http.js";
import {
  DEFAULT_API_BASE_URL,
  type PublicChangelogDto,
  type PublicRequestBoardDto,
  type SubscribeInput,
} from "./types.js";

export interface PublicClientOptions {
  /** User username or organization slug (URL owner segment). */
  ownerSlug?: string;
  /** Alias for `ownerSlug`. */
  owner?: string;
  projectSlug: string;
  baseUrl?: string;
  fetchImpl?: FetchLike;
}

export interface PublicClient {
  readonly ownerSlug: string;
  readonly projectSlug: string;
  getChangelog(options?: { lang?: string }): Promise<PublicChangelogDto>;
  getRequestBoard(): Promise<PublicRequestBoardDto>;
  subscribe(input: SubscribeInput): Promise<{ status: string }>;
  confirmSubscribe(token: string): Promise<{ status: string }>;
}

function resolveOwnerSlug(options: PublicClientOptions): string {
  const ownerSlug = (options.ownerSlug ?? options.owner ?? "").trim();
  if (!ownerSlug) {
    throw new Error("ownerSlug (or owner) is required");
  }
  return ownerSlug;
}

function publicChangelogPath(ownerSlug: string, projectSlug: string): string {
  return `/public/changelogs/${encodeURIComponent(ownerSlug)}/${encodeURIComponent(projectSlug)}`;
}

export function createPublicClient(
  options: PublicClientOptions,
): PublicClient {
  const ownerSlug = resolveOwnerSlug(options);
  const projectSlug = options.projectSlug.trim();
  if (!projectSlug) {
    throw new Error("projectSlug is required");
  }
  const http = {
    baseUrl: options.baseUrl ?? DEFAULT_API_BASE_URL,
    fetchImpl: options.fetchImpl,
  };
  const basePath = publicChangelogPath(ownerSlug, projectSlug);

  return {
    ownerSlug,
    projectSlug,
    getChangelog({ lang } = {}) {
      const query = lang ? `?lang=${encodeURIComponent(lang)}` : "";
      return requestJson(http, "GET", `${basePath}${query}`);
    },
    getRequestBoard() {
      return requestJson(http, "GET", `${basePath}/requests`);
    },
    subscribe(input) {
      return requestJson(http, "POST", "/subscribers", {
        ownerSlug,
        projectSlug,
        email: input.email,
        channels: input.channels,
        turnstileToken: input.turnstileToken,
      });
    },
    confirmSubscribe(token) {
      return requestJson(http, "POST", "/subscribers/confirm", { token });
    },
  };
}
