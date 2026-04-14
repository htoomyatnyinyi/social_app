# Performance Runbook

This runbook explains how to triage and fix performance regressions detected by the nightly workflow.

## Trigger

- Nightly workflow `Perf Nightly` fails.
- Manual perf check fails on `bun run perf:smoke`.

## Immediate Checks

1. Confirm `PERF_API_URL` points to the expected environment.
2. Verify backend release changes in the last 24 hours.
3. Confirm there was no infrastructure incident (DB, cache, network).

## Investigate

1. Review CI log output for:
   - `p50Ms`
   - `p95Ms`
   - `errorRate`
2. Re-run locally with identical env values:
   - `API_URL`
   - `PERF_TOKEN`
   - `PERF_ITERATIONS`
3. Compare to previous baseline in CI history.

## Likely Sources

- Duplicate client refetch triggers caused request amplification.
- Slow websocket reconnect path or unstable network transitions.
- API endpoint regressions on `/notifications/unread-count` or chat routes.
- Increased backend latency from query/index regressions.

## Mitigation

1. Revert the most recent high-risk client change if p95 regression > 15%.
2. Reduce aggressive polling/refetch options temporarily.
3. Roll back backend deployment if endpoint latency and error spikes persist.

## Exit Criteria

- Two consecutive perf runs pass budgets:
  - `p95Ms <= 900`
  - `errorRate <= 0.01`
- Incident notes include root cause and corrective action.

