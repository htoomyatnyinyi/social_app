# Mobile Performance KPIs

This document defines baseline performance targets for `social_app` and how to measure them consistently.

## Targets

- App cold start to first interactive frame (p50): <= 2.5s
- App cold start to first interactive frame (p95): <= 4.0s
- Feed first content render after app open (p50): <= 1.2s
- Feed first content render after app open (p95): <= 2.5s
- Chat message send roundtrip ack (p50): <= 400ms
- Chat message send roundtrip ack (p95): <= 900ms
- Notification websocket reconnect success within 10s: >= 99%
- Notification websocket reconnect attempts per foreground hour (p95): <= 3
- API request failure rate for key screens (feed/chat/notifications): < 1%

## Test Conditions

- Use the same test account and stable dataset for all runs.
- Use one physical Android mid-range device and one iOS device.
- Run tests on:
  - Strong Wi-Fi
  - Constrained network profile (high latency + packet loss)
- Run at least 30 sessions per profile before comparing p95.

## Measurement Rules

- Record metrics with the app performance helper in `src/lib/metrics.ts`.
- Compare before/after only when backend version and seed data are unchanged.
- Store nightly summaries in CI artifacts for trend inspection.

## Release Gate

- A release candidate should be blocked when any p95 KPI regresses by >15% from the previous baseline.
- If blocked, include:
  - impacted KPI
  - affected screen flow
  - reproduction conditions
  - rollback or mitigation plan
