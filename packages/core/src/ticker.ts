import type { EvacPoint, Level, TickerMode } from '@lobby/contract';
import { levelLabel } from './copy/id';
import { formatWibDateId } from './time';

export interface TickerAnnouncement {
  readonly title: string;
  readonly published_at: string;
}

export interface BuildTickerInput {
  readonly mode: TickerMode;
  readonly level: Level;
  readonly reason?: string | null | undefined;
  readonly evacuationPoints?: readonly EvacPoint[] | null | undefined;
  readonly notice?: string | null | undefined;
  readonly announcements?: readonly TickerAnnouncement[] | null | undefined;
  readonly tips?: readonly string[] | null | undefined;
}

/**
 * Pure function to construct running text items (F03 NFR-2).
 * Formats alerts, announcements, and tips strictly based on active TickerMode.
 */
export function buildTicker(input: BuildTickerInput): string[] {
  const items: string[] = [];

  // F02 R-4 / F03 R-5: Notice is always the first item in any mode if active
  if (input.notice && input.notice.trim().length > 0) {
    items.push(input.notice.trim());
  }

  const label = levelLabel[input.level];
  const reasonText = input.reason && input.reason.trim().length > 0 ? input.reason.trim() : '';
  const alertText = reasonText ? `${label}: ${reasonText}` : label;

  switch (input.mode) {
    case 'override': {
      // F03 R-2: Only alert warning, and evacuation points for RED
      items.push(alertText);
      if (input.level === 'RED' && input.evacuationPoints && input.evacuationPoints.length > 0) {
        const pointNames = input.evacuationPoints
          .slice(0, 3)
          .map((p) => p.name.trim())
          .filter((name) => name.length > 0);
        if (pointNames.length > 0) {
          items.push(`Titik kumpul: ${pointNames.join(', ')}`);
        }
      }
      break;
    }

    case 'priority': {
      // F03 R-3: Alert warning, then announcements, then tips
      items.push(alertText);
      appendAnnouncements(items, input.announcements);
      appendTips(items, input.tips);
      break;
    }

    case 'normal': {
      // F03 R-4: Announcements, then tips
      appendAnnouncements(items, input.announcements);
      appendTips(items, input.tips);
      break;
    }
  }

  // F03 R-8: Running text is never empty
  if (items.length === 0) {
    items.push(alertText);
  }

  return items;
}

function appendAnnouncements(
  items: string[],
  announcements?: readonly TickerAnnouncement[] | null,
): void {
  if (!announcements || announcements.length === 0) return;
  for (const ann of announcements.slice(0, 5)) {
    const title = ann.title.trim();
    if (!title) continue;
    try {
      const dateStr = formatWibDateId(new Date(ann.published_at));
      items.push(`PENGUMUMAN: ${title} (${dateStr})`);
    } catch {
      items.push(`PENGUMUMAN: ${title}`);
    }
  }
}

function appendTips(items: string[], tips?: readonly string[] | null): void {
  if (!tips || tips.length === 0) return;
  for (const tip of tips) {
    const trimmed = tip.trim();
    if (trimmed.length > 0) {
      items.push(trimmed);
    }
  }
}
