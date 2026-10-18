import { utcDateTimeSchema } from '@lobby/contract';
import { wibClock, wibMinutesOfDay } from '@lobby/core';
import { z } from 'zod';
import type { LobbyConfig } from '../config/config-schema';
import type { ModuleId } from '../modules/module-data';
import { notificationCopy, SYSTEM_OF_MODULE, UPSTREAM_SYSTEMS } from './messages';
import type { Audience } from './notifier';

/** F14 R-1. */
export const FAILURES_BEFORE_ALERT = 5;
/** F14 R-2. */
export const REMINDER_INTERVAL_MS = 6 * 3_600_000;
/** F14 R-3. */
export const DEVICE_SILENCE_MS = 5 * 60_000;

const MINUTES_PER_HOUR = 60;

/** What was already sent, persisted in the snapshot so a restart does not resend (FR-F2, AC-5). */
export const notificationStateSchema = z.object({
  /** Keyed by upstream system: one message per system, not per module. */
  systems: z.record(
    z.string(),
    z.object({ down_since: utcDateTimeSchema, last_sent_at: utcDateTimeSchema }),
  ),
  devices: z.record(z.string(), z.object({ down_since: utcDateTimeSchema })),
});

export type NotificationState = z.infer<typeof notificationStateSchema>;

export const INITIAL_NOTIFICATION_STATE: NotificationState = { systems: {}, devices: {} };

export interface ModuleHealth {
  readonly id: ModuleId;
  readonly consecutiveFailures: number;
  readonly firstFailureAt: Date | null;
  readonly fetchedAt: Date | null;
}

export interface DeviceHealth {
  readonly id: string;
  readonly lastSeen: Date | null;
}

export interface NotificationInputs {
  readonly modules: readonly ModuleHealth[];
  readonly devices: readonly DeviceHealth[];
  readonly now: Date;
  /** Devices never seen count as silent from this moment (process start). */
  readonly monitoringSince: Date;
  readonly operatingHours: LobbyConfig['operating_hours'];
}

export interface OutgoingMessage {
  readonly audience: Audience;
  readonly text: string;
}

export interface NotificationDecision {
  readonly messages: readonly OutgoingMessage[];
  readonly nextState: NotificationState;
}

function minutesOf(hhmm: string): number {
  const [hours = 0, minutes = 0] = hhmm.split(':').map(Number);
  return hours * MINUTES_PER_HOUR + minutes;
}

/** F14 R-4: inside the configured WIB days and hours (end exclusive). */
export function isWithinOperatingHours(now: Date, hours: LobbyConfig['operating_hours']): boolean {
  const minutes = wibMinutesOfDay(now);
  return (
    hours.days.includes(wibClock(now).weekday) &&
    minutes >= minutesOf(hours.start) &&
    minutes < minutesOf(hours.end)
  );
}

/**
 * Decides which notifications to send now (F14 R-1 to R-7). Pure: the caller sends the messages and
 * keeps `nextState`. A message is recorded as sent before it is delivered, so a Telegram failure is
 * only logged and never causes a burst of retries (R-8).
 *
 * Source problems are grouped per upstream system (decision 18 Oct): a system is down once any of
 * its modules failed 5 times in a row, the message lists every failing card, and the system counts
 * as recovered only when all its modules succeed again.
 */
export function evaluateNotifications(
  state: NotificationState,
  inputs: NotificationInputs,
): NotificationDecision {
  const messages: OutgoingMessage[] = [];
  const systems = new Map(Object.entries(state.systems));
  const devices = new Map(Object.entries(state.devices));
  const { now } = inputs;
  const nowIso = now.toISOString();

  for (const system of UPSTREAM_SYSTEMS) {
    const failing = inputs.modules.filter(
      (health) => SYSTEM_OF_MODULE[health.id] === system && health.consecutiveFailures > 0,
    );
    const cards = failing.map((health) => ({ module: health.id, fetchedAt: health.fetchedAt }));
    const sent = systems.get(system);
    if (sent === undefined) {
      const worst = Math.max(0, ...failing.map((health) => health.consecutiveFailures));
      if (worst < FAILURES_BEFORE_ALERT) continue;
      const since = earliest(failing.map((health) => health.firstFailureAt)) ?? now;
      messages.push({
        audience: 'tech',
        text: notificationCopy.systemDown(system, since, worst, cards),
      });
      systems.set(system, { down_since: since.toISOString(), last_sent_at: nowIso });
    } else if (failing.length === 0) {
      messages.push({ audience: 'tech', text: notificationCopy.systemRecovered(system, now) });
      systems.delete(system);
    } else if (now.getTime() - Date.parse(sent.last_sent_at) >= REMINDER_INTERVAL_MS) {
      messages.push({
        audience: 'tech',
        text: notificationCopy.systemStillDown(system, new Date(sent.down_since), cards),
      });
      systems.set(system, { ...sent, last_sent_at: nowIso });
    }
  }

  // Name the device only when more than one TV is monitored.
  const label = (id: string) => (inputs.devices.length > 1 ? id : null);
  for (const device of inputs.devices) {
    const silentSince = device.lastSeen ?? inputs.monitoringSince;
    const isSilent = now.getTime() - silentSince.getTime() > DEVICE_SILENCE_MS;
    const sent = devices.get(device.id);
    if (sent === undefined) {
      if (!isSilent || !isWithinOperatingHours(now, inputs.operatingHours)) continue;
      messages.push({
        audience: 'admin',
        text: notificationCopy.deviceDown(label(device.id), silentSince),
      });
      devices.set(device.id, { down_since: silentSince.toISOString() });
    } else if (!isSilent) {
      // R-5: the recovery goes to the same group, even outside operating hours.
      messages.push({
        audience: 'admin',
        text: notificationCopy.deviceRecovered(label(device.id), now),
      });
      devices.delete(device.id);
    }
  }

  return {
    messages,
    nextState: { systems: Object.fromEntries(systems), devices: Object.fromEntries(devices) },
  };
}

function earliest(dates: readonly (Date | null)[]): Date | null {
  const times = dates.flatMap((date) => (date === null ? [] : [date.getTime()]));
  return times.length === 0 ? null : new Date(Math.min(...times));
}
