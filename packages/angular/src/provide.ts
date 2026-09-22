import { InjectionToken, type Provider } from "@angular/core";
import {
  createPublicClient,
  type PublicClient,
} from "@techtrail/release-compass-core";

export interface ReleaseCompassConfig {
  /** User username or organization slug (URL owner segment). */
  ownerSlug?: string;
  /** Alias for `ownerSlug`. */
  owner?: string;
  projectSlug: string;
  baseUrl?: string;
  lang?: string;
}

export const RELEASE_COMPASS_CONFIG =
  new InjectionToken<ReleaseCompassConfig>("RELEASE_COMPASS_CONFIG");

export const RELEASE_COMPASS_CLIENT =
  new InjectionToken<PublicClient>("RELEASE_COMPASS_CLIENT");

export function provideReleaseCompass(config: ReleaseCompassConfig): Provider[] {
  return [
    { provide: RELEASE_COMPASS_CONFIG, useValue: config },
    {
      provide: RELEASE_COMPASS_CLIENT,
      useFactory: (cfg: ReleaseCompassConfig) =>
        createPublicClient({
          ownerSlug: cfg.ownerSlug,
          owner: cfg.owner,
          projectSlug: cfg.projectSlug,
          baseUrl: cfg.baseUrl,
        }),
      deps: [RELEASE_COMPASS_CONFIG],
    },
  ];
}
