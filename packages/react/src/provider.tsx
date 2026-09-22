"use client";

import {
  createPublicClient,
  type PublicClient,
} from "@techtrail/release-compass-core";
import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

export interface ReleaseCompassProviderProps {
  /** User username or organization slug (URL owner segment). */
  ownerSlug?: string;
  /** Alias for `ownerSlug`. */
  owner?: string;
  projectSlug: string;
  baseUrl?: string;
  lang?: string;
  children: ReactNode;
}

interface ReleaseCompassContextValue {
  client: PublicClient;
  lang?: string;
}

const ReleaseCompassContext = createContext<ReleaseCompassContextValue | null>(
  null,
);

export function ReleaseCompassProvider({
  ownerSlug,
  owner,
  projectSlug,
  baseUrl,
  lang,
  children,
}: ReleaseCompassProviderProps) {
  const value = useMemo(
    () => ({
      client: createPublicClient({ ownerSlug, owner, projectSlug, baseUrl }),
      lang,
    }),
    [ownerSlug, owner, projectSlug, baseUrl, lang],
  );

  return (
    <ReleaseCompassContext.Provider value={value}>
      {children}
    </ReleaseCompassContext.Provider>
  );
}

export function useReleaseCompass(): ReleaseCompassContextValue {
  const value = useContext(ReleaseCompassContext);
  if (!value) {
    throw new Error(
      "useReleaseCompass must be used within ReleaseCompassProvider",
    );
  }
  return value;
}
