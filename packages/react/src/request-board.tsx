"use client";

import {
  REQUEST_KIND_LABELS,
  REQUEST_STATUS_LABELS,
  type FeatureRequestDto,
  type PublicRequestBoardDto,
} from "@techtrail/release-compass-core";
import { useEffect, useState } from "react";
import { useReleaseCompass } from "./provider.js";

export interface RequestBoardProps {
  className?: string;
  emptyLabel?: string;
}

export function RequestBoard({
  className,
  emptyLabel = "No public requests yet.",
}: RequestBoardProps) {
  const { client } = useReleaseCompass();
  const [data, setData] = useState<PublicRequestBoardDto | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    client
      .getRequestBoard()
      .then((board) => {
        if (!cancelled) {
          setData(board);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [client]);

  if (loading) {
    return (
      <div className={className} data-rc="request-board" data-rc-state="loading">
        Loading requests…
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={className}
        data-rc="request-board"
        data-rc-state="error"
        role="alert"
      >
        {error}
      </div>
    );
  }

  const open = (data?.requests ?? []).filter(
    (request) => request.status !== "done" && request.status !== "declined",
  );
  const shipped = (data?.requests ?? []).filter(
    (request) => request.status === "done",
  );

  return (
    <div className={className} data-rc="request-board">
      <header data-rc="request-board-header">
        <h2 data-rc="project-name">{data?.project.name}</h2>
      </header>
      {open.length === 0 ? (
        <p data-rc="empty">{emptyLabel}</p>
      ) : (
        <ul data-rc="request-list">
          {open.map((request) => (
            <RequestItem key={request.id} request={request} />
          ))}
        </ul>
      )}
      {shipped.length > 0 ? (
        <section data-rc="shipped">
          <h3>Shipped</h3>
          <ul data-rc="shipped-list">
            {shipped.map((request) => (
              <RequestItem key={request.id} request={request} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function RequestItem({ request }: { request: FeatureRequestDto }) {
  return (
    <li
      data-rc="request"
      data-rc-kind={request.kind}
      data-rc-status={request.status}
    >
      <span data-rc="request-kind">{REQUEST_KIND_LABELS[request.kind]}</span>
      <h3 data-rc="request-title">{request.title}</h3>
      <span data-rc="request-status">
        {REQUEST_STATUS_LABELS[request.status]}
      </span>
      <span data-rc="request-votes">{request.voteCount}</span>
      {request.body ? <p data-rc="request-body">{request.body}</p> : null}
    </li>
  );
}
