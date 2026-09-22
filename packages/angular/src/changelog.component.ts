import { AsyncPipe } from "@angular/common";
import {
  Component,
  Inject,
  Input,
  type OnChanges,
  type SimpleChanges,
} from "@angular/core";
import {
  groupChanges,
  type PublicChangelogDto,
  type PublicClient,
  type PublicReleaseDto,
} from "@techtrail/release-compass-core";
import { from, type Observable, of } from "rxjs";
import { catchError, map, startWith } from "rxjs/operators";
import {
  RELEASE_COMPASS_CLIENT,
  RELEASE_COMPASS_CONFIG,
  type ReleaseCompassConfig,
} from "./provide";

interface ChangelogState {
  loading: boolean;
  error: string;
  data: PublicChangelogDto | null;
}

@Component({
  selector: "rc-changelog",
  standalone: true,
  imports: [AsyncPipe],
  template: `
    @if (state$ | async; as state) {
      @if (state.loading) {
        <div data-rc="changelog" data-rc-state="loading">Loading changelog…</div>
      } @else if (state.error) {
        <div data-rc="changelog" data-rc-state="error" role="alert">{{ state.error }}</div>
      } @else if (!state.data || state.data.releases.length === 0) {
        <div data-rc="changelog" data-rc-state="empty">{{ emptyLabel }}</div>
      } @else {
        <div data-rc="changelog" [attr.class]="className || null">
          <header data-rc="changelog-header">
            <h2 data-rc="project-name">{{ state.data.project.name }}</h2>
          </header>
          <ol data-rc="release-list">
            @for (release of state.data.releases; track release.id) {
              <li data-rc="release" [attr.data-rc-channel]="release.channel">
                <h3 data-rc="release-title">
                  <span data-rc="release-version">{{ release.version }}</span>
                  {{ release.title }}
                </h3>
                <time data-rc="release-date" [attr.dateTime]="release.publishedAt">
                  {{ release.publishedAt.slice(0, 10) }}
                </time>
                @if (release.body) {
                  <div data-rc="release-body">{{ release.body }}</div>
                }
                @for (group of changeGroups(release); track group.type) {
                  <section data-rc="change-group" [attr.data-rc-type]="group.type">
                    <h4 data-rc="change-group-label">{{ group.label }}</h4>
                    <ul>
                      @for (item of group.items; track $index) {
                        <li data-rc="change-item">
                          <strong>{{ item.title }}</strong>
                          @if (item.description) {
                            <p>{{ item.description }}</p>
                          }
                        </li>
                      }
                    </ul>
                  </section>
                }
              </li>
            }
          </ol>
        </div>
      }
    }
  `,
})
export class RcChangelogComponent implements OnChanges {
  @Input() className = "";
  @Input() emptyLabel = "No published notes yet.";

  state$: Observable<ChangelogState> = of({
    loading: true,
    error: "",
    data: null,
  });

  constructor(
    @Inject(RELEASE_COMPASS_CLIENT) private readonly client: PublicClient,
    @Inject(RELEASE_COMPASS_CONFIG) private readonly config: ReleaseCompassConfig,
  ) {
    this.reload();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.reload();
  }

  changeGroups(release: PublicReleaseDto) {
    return groupChanges(release.changes);
  }

  private reload(): void {
    this.state$ = from(this.client.getChangelog({ lang: this.config.lang })).pipe(
      map((data) => ({ loading: false, error: "", data })),
      startWith({ loading: true, error: "", data: null }),
      catchError((err: unknown) =>
        of({
          loading: false,
          error: err instanceof Error ? err.message : "Failed to load",
          data: null,
        }),
      ),
    );
  }
}
