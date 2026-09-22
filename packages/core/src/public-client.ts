import { requestJson, type FetchLike } from "./http.js";
import {
  DEFAULT_API_BASE_URL,
  type PublicChangelogDto,
  type PublicRequestBoardDto,
  type SubscribeInput,
} from "./types.js";

export interface PublicClientOptions {
  projectSlug: string;
  baseUrl?: string;
  fetchImpl?: FetchLike;
}

export interface PublicClient {
  readonly projectSlug: string;
  getChangelog(options?: { lang?: string }): Promise<PublicChangelogDto>;
  getRequestBoard(): Promise<PublicRequestBoardDto>;
  subscribe(input: SubscribeInput): Promise<{ status: string }>;
  confirmSubscribe(token: string): Promise<{ status: string }>;
}

export function createPublicClient(
  options: PublicClientOptions,
): PublicClient {
  const projectSlug = options.projectSlug.trim();
  if (!projectSlug) {
    throw new Error("projectSlug is required");
  }
  const http = {
    baseUrl: options.baseUrl ?? DEFAULT_API_BASE_URL,
    fetchImpl: options.fetchImpl,
  };

  return {
    projectSlug,
    getChangelog({ lang } = {}) {
      const query = lang ? `?lang=${encodeURIComponent(lang)}` : "";
      return requestJson(
        http,
        "GET",
        `/public/changelogs/${encodeURIComponent(projectSlug)}${query}`,
      );
    },
    getRequestBoard() {
      return requestJson(
        http,
        "GET",
        `/public/changelogs/${encodeURIComponent(projectSlug)}/requests`,
      );
    },
    subscribe(input) {
      return requestJson(http, "POST", "/subscribers", {
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
