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
  /** User username or organization slug (URL owner segment). */
  ownerSlug?: string;
  /** Alias for `ownerSlug`. */
  owner?: string;
  projectSlug?: string;
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

/**
 * Resolve owner + project from args or env.
 *
 * Env (either):
 * - `RELEASE_COMPASS_OWNER_SLUG` + `RELEASE_COMPASS_PROJECT_SLUG`
 * - `RELEASE_COMPASS_PROJECT=owner/project` (combined)
 */
export function readOwnerAndProject(explicit?: {
  ownerSlug?: string;
  owner?: string;
  projectSlug?: string;
}): { ownerSlug: string; projectSlug: string } {
  const explicitOwner = (explicit?.ownerSlug ?? explicit?.owner ?? "").trim();
  const explicitProject = (explicit?.projectSlug ?? "").trim();
  if (explicitOwner && explicitProject) {
    return { ownerSlug: explicitOwner, projectSlug: explicitProject };
  }

  const combined = (process.env.RELEASE_COMPASS_PROJECT ?? "").trim();
  if (combined.includes("/")) {
    const slash = combined.indexOf("/");
    const ownerSlug = combined.slice(0, slash).trim();
    const projectSlug = combined.slice(slash + 1).trim();
    if (ownerSlug && projectSlug && !projectSlug.includes("/")) {
      return {
        ownerSlug: explicitOwner || ownerSlug,
        projectSlug: explicitProject || projectSlug,
      };
    }
  }

  const ownerSlug = (
    explicitOwner ||
    process.env.RELEASE_COMPASS_OWNER_SLUG ||
    ""
  ).trim();
  const projectSlug = (
    explicitProject ||
    process.env.RELEASE_COMPASS_PROJECT_SLUG ||
    ""
  ).trim();

  if (!ownerSlug || !projectSlug) {
    throw new Error(
      "Missing owner/project. Pass ownerSlug (or owner) + projectSlug, or set RELEASE_COMPASS_OWNER_SLUG + RELEASE_COMPASS_PROJECT_SLUG, or RELEASE_COMPASS_PROJECT=owner/project.",
    );
  }
  return { ownerSlug, projectSlug };
}

/** Server client backed by `RELEASE_COMPASS_API_KEY` (never NEXT_PUBLIC_*). */
export function createReleaseCompassClient(
  config: ReleaseCompassEnvConfig = {},
): ServerClient {
  const { ownerSlug, projectSlug } = readOwnerAndProject(config);
  return createServerClient({
    ownerSlug,
    projectSlug,
    apiKey: readApiKey(config.apiKey),
    baseUrl: config.baseUrl ?? process.env.RELEASE_COMPASS_API_BASE_URL,
  });
}

export function createPublicReleaseCompassClient(options: {
  ownerSlug?: string;
  owner?: string;
  projectSlug?: string;
  baseUrl?: string;
}): PublicClient {
  const { ownerSlug, projectSlug } = readOwnerAndProject(options);
  return createPublicClient({
    ownerSlug,
    projectSlug,
    baseUrl: options.baseUrl ?? process.env.RELEASE_COMPASS_API_BASE_URL,
  });
}

export async function getChangelog(options: {
  ownerSlug?: string;
  owner?: string;
  projectSlug?: string;
  apiKey?: string;
  baseUrl?: string;
  lang?: string;
} = {}): Promise<PublicChangelogDto> {
  if (options.apiKey || process.env.RELEASE_COMPASS_API_KEY) {
    return createReleaseCompassClient({
      ownerSlug: options.ownerSlug,
      owner: options.owner,
      projectSlug: options.projectSlug,
      apiKey: options.apiKey,
      baseUrl: options.baseUrl,
    }).getChangelog({ lang: options.lang });
  }
  return createPublicReleaseCompassClient({
    ownerSlug: options.ownerSlug,
    owner: options.owner,
    projectSlug: options.projectSlug,
    baseUrl: options.baseUrl,
  }).getChangelog({ lang: options.lang });
}

export async function getRequestBoard(options: {
  ownerSlug?: string;
  owner?: string;
  projectSlug?: string;
  apiKey?: string;
  baseUrl?: string;
} = {}): Promise<ServerRequestBoard | PublicRequestBoardDto> {
  if (options.apiKey || process.env.RELEASE_COMPASS_API_KEY) {
    return createReleaseCompassClient({
      ownerSlug: options.ownerSlug,
      owner: options.owner,
      projectSlug: options.projectSlug,
      apiKey: options.apiKey,
      baseUrl: options.baseUrl,
    }).getRequestBoard();
  }
  return createPublicReleaseCompassClient({
    ownerSlug: options.ownerSlug,
    owner: options.owner,
    projectSlug: options.projectSlug,
    baseUrl: options.baseUrl,
  }).getRequestBoard();
}

export async function createRequest(
  input: CreateRequestInput,
  options: ReleaseCompassEnvConfig = {},
): Promise<FeatureRequestDto> {
  return createReleaseCompassClient(options).createRequest(input);
}

export async function updateRequest(
  requestId: string,
  input: UpdateRequestInput,
  options: ReleaseCompassEnvConfig = {},
): Promise<FeatureRequestDto> {
  return createReleaseCompassClient(options).updateRequest(requestId, input);
}

export async function voteRequest(
  requestId: string,
  voter: string,
  options: ReleaseCompassEnvConfig = {},
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
