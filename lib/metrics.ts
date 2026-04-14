type MetricRecord = {
  name: string;
  value: number;
  tags?: Record<string, string | number | boolean | undefined>;
};

const inMemoryCounters = new Map<string, number>();
const inMemoryDurations = new Map<string, number[]>();

const isDev = __DEV__;

const toTagString = (tags?: MetricRecord["tags"]) => {
  if (!tags) return "";
  const entries = Object.entries(tags).filter(([, value]) => value !== undefined);
  if (entries.length === 0) return "";
  return entries.map(([k, v]) => `${k}=${String(v)}`).join(",");
};

export const metrics = {
  increment(name: string, tags?: MetricRecord["tags"]) {
    const key = `${name}:${toTagString(tags)}`;
    inMemoryCounters.set(key, (inMemoryCounters.get(key) || 0) + 1);
    if (isDev) console.log(`[metrics] counter ${key}=${inMemoryCounters.get(key)}`);
  },

  observe(name: string, value: number, tags?: MetricRecord["tags"]) {
    const key = `${name}:${toTagString(tags)}`;
    const bucket = inMemoryDurations.get(key) || [];
    bucket.push(value);
    if (bucket.length > 200) bucket.shift();
    inMemoryDurations.set(key, bucket);
    if (isDev) console.log(`[metrics] observe ${key}=${Math.round(value)}ms`);
  },

  startTimer(name: string, tags?: MetricRecord["tags"]) {
    const start = Date.now();
    return () => {
      const elapsedMs = Date.now() - start;
      metrics.observe(name, elapsedMs, tags);
      return elapsedMs;
    };
  },
};

