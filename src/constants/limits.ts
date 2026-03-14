/** Files under this size are parsed in the main thread with JSON.parse */
export const DIRECT_PARSE_LIMIT = 10 * 1024 * 1024; // 10 MB

/** Files under this size are parsed via JSON.parse in a Web Worker */
export const WORKER_PARSE_LIMIT = 50 * 1024 * 1024; // 50 MB

/** Maximum file size supported (streaming parse) */
export const STREAM_PARSE_LIMIT = 500 * 1024 * 1024; // 500 MB

/** jq-web can handle JSON up to this size in memory */
export const JQ_DIRECT_LIMIT = 50 * 1024 * 1024; // 50 MB

/** Lazy-load children when a node has more than this many */
export const TREE_LAZY_THRESHOLD = 1000;

/** Stream chunk size */
export const CHUNK_SIZE = 64 * 1024; // 64 KB

/** Extra rows rendered outside the visible viewport */
export const VIRTUAL_OVERSCAN = 20;

/** Tree row height in pixels */
export const TREE_ROW_HEIGHT = 28;

/** Max depth for "expand all" operation */
export const MAX_EXPAND_ALL_DEPTH = 5;

/** Max query history entries */
export const MAX_QUERY_HISTORY = 50;
