export const DEFAULT_API_BASE_URL =
  "https://api.release-compass.app/api/v1" as const;

export const RELEASE_CHANNELS = [
  "stable",
  "rc",
  "beta",
  "alpha",
  "canary",
] as const;
export type ReleaseChannel = (typeof RELEASE_CHANNELS)[number];

export const CHANGE_TYPES = [
  "feature",
  "fix",
  "improvement",
  "breaking",
  "chore",
  "other",
] as const;
export type ChangeType = (typeof CHANGE_TYPES)[number];

export const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  feature: "Features",
  fix: "Bug fixes",
  improvement: "Improvements",
  breaking: "Breaking changes",
  chore: "Chore",
  other: "Other",
};

export const REQUEST_KINDS = ["feature", "bugfix"] as const;
export type RequestKind = (typeof REQUEST_KINDS)[number];

export const REQUEST_KIND_LABELS: Record<RequestKind, string> = {
  feature: "Feature",
  bugfix: "Bug fix",
};

export const REQUEST_STATUSES = [
  "pending",
  "open",
  "planned",
  "in_progress",
  "done",
  "declined",
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: "Pending approval",
  open: "Open",
  planned: "Planned",
  in_progress: "In progress",
  done: "Done",
  declined: "Declined",
};

export const REQUEST_BOARD_VISIBILITIES = ["public", "private"] as const;
export type RequestBoardVisibility =
  (typeof REQUEST_BOARD_VISIBILITIES)[number];

export interface ReleaseChange {
  type: ChangeType;
  title: string;
  description?: string;
}

export interface PublicReleaseDto {
  id: string;
  version: string;
  channel: ReleaseChannel;
  title: string;
  body: string;
  changes: ReleaseChange[];
  publishedAt: string;
  scheduledAt?: string;
  editedAt?: string;
  url: string;
  locales: string[];
}

export interface PublicChangelogDto {
  project: {
    name: string;
    ownerSlug: string;
    slug: string;
    description?: string;
    logoUrl?: string;
    defaultLocale: string;
    requestBoard: RequestBoardVisibility;
    requestRevealIdentities: boolean;
  };
  locale: string;
  availableLocales: string[];
  releases: PublicReleaseDto[];
}

export interface FeatureRequestDto {
  id: string;
  projectId: string;
  kind: RequestKind;
  title: string;
  body?: string;
  status: RequestStatus;
  voteCount: number;
  requester?: string;
  voters?: string[];
  resolvedRelease?: {
    id: string;
    version: string;
    title: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PublicRequestBoardDto {
  project: {
    name: string;
    ownerSlug: string;
    slug: string;
    requestBoard: RequestBoardVisibility;
    requestRevealIdentities: boolean;
    requestEmailVoting: boolean;
    requestApprovals: boolean;
  };
  requests: FeatureRequestDto[];
}

export interface CreateRequestInput {
  kind: RequestKind;
  title: string;
  body?: string;
  requester?: string;
}

export interface UpdateRequestInput {
  status: RequestStatus;
  resolvedReleaseId?: string;
}

export interface SubscribeInput {
  email: string;
  channels?: ReleaseChannel[];
  turnstileToken?: string;
}

export function groupChanges(
  changes: readonly ReleaseChange[],
): { type: ChangeType; label: string; items: ReleaseChange[] }[] {
  return CHANGE_TYPES.map((type) => ({
    type,
    label: CHANGE_TYPE_LABELS[type],
    items: changes.filter((change) => change.type === type),
  })).filter((group) => group.items.length > 0);
}
