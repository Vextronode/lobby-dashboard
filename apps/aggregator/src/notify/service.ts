import type { Logger } from '../observability/logger';
import type { Notifier } from './notifier';
import {
  evaluateNotifications,
  INITIAL_NOTIFICATION_STATE,
  type NotificationInputs,
  type NotificationState,
} from './rules';

/** Applies the notification rules and delivers messages; a delivery failure is only logged (F14 R-8). */
export class NotificationService {
  private state: NotificationState;

  constructor(
    private readonly notifier: Notifier,
    private readonly logger: Logger,
    initial: NotificationState = INITIAL_NOTIFICATION_STATE,
    private readonly onStateChange: () => void = () => undefined,
  ) {
    this.state = initial;
  }

  getState(): NotificationState {
    return this.state;
  }

  async evaluate(inputs: NotificationInputs): Promise<void> {
    if (!this.notifier.enabled) return;
    // State is updated before any await, so overlapping evaluations never send twice.
    const { messages, nextState } = evaluateNotifications(this.state, inputs);
    if (messages.length === 0) return;
    this.state = nextState;
    this.onStateChange();
    for (const message of messages) {
      try {
        await this.notifier.send(message.audience, message.text);
        this.logger.info({ audience: message.audience }, 'notification sent');
      } catch (error) {
        const kind = error instanceof Error ? error.message : 'unknown';
        this.logger.warn({ audience: message.audience, error_kind: kind }, 'notification failed');
      }
    }
  }
}
