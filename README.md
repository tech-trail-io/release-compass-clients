# Release Compass clients

Embed [Release Compass](https://release-compass.app) changelogs and feature/bugfix boards in your product.

| Package | Use |
| --- | --- |
| [`@techtrail/release-compass-core`](packages/core) | Typed HTTP client (public + server) |
| [`@techtrail/release-compass-react`](packages/react) | Public React embeds (no tokens) |
| [`@techtrail/release-compass-angular`](packages/angular) | Public Angular embeds (no tokens) |
| [`@techtrail/release-compass-next`](packages/next) | Next.js server helpers (API keys, private boards, voting) |
| `@techtrail/release-compass-vue` | **Soon** |

## Auth boundary

- **Public** release notes and roadmaps: no token. Safe in the browser via React / Angular.
- **Private boards and voting**: project API key (`rc_live_…`) on your **backend** only. Use `@techtrail/release-compass-core`’s `createServerClient` or `@techtrail/release-compass-next`. Never put the key in `NEXT_PUBLIC_*` or a React/Angular prop.

Default API base: `https://api.release-compass.app/api/v1`.

Public paths use **owner + project**:
`/api/v1/public/changelogs/{owner}/{project}`.
The owner segment is a user **username** or organization **slug**.

## React (public)

```bash
pnpm add @techtrail/release-compass-react
```

```tsx
import {
  ReleaseCompassProvider,
  Changelog,
  RequestBoard,
} from "@techtrail/release-compass-react";

export function ProductUpdates() {
  return (
    <ReleaseCompassProvider ownerSlug="acme" projectSlug="signals">
      <Changelog />
      <RequestBoard />
    </ReleaseCompassProvider>
  );
}
```

Markup is headless (`data-rc` attributes). Style it in your app.

## Angular (public)

```bash
pnpm add @techtrail/release-compass-angular
```

```ts
import {
  provideReleaseCompass,
  RcChangelogComponent,
  RcRequestBoardComponent,
} from "@techtrail/release-compass-angular";

bootstrapApplication(AppComponent, {
  providers: [
    provideReleaseCompass({ ownerSlug: "acme", projectSlug: "signals" }),
  ],
});
```

```html
<rc-changelog />
<rc-request-board />
```

## Next.js (server / tokens)

```bash
pnpm add @techtrail/release-compass-next
```

Set server env (never `NEXT_PUBLIC_`):

```bash
RELEASE_COMPASS_API_KEY=rc_live_…
# Either:
RELEASE_COMPASS_OWNER_SLUG=acme
RELEASE_COMPASS_PROJECT_SLUG=signals
# Or combined:
# RELEASE_COMPASS_PROJECT=acme/signals
```

```ts
// app/api/requests/[id]/vote/route.ts
import { voteRequest } from "@techtrail/release-compass-next";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const { voter } = (await request.json()) as { voter: string };
  const updated = await voteRequest(id, voter);
  return Response.json(updated);
}
```

Private boards:

```ts
import { getRequestBoard } from "@techtrail/release-compass-next";

const board = await getRequestBoard({}); // uses RELEASE_COMPASS_API_KEY + owner/project env
```

## Core only

```ts
import {
  createPublicClient,
  createServerClient,
} from "@techtrail/release-compass-core";

const publicClient = createPublicClient({
  ownerSlug: "acme",
  projectSlug: "signals",
});
await publicClient.getChangelog();

// Server only — do not import into browser code
const server = createServerClient({
  ownerSlug: "acme",
  projectSlug: "signals",
  apiKey: process.env.RELEASE_COMPASS_API_KEY!,
});
await server.voteRequest("request-id", "user-42");
```

## Develop

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
```

Requires Node 24+ and pnpm 10+.

## Releasing

Public packages publish from GitHub Actions with [npm staged publishing](https://docs.npmjs.com/about-access-tokens#about-granular-access-tokens) and provenance (same trust model as [trusted publishing](https://docs.npmjs.com/trusted-publishers/)).

1. **Bump & tag** — set package versions, commit, push `vX.Y.Z` (e.g. `git tag v0.1.0 && git push origin v0.1.0`).
2. **CI stages** — `publish.yml` builds, then runs `npm stage publish` for each package (not a live release). Auth is OIDC when a Trusted Publisher is configured; until then the repo secret `NPM_STAGE_TOKEN` (granular, **stage only**) is used.
3. **You approve** — on a trusted machine with org 2FA:

```bash
npm stage list
npm stage approve <stage-id> --otp <code>
```

### npm package settings (once per package)

For `@techtrail/release-compass-core`, `-react`, `-angular`, and `-next`:

| Setting | Value |
| --- | --- |
| Trusted Publisher | GitHub · org `tech-trail-io` · repo `release-compass-clients` · workflow **`publish.yml`** · environment **`npm`** |
| Allowed actions | **`npm stage publish` only** (do not allow direct `npm publish`) |
| Publishing access | Prefer **Require 2FA and disallow tokens** after the first successful stage |

Create a GitHub Environment named `npm` on this repo (optional reviewers / wait timer).

Bootstrap tip: packages must exist on npm before Trusted Publisher can be attached. Use a short-lived [stage-only granular token](https://docs.npmjs.com/about-access-tokens#about-stage-only-tokens) as `NPM_STAGE_TOKEN` for the first `v*` tag, configure Trusted Publishers, then remove the secret if you want OIDC-only staging.
