// Pure rule logic shared by the aggregator and the clients: no network, files, clock, or DOM.
export { assertNever } from './assert-never';
export { levelLabel, statusCopy } from './copy/id';
export { cimartPhase } from './cimart';
export {
  moduleFreshness,
  type Freshness,
  type FreshnessInput,
  type FreshnessPolicy,
} from './freshness';
export {
  MAX_EMERGENCY_CONTACTS,
  selectEmergencyContacts,
  selectEvacuationPoints,
} from './preparedness';
export { mergeQuakeLists, quakeKey, type TaggedQuake } from './quakes';
export {
  evaluateStatus,
  INITIAL_STATUS_POLICY_STATE,
  rawLevelOf,
  SIGAP_BASELINE_SAFE_ID,
  tickerModeFor,
  type StatusEvaluation,
  type StatusEvent,
  type StatusInput,
  type StatusPolicyConfig,
} from './status-policy';
export {
  daysBetween,
  formatWibTime,
  WIB_TIME_ZONE,
  wibClock,
  wibDateString,
  wibMinutesOfDay,
} from './time';
export { selectForecastDays, weatherIconFor, type WeatherIconMap } from './weather';
