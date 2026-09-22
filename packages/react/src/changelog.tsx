"use client";

import {
  groupChanges,
  type PublicChangelogDto,
  type PublicReleaseDto,
} from "@techtrail/release-compass-core";
import { useEffect, useState } from "react";
import { useReleaseCompass } from "./provider.js";

export interface ChangelogProps {
  className?: string;
  emptyLabel?: string;
}

export function Changelog({
  className,
  emptyLabel = "No published notes yet.",
}: ChangelogProps) {
  const { client, lang } = useReleaseCompass();
  const [data, setData] = useState<PublicChangelogDto | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    client
      .getChangelog({ lang })
      .then((changelog) => {
        if (!cancelled) {
          setData(changelog);
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
  }, [client, lang]);

  if (loading) {
    return (
      <div className={className} data-rc="changelog" data-rc-state="loading">
        Loading changelog…
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={className}
        data-rc="changelog"
        data-rc-state="error"
        role="alert"
      >
        {error}
      </div>
    );
  }

  if (!data || data.releases.length === 0) {
    return (
      <div className={className} data-rc="changelog" data-rc-state="empty">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className={className} data-rc="changelog">
      <header data-rc="changelog-header">
        <h2 data-rc="project-name">{data.project.name}</h2>
      </header>
      <ol data-rc="release-list">
        {data.releases.map((release) => (
          <ReleaseItem key={release.id} release={release} />
        ))}
      </ol>
    </div>
  );
}

function ReleaseItem({ release }: { release: PublicReleaseDto }) {
  const groups = groupChanges(release.changes);
  return (
    <li data-rc="release" data-rc-channel={release.channel}>
      <h3 data-rc="release-title">
        <span data-rc="release-version">{release.version}</span>{" "}
        {release.title}
      </h3>
      <time data-rc="release-date" dateTime={release.publishedAt}>
        {release.publishedAt.slice(0, 10)}
      </time>
      {release.body ? <div data-rc="release-body">{release.body}</div> : null}
      {groups.map((group) => (
        <section key={group.type} data-rc="change-group" data-rc-type={group.type}>
          <h4 data-rc="change-group-label">{group.label}</h4>
          <ul>
            {group.items.map((item, index) => (
              <li key={`${group.type}-${index}`} data-rc="change-item">
                <strong>{item.title}</strong>
                {item.description ? <p>{item.description}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </li>
  );
}
