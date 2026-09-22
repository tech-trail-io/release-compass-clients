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

Public packages publish from GitHub Actions with [provenance](https://docs.npmjs.com/generating-provenance-statements/) and [staged publishing](https://docs.npmjs.com/staged-publishing/) after the first version exists ([trusted publishing](https://docs.npmjs.com/trusted-publishers/)).

1. **Bump & tag** — push `vX.Y.Z` (e.g. `git tag v0.1.0 && git push origin v0.1.0`).
2. **CI** — `publish.yml` builds, then for each package:
   - **New name** (not on npm yet) → `npm publish --access public` (creates the package; [stage cannot](https://docs.npmjs.com/staged-publishing/))
   - **Existing** → `npm stage publish` (not live until you approve)
3. **Approve staged versions** (existing packages only):

```bash
npm stage list
npm stage approve <stage-id> --otp <code>
```

### Auth

| Situation | What to use |
| --- | --- |
| **First create** (package name not on npm) | CI cannot supply a 2FA OTP. Either publish once **locally** with `--otp`, or use a temporary granular token with **Bypass 2FA** + **publish** as `NPM_STAGE_TOKEN`, then revoke Bypass 2FA |
| Later versions | Prefer Trusted Publisher with **`npm stage publish` only**; approve with 2FA (`npm stage approve`) |

Stage-only tokens and “Require 2FA / disallow tokens” are correct **after** the package exists — they will not create the first version from CI ([EOTP](https://docs.npmjs.com/about-access-tokens)).

#### Local first publish (no Bypass 2FA)

```bash
pnpm install && pnpm build
# after aligning versions, for each package:
(cd packages/core && npm publish --access public --otp=123456)
(cd packages/react && npm publish --access public --otp=123456)
(cd packages/angular && npm publish --access public --otp=123456)
(cd packages/next && npm publish --access public --otp=123456)
```

Then configure Trusted Publisher on each package and use tags + stage for later releases.

Trusted Publisher (once the package exists on npmjs.com):

| Setting | Value |
| --- | --- |
| GitHub | org `tech-trail-io` · repo `release-compass-clients` · workflow **`publish.yml`** · environment **`npm`** |
| Allowed actions | Both publish + stage for bootstrap, then **stage only** if you want |
| Publishing access | Prefer **Require 2FA and disallow tokens** after OIDC works |

Create a GitHub Environment named `npm` on this repo (optional reviewers).
