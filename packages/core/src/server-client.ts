import { requestJson, type FetchLike } from "./http.js";
import {
  DEFAULT_API_BASE_URL,
  type CreateRequestInput,
  type FeatureRequestDto,
  type PublicChangelogDto,
  type UpdateRequestInput,
} from "./types.js";

/**
 * Server-side client. Pass a project API key (`rc_live_…`).
 * Do not use this in browser bundles — the key would leak.
 */
export interface ServerClientOptions {
  projectSlug: string;
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: FetchLike;
}

export interface ServerRequestBoard {
  projectSlug: string;
  requests: FeatureRequestDto[];
}

export interface ServerClient {
  readonly projectSlug: string;
  /** Published public changelog for the project slug (no drafts via API key). */
  getChangelog(options?: { lang?: string }): Promise<PublicChangelogDto>;
  /** Full request board including private boards and pending items. */
  getRequestBoard(): Promise<ServerRequestBoard>;
  listRequests(): Promise<FeatureRequestDto[]>;
  createRequest(input: CreateRequestInput): Promise<FeatureRequestDto>;
  updateRequest(
    requestId: string,
    input: UpdateRequestInput,
  ): Promise<FeatureRequestDto>;
  voteRequest(requestId: string, voter: string): Promise<FeatureRequestDto>;
}

export function createServerClient(
  options: ServerClientOptions,
): ServerClient {
  const projectSlug = options.projectSlug.trim();
  const apiKey = options.apiKey.trim();
  if (!projectSlug) {
    throw new Error("projectSlug is required");
  }
  if (!apiKey) {
    throw new Error("apiKey is required");
  }

  const http = {
    baseUrl: options.baseUrl ?? DEFAULT_API_BASE_URL,
    fetchImpl: options.fetchImpl,
    apiKey,
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
    async getRequestBoard() {
      const requests = await requestJson<FeatureRequestDto[]>(
        http,
        "GET",
        "/requests",
      );
      return { projectSlug, requests };
    },
    listRequests() {
      return requestJson(http, "GET", "/requests");
    },
    createRequest(input) {
      return requestJson(http, "POST", "/requests", input);
    },
    updateRequest(requestId, input) {
      return requestJson(
        http,
        "PATCH",
        `/requests/${encodeURIComponent(requestId)}`,
        input,
      );
    },
    voteRequest(requestId, voter) {
      return requestJson(
        http,
        "POST",
        `/requests/${encodeURIComponent(requestId)}/votes`,
        { voter },
      );
    },
  };
}
