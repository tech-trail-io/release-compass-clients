import "server-only";

import {
  createPublicClient,
  createServerClient,
  type CreateRequestInput,
  type FeatureRequestDto,
  type PublicChangelogDto,
  type PublicClient,
  type PublicRequestBoardDto,
  type ServerClient,
  type ServerRequestBoard,
  type UpdateRequestInput,
} from "@techtrail/release-compass-core";

export interface ReleaseCompassEnvConfig {
  projectSlug: string;
  /** Project API key (`rc_live_…`). Prefer `RELEASE_COMPASS_API_KEY` env. */
  apiKey?: string;
  baseUrl?: string;
}

function readApiKey(explicit?: string): string {
  const key = (explicit ?? process.env.RELEASE_COMPASS_API_KEY ?? "").trim();
  if (!key) {
    throw new Error(
      "Missing Release Compass API key. Set RELEASE_COMPASS_API_KEY or pass apiKey.",
    );
  }
  return key;
}

function readProjectSlug(explicit?: string): string {
  const slug = (
    explicit ??
    process.env.RELEASE_COMPASS_PROJECT_SLUG ??
    ""
  ).trim();
  if (!slug) {
    throw new Error(
      "Missing projectSlug. Pass projectSlug or set RELEASE_COMPASS_PROJECT_SLUG.",
    );
  }
  return slug;
}

/** Server client backed by `RELEASE_COMPASS_API_KEY` (never NEXT_PUBLIC_*). */
export function createReleaseCompassClient(
  config: ReleaseCompassEnvConfig = {
    projectSlug: process.env.RELEASE_COMPASS_PROJECT_SLUG ?? "",
  },
): ServerClient {
  return createServerClient({
    projectSlug: readProjectSlug(config.projectSlug),
    apiKey: readApiKey(config.apiKey),
    baseUrl: config.baseUrl ?? process.env.RELEASE_COMPASS_API_BASE_URL,
  });
}

export function createPublicReleaseCompassClient(options: {
  projectSlug: string;
  baseUrl?: string;
}): PublicClient {
  return createPublicClient({
    projectSlug: options.projectSlug,
    baseUrl: options.baseUrl ?? process.env.RELEASE_COMPASS_API_BASE_URL,
  });
}

export async function getChangelog(options: {
  projectSlug?: string;
  apiKey?: string;
  baseUrl?: string;
  lang?: string;
}): Promise<PublicChangelogDto> {
  if (options.apiKey || process.env.RELEASE_COMPASS_API_KEY) {
    return createReleaseCompassClient({
      projectSlug: options.projectSlug ?? "",
      apiKey: options.apiKey,
      baseUrl: options.baseUrl,
    }).getChangelog({ lang: options.lang });
  }
  return createPublicReleaseCompassClient({
    projectSlug: readProjectSlug(options.projectSlug),
    baseUrl: options.baseUrl,
  }).getChangelog({ lang: options.lang });
}

export async function getRequestBoard(options: {
  projectSlug?: string;
  apiKey?: string;
  baseUrl?: string;
}): Promise<ServerRequestBoard | PublicRequestBoardDto> {
  if (options.apiKey || process.env.RELEASE_COMPASS_API_KEY) {
    return createReleaseCompassClient({
      projectSlug: options.projectSlug ?? "",
      apiKey: options.apiKey,
      baseUrl: options.baseUrl,
    }).getRequestBoard();
  }
  return createPublicReleaseCompassClient({
    projectSlug: readProjectSlug(options.projectSlug),
    baseUrl: options.baseUrl,
  }).getRequestBoard();
}

export async function createRequest(
  input: CreateRequestInput,
  options: ReleaseCompassEnvConfig = {
    projectSlug: process.env.RELEASE_COMPASS_PROJECT_SLUG ?? "",
  },
): Promise<FeatureRequestDto> {
  return createReleaseCompassClient(options).createRequest(input);
}

export async function updateRequest(
  requestId: string,
  input: UpdateRequestInput,
  options: ReleaseCompassEnvConfig = {
    projectSlug: process.env.RELEASE_COMPASS_PROJECT_SLUG ?? "",
  },
): Promise<FeatureRequestDto> {
  return createReleaseCompassClient(options).updateRequest(requestId, input);
}

export async function voteRequest(
  requestId: string,
  voter: string,
  options: ReleaseCompassEnvConfig = {
    projectSlug: process.env.RELEASE_COMPASS_PROJECT_SLUG ?? "",
  },
): Promise<FeatureRequestDto> {
  return createReleaseCompassClient(options).voteRequest(requestId, voter);
}

export type {
  CreateRequestInput,
  FeatureRequestDto,
  PublicChangelogDto,
  PublicRequestBoardDto,
  ServerRequestBoard,
  UpdateRequestInput,
};
