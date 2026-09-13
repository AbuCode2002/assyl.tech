import "server-only";

/** Admin data access. Aggregations are split by page under ./queries/*. */
export * from "./queries/overview";
export * from "./queries/leads";
export * from "./queries/visitors";
export * from "./queries/analytics";
export { isUuid, ONLINE_WINDOW_MS, onlineSinceMs } from "./queries/sql";
