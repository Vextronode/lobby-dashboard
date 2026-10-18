/** Last time each configured TV polled the status (F13 R-8). Unknown device IDs are ignored (F14 R-7). */
export class DeviceRegistry {
  private readonly lastSeenById = new Map<string, string>();

  constructor(
    private readonly allowedIds: readonly string[],
    initial: Readonly<Record<string, string>> = {},
  ) {
    for (const [id, seenAt] of Object.entries(initial)) {
      if (allowedIds.includes(id)) this.lastSeenById.set(id, seenAt);
    }
  }

  /** Records a poll; returns false for devices not in config. */
  see(id: string, now: Date): boolean {
    if (!this.allowedIds.includes(id)) return false;
    this.lastSeenById.set(id, now.toISOString());
    return true;
  }

  lastSeen(): Record<string, string | null> {
    return Object.fromEntries(this.allowedIds.map((id) => [id, this.lastSeenById.get(id) ?? null]));
  }

  /** Persisted part (seen devices only). */
  toSnapshot(): Record<string, string> {
    return Object.fromEntries(this.lastSeenById);
  }
}
