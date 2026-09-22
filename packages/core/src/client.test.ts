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
        project: { name: "Signals", slug: "signals", requestBoard: "public" },
        locale: "en",
        availableLocales: ["en"],
        releases: [],
      }),
    );
    const client = createPublicClient({
      projectSlug: "signals",
      baseUrl: "https://api.example/api/v1",
      fetchImpl: fetchImpl as typeof fetch,
    });
    const changelog = await client.getChangelog({ lang: "en" });
    expect(changelog.project.slug).toBe("signals");
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.example/api/v1/public/changelogs/signals?lang=en",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("loads a public request board", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        project: {
          name: "Signals",
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
      projectSlug: "signals",
      baseUrl: "https://api.example/api/v1",
      fetchImpl: fetchImpl as typeof fetch,
    });
    await client.getRequestBoard();
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "https://api.example/api/v1/public/changelogs/signals/requests",
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
      projectSlug: "signals",
      apiKey: "rc_live_test",
      baseUrl: "https://api.example/api/v1",
      fetchImpl: fetchImpl as typeof fetch,
    });
    const board = await client.getRequestBoard();
    expect(board.requests).toHaveLength(1);
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "https://api.example/api/v1/requests",
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
