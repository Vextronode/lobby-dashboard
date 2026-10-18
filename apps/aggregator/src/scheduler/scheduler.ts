import type { ModuleId } from '../modules/module-data';
import type { Logger } from '../observability/logger';

/** Gap between module starts at boot (LOBBY-02 FR-A1). */
export const START_STAGGER_MS = 2_000;

export interface SchedulerJob {
  readonly id: ModuleId;
  /** One sync; resolves with the failure streak after it. Expected failures never reject. */
  run(): Promise<{ readonly consecutiveFailures: number }>;
  /** Delay in ms before the next run, given the failure streak. */
  delayAfterMs(consecutiveFailures: number): number;
}

/**
 * One timer chain per module. The next run is scheduled only after the current one finishes, so
 * syncs of the same module never overlap (FR-A2). Timers are cleared on stop (guidelines §6.3).
 */
export class Scheduler {
  private readonly timers = new Map<ModuleId, ReturnType<typeof setTimeout>>();
  private readonly nextRuns = new Map<ModuleId, Date>();
  private running = false;

  constructor(
    private readonly jobs: readonly SchedulerJob[],
    private readonly now: () => Date,
    private readonly logger: Logger,
  ) {}

  start(staggerMs = START_STAGGER_MS): void {
    if (this.running) return;
    this.running = true;
    this.jobs.forEach((job, index) => {
      this.schedule(job, index * staggerMs);
    });
  }

  stop(): void {
    this.running = false;
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
    this.nextRuns.clear();
  }

  isRunning(): boolean {
    return this.running;
  }

  nextRunAt(id: ModuleId): Date | null {
    return this.nextRuns.get(id) ?? null;
  }

  private schedule(job: SchedulerJob, delayMs: number): void {
    this.nextRuns.set(job.id, new Date(this.now().getTime() + delayMs));
    this.timers.set(
      job.id,
      setTimeout(() => {
        void this.execute(job);
      }, delayMs),
    );
  }

  private async execute(job: SchedulerJob): Promise<void> {
    this.timers.delete(job.id);
    this.nextRuns.delete(job.id);
    let consecutiveFailures = 0;
    try {
      ({ consecutiveFailures } = await job.run());
    } catch (error) {
      // A bug, not an upstream failure: log it and keep the module on its normal schedule.
      this.logger.error({ module: job.id, err: error }, 'sync crashed');
    }
    if (this.running) this.schedule(job, job.delayAfterMs(consecutiveFailures));
  }
}
