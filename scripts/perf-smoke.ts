const API_URL = process.env.EXPO_PUBLIC_API_URL || process.env.API_URL;
const TOKEN = process.env.PERF_TOKEN;
const ITERATIONS = Number(process.env.PERF_ITERATIONS || 20);
const P95_BUDGET_MS = Number(process.env.PERF_P95_BUDGET_MS || 900);
const ERROR_BUDGET = Number(process.env.PERF_ERROR_BUDGET || 0.01);

if (!API_URL) {
  throw new Error("Missing API_URL or EXPO_PUBLIC_API_URL for perf smoke test.");
}

const percentile = (values: number[], p: number) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
};

const run = async () => {
  const durations: number[] = [];
  let failures = 0;

  for (let i = 0; i < ITERATIONS; i++) {
    const started = Date.now();
    try {
      const response = await fetch(`${API_URL}/notifications/unread-count`, {
        headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
      });
      const elapsed = Date.now() - started;
      durations.push(elapsed);

      if (!response.ok) failures += 1;
    } catch {
      failures += 1;
    }
  }

  const p50 = percentile(durations, 50);
  const p95 = percentile(durations, 95);
  const errorRate = failures / ITERATIONS;

  console.log(
    JSON.stringify(
      {
        endpoint: "/notifications/unread-count",
        iterations: ITERATIONS,
        p50Ms: p50,
        p95Ms: p95,
        errorRate,
      },
      null,
      2,
    ),
  );

  if (p95 > P95_BUDGET_MS) {
    throw new Error(`Perf regression: p95 ${p95}ms exceeds budget ${P95_BUDGET_MS}ms`);
  }
  if (errorRate > ERROR_BUDGET) {
    throw new Error(`Perf regression: error rate ${errorRate} exceeds budget ${ERROR_BUDGET}`);
  }
};

run();

