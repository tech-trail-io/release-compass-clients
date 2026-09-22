import { AsyncPipe } from "@angular/common";
import {
  Component,
  Inject,
  Input,
  type OnChanges,
  type SimpleChanges,
} from "@angular/core";
import {
  REQUEST_KIND_LABELS,
  REQUEST_STATUS_LABELS,
  type FeatureRequestDto,
  type PublicClient,
  type PublicRequestBoardDto,
} from "@techtrail/release-compass-core";
import { from, type Observable, of } from "rxjs";
import { catchError, map, startWith } from "rxjs/operators";
import { RELEASE_COMPASS_CLIENT } from "./provide";

interface BoardState {
  loading: boolean;
  error: string;
  data: PublicRequestBoardDto | null;
}

@Component({
  selector: "rc-request-board",
  standalone: true,
  imports: [AsyncPipe],
  template: `
    @if (state$ | async; as state) {
      @if (state.loading) {
        <div data-rc="request-board" data-rc-state="loading">Loading requests…</div>
      } @else if (state.error) {
        <div data-rc="request-board" data-rc-state="error" role="alert">{{ state.error }}</div>
      } @else {
        <div data-rc="request-board" [attr.class]="className || null">
          <header data-rc="request-board-header">
            <h2 data-rc="project-name">{{ state.data?.project.name }}</h2>
          </header>
          @if (openRequests(state.data).length === 0) {
            <p data-rc="empty">{{ emptyLabel }}</p>
          } @else {
            <ul data-rc="request-list">
              @for (request of openRequests(state.data); track request.id) {
                <li
                  data-rc="request"
                  [attr.data-rc-kind]="request.kind"
                  [attr.data-rc-status]="request.status"
                >
                  <span data-rc="request-kind">{{ kindLabel(request) }}</span>
                  <h3 data-rc="request-title">{{ request.title }}</h3>
                  <span data-rc="request-status">{{ statusLabel(request) }}</span>
                  <span data-rc="request-votes">{{ request.voteCount }}</span>
                  @if (request.body) {
                    <p data-rc="request-body">{{ request.body }}</p>
                  }
                </li>
              }
            </ul>
          }
          @if (shippedRequests(state.data).length > 0) {
            <section data-rc="shipped">
              <h3>Shipped</h3>
              <ul data-rc="shipped-list">
                @for (request of shippedRequests(state.data); track request.id) {
                  <li
                    data-rc="request"
                    [attr.data-rc-kind]="request.kind"
                    [attr.data-rc-status]="request.status"
                  >
                    <span data-rc="request-kind">{{ kindLabel(request) }}</span>
                    <h3 data-rc="request-title">{{ request.title }}</h3>
                    <span data-rc="request-votes">{{ request.voteCount }}</span>
                  </li>
                }
              </ul>
            </section>
          }
        </div>
      }
    }
  `,
})
export class RcRequestBoardComponent implements OnChanges {
  @Input() className = "";
  @Input() emptyLabel = "No public requests yet.";

  readonly kindLabels = REQUEST_KIND_LABELS;
  readonly statusLabels = REQUEST_STATUS_LABELS;

  state$: Observable<BoardState> = of({
    loading: true,
    error: "",
    data: null,
  });

  constructor(
    @Inject(RELEASE_COMPASS_CLIENT) private readonly client: PublicClient,
  ) {
    this.reload();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.reload();
  }

  openRequests(data: PublicRequestBoardDto | null): FeatureRequestDto[] {
    return (data?.requests ?? []).filter(
      (request) => request.status !== "done" && request.status !== "declined",
    );
  }

  shippedRequests(data: PublicRequestBoardDto | null): FeatureRequestDto[] {
    return (data?.requests ?? []).filter((request) => request.status === "done");
  }

  kindLabel(request: FeatureRequestDto): string {
    return REQUEST_KIND_LABELS[request.kind];
  }

  statusLabel(request: FeatureRequestDto): string {
    return REQUEST_STATUS_LABELS[request.status];
  }

  private reload(): void {
    this.state$ = from(this.client.getRequestBoard()).pipe(
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
