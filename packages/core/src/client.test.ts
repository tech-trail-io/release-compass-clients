import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createPublicClient,
  createServerClient,
  ReleaseCompassError,
} from "./index.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createPublicClient", () => {
  it("loads a public changelog", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        project: {
          name: "Signals",
          ownerSlug: "acme",
          slug: "signals",
          requestBoard: "public",
        },
        locale: "en",
        availableLocales: ["en"],
        releases: [],
      }),
    );
    const client = createPublicClient({
      ownerSlug: "acme",
      projectSlug: "signals",
      baseUrl: "https://api.example/api/v1",
      fetchImpl: fetchImpl as typeof fetch,
    });
    const changelog = await client.getChangelog({ lang: "en" });
    expect(changelog.project.slug).toBe("signals");
    expect(changelog.project.ownerSlug).toBe("acme");
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.example/api/v1/public/changelogs/acme/signals?lang=en",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("accepts owner as an alias for ownerSlug", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        project: {
          name: "Signals",
          ownerSlug: "acme",
          slug: "signals",
          requestBoard: "public",
        },
        locale: "en",
        availableLocales: ["en"],
        releases: [],
      }),
    );
    const client = createPublicClient({
      owner: "acme",
      projectSlug: "signals",
      baseUrl: "https://api.example/api/v1",
      fetchImpl: fetchImpl as typeof fetch,
    });
    await client.getChangelog();
    expect(client.ownerSlug).toBe("acme");
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "https://api.example/api/v1/public/changelogs/acme/signals",
    );
  });

  it("loads a public request board", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        project: {
          name: "Signals",
          ownerSlug: "acme",
          slug: "signals",
          requestBoard: "public",
          requestRevealIdentities: false,
          requestEmailVoting: false,
          requestApprovals: false,
        },
        requests: [],
      }),
    );
    const client = createPublicClient({
      ownerSlug: "acme",
      projectSlug: "signals",
      baseUrl: "https://api.example/api/v1",
      fetchImpl: fetchImpl as typeof fetch,
    });
    await client.getRequestBoard();
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "https://api.example/api/v1/public/changelogs/acme/signals/requests",
    );
  });

  it("subscribes with owner and project slugs", async () => {
    const fetchImpl = vi.fn(async () => Response.json({ status: "pending" }));
    const client = createPublicClient({
      ownerSlug: "acme",
      projectSlug: "signals",
      baseUrl: "https://api.example/api/v1",
      fetchImpl: fetchImpl as typeof fetch,
    });
    await client.subscribe({ email: "user@example.com" });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.example/api/v1/subscribers",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          ownerSlug: "acme",
          projectSlug: "signals",
          email: "user@example.com",
        }),
      }),
    );
  });
});

describe("createServerClient", () => {
  it("lists private board requests with the API key", async () => {
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.headers).toMatchObject({
        Authorization: "Bearer rc_live_test",
      });
      return Response.json([
        {
          id: "req1",
          projectId: "p1",
          kind: "feature",
          title: "Dark mode",
          status: "open",
          voteCount: 2,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ]);
    });
    const client = createServerClient({
      ownerSlug: "acme",
      projectSlug: "signals",
      apiKey: "rc_live_test",
      baseUrl: "https://api.example/api/v1",
      fetchImpl: fetchImpl as typeof fetch,
    });
    const board = await client.getRequestBoard();
    expect(board.requests).toHaveLength(1);
    expect(board.ownerSlug).toBe("acme");
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "https://api.example/api/v1/requests",
    );
  });

  it("loads changelog via owner/project public path", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        project: {
          name: "Signals",
          ownerSlug: "acme",
          slug: "signals",
          requestBoard: "public",
        },
        locale: "en",
        availableLocales: ["en"],
        releases: [],
      }),
    );
    const client = createServerClient({
      ownerSlug: "acme",
      projectSlug: "signals",
      apiKey: "rc_live_test",
      baseUrl: "https://api.example/api/v1",
      fetchImpl: fetchImpl as typeof fetch,
    });
    await client.getChangelog({ lang: "en" });
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "https://api.example/api/v1/public/changelogs/acme/signals?lang=en",
    );
  });

  it("votes with a voter id", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        id: "req1",
        projectId: "p1",
        kind: "feature",
        title: "Dark mode",
        status: "open",
        voteCount: 3,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      }),
    );
    const client = createServerClient({
      ownerSlug: "acme",
      projectSlug: "signals",
      apiKey: "rc_live_test",
      baseUrl: "https://api.example/api/v1",
      fetchImpl: fetchImpl as typeof fetch,
    });
    await client.voteRequest("req1", "user-42");
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.example/api/v1/requests/req1/votes",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ voter: "user-42" }),
      }),
    );
  });

  it("creates and updates requests", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          id: "req2",
          projectId: "p1",
          kind: "bugfix",
          title: "Crash",
          status: "open",
          voteCount: 0,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          id: "req2",
          projectId: "p1",
          kind: "bugfix",
          title: "Crash",
          status: "planned",
          voteCount: 0,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-02T00:00:00.000Z",
        }),
      );
    const client = createServerClient({
      ownerSlug: "acme",
      projectSlug: "signals",
      apiKey: "rc_live_test",
      baseUrl: "https://api.example/api/v1",
      fetchImpl: fetchImpl as typeof fetch,
    });
    await client.createRequest({ kind: "bugfix", title: "Crash" });
    await client.updateRequest("req2", { status: "planned" });
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "https://api.example/api/v1/requests",
    );
    expect(fetchImpl.mock.calls[1]?.[0]).toBe(
      "https://api.example/api/v1/requests/req2",
    );
  });

  it("throws ReleaseCompassError on failure", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({ message: "Already voted" }, { status: 409 }),
    );
    const client = createServerClient({
      ownerSlug: "acme",
      projectSlug: "signals",
      apiKey: "rc_live_test",
      baseUrl: "https://api.example/api/v1",
      fetchImpl: fetchImpl as typeof fetch,
    });
    await expect(client.voteRequest("req1", "user-42")).rejects.toBeInstanceOf(
      ReleaseCompassError,
    );
  });
});
