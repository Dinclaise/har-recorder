declare module '../../stats.js' {
  export class Stats {
    url: string | undefined;
    entries: Record<string, unknown>;
    user: unknown;
    firstRequestId: string | undefined;
    firstRequestMs: number | undefined;
    constructor(url?: string, options?: unknown);
  }

  export class StatsBuilder {
    static processEvent(
      stats: Stats,
      event: { method: string; params: Record<string, unknown> },
    ): void;
  }
}

declare module '../../har.js' {
  import type { Stats } from '../../stats.js';

  export class HARBuilder {
    create(pages: Stats[], domain: string): unknown;
  }
}
