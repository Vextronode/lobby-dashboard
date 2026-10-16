/**
 * Exhaustiveness guard for `switch` over union literals (guidelines §5.3).
 * Adding a new `Level`, `ModuleState`, or `TickerMode` value makes every unhandled switch fail to compile.
 * @example
 * switch (state) { case 'ok': …; default: return assertNever(state); }
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${JSON.stringify(value)}`);
}
