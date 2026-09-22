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
  /** User username or organization slug (URL owner segment). */
  ownerSlug?: string;
  /** Alias for `ownerSlug`. */
  owner?: string;
  projectSlug: string;
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: FetchLike;
}

export interface ServerRequestBoard {
  ownerSlug: string;
  projectSlug: string;
  requests: FeatureRequestDto[];
}

export interface ServerClient {
  readonly ownerSlug: string;
  readonly projectSlug: string;
  /** Published public changelog for the owner/project (no drafts via API key). */
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

function resolveOwnerSlug(options: ServerClientOptions): string {
  const ownerSlug = (options.ownerSlug ?? options.owner ?? "").trim();
  if (!ownerSlug) {
    throw new Error("ownerSlug (or owner) is required");
  }
  return ownerSlug;
}

export function createServerClient(
  options: ServerClientOptions,
): ServerClient {
  const ownerSlug = resolveOwnerSlug(options);
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
  const changelogPath = `/public/changelogs/${encodeURIComponent(ownerSlug)}/${encodeURIComponent(projectSlug)}`;

  return {
    ownerSlug,
    projectSlug,
    getChangelog({ lang } = {}) {
      const query = lang ? `?lang=${encodeURIComponent(lang)}` : "";
      return requestJson(http, "GET", `${changelogPath}${query}`);
    },
    async getRequestBoard() {
      const requests = await requestJson<FeatureRequestDto[]>(
        http,
        "GET",
        "/requests",
      );
      return { ownerSlug, projectSlug, requests };
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
