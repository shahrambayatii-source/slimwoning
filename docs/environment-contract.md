# Environment contract

Status: P0-A initial documentation milestone only. This is an inventory of
configuration names and evidence requirements, not provider configuration or
production-readiness certification. SW-041, SW-042, SW-044 and SW-046 remain open;
SW-044 and SW-046 remain OPEN / NOT VERIFIED LIVE.

The accepted repository/HEAD, source ledger and milestone boundaries are in
[launch contract](launch-contract.md). Repository evidence below is anchored to
`6264cf8b03a306aa0cae6600825a74599319fcae`. No environment-variable values,
credentials, provider IDs, deployed domains or selected runtime versions are
recorded here. A name appearing in code does not prove it is configured or valid.

## Consumed configuration names

Only names consumed by the repository are listed. Evidence links identify source
files; the line numbers are the accepted baseline locations. Repeated consumers
share the same contract; representative and boundary-sensitive sites are cited.

| Configuration name | Boundary and compatibility requirement | Repository evidence |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser-public configuration also consumed server-side; preserve compatible project binding, which is NOT VERIFIED | [shared client](../src/lib/supabase.ts), line 3; [checkout API](../src/app/api/create-checkout-session/route.ts), line 14; [renewal API](../src/app/api/renew-subscriptions/route.ts), line 5 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-public anon credential name; not service-role authority and not proof of secure effective RLS/grants | [shared client](../src/lib/supabase.ts), line 4; [layout](../src/app/layout.tsx), lines 22-23 |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged server secret; never place its value in browser assets, public configuration, logs or documentation | [checkout API](../src/app/api/create-checkout-session/route.ts), line 15; [renewal API](../src/app/api/renew-subscriptions/route.ts), line 6 |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Browser-public key name; actual API/referrer restrictions and quotas NOT VERIFIED; also a coordinate-repair fallback, requiring a reviewed cross-consumer contract | [map loader](../src/components/BelgiumMap.tsx), line 405; [coordinate repair](../src/app/api/fix-property-coordinates/route.ts), line 9; [valuation](../src/app/verkopen/schatting/page.tsx), line 342 |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Additional browser-public fallback name; do not silently remove/rename before consumer and environment reconciliation | [valuation](../src/app/verkopen/schatting/page.tsx), line 342 |
| `GOOGLE_MAPS_SERVER_API_KEY` | Server-side credential name; preserve server-only handling and verify restrictions/cost controls before later use | [location analysis](../src/app/api/location-analysis/route.ts), line 3; [coordinate repair](../src/app/api/fix-property-coordinates/route.ts), line 8 |
| `GOOGLE_MAPS_API_KEY` | Server-side Google Places credential name used by agent-request lookup helpers, distinct from the other Google names; effective binding, restrictions and provider acceptance NOT VERIFIED | [agent request](../src/app/dashboard/properties/[id]/makelaar-aanvraag/page.tsx), references at lines 233 and 252 |
| `OPENAI_API_KEY` | Server secret; never expose through browser configuration, reports, logs or committed documents | [ask API](../src/app/api/ask/route.ts), line 21; [MarktRadar](../src/app/api/marktradar/route.ts), line 17; [photo analysis](../src/app/api/renovatie-photo-analysis/route.ts), lines 548 and 569 |
| `OPENAI_VISION_MODEL` | Server-side model-selection configuration, not a credential; consumed value and effective model availability are not inspected or certified | [photo analysis](../src/app/api/renovatie-photo-analysis/route.ts), line 572 |
| `STRIPE_SECRET_KEY` | Server secret; presence of checkout code does not establish verified payments or subscriptions | [checkout API](../src/app/api/create-checkout-session/route.ts), line 5 |

Do not treat the different Google credential names as interchangeable or copy a
privileged value into a public variable. Any future alias consolidation needs its
own authorized consumer/configuration migration and restrictions evidence. P0-A
only records the existing references and uncertainty.

No webhook, job-authentication or trusted-origin configuration name is invented as
an existing consumer. A future design may require additional names, but their
selection, configuration and implementation are outside P0-A.

## Preservation and secret boundaries

- PR-038 requires configuration-name compatibility until a coordinated migration
  establishes replacements. Inventory aliases/fallbacks and both client/server
  consumers before proposing changes.
- Browser-public names do not make privileged secrets safe to expose. Keep
  service-role, OpenAI, Stripe and server-side provider credentials server-only.
- Do not read secret-value files or copy values into examples, diagnostics, URLs,
  logs, fixtures, documentation, browser bundles or Git. Validation must be
  designed to report names/presence/errors without revealing values.
- Preserve existing secret/private-key/build exclusions. Evidence:
  [.gitignore](../.gitignore), line 23; do not edit it in P0-A.
- PR-029 protects compatible Supabase target/schema/owner relationships; public
  client configuration does not prove effective database or Storage authorization.
- PR-026 requires reconciliation before touching existing payment references,
  subscription periods, balances, return paths or cancellation intent. A checkout
  client and configured cron are not payment or recovery evidence.
- PR-039 protects the lockfile, required framework dependencies and strict
  verification intent; it does not certify configured CI or provider operations.

## Runtime and package-manager evidence requirements

Repository evidence: [package.json](../package.json), line 5;
[package-lock.json](../package-lock.json), lines 1 and 2151;
[eslint.config.mjs](../eslint.config.mjs), line 5;
[tsconfig.json](../tsconfig.json), line 7.

The accepted scripts cover development, build, start and lint. The lockfile is
resolution evidence, not proof of a supported or reproduced runtime. No passing
build, test, coverage gate, required-check policy or deployed runtime is claimed.

SW-042 requires a later authorized slice to determine the full framework/SDK/lint
dependency engine intersection, declare compatible Node/package-manager versions,
and reproduce a clean locked installation and verification in an isolated
environment. Selected versions are UNKNOWN here. Actual local/CI/Vercel alignment
is NOT VERIFIED. Preserve strict/no-emit TypeScript, required framework packages,
lockfile reproducibility and genuine lint/build intent under PR-039.

SW-041 requires later executable test/CI scaffolding and revision-attributed
critical-flow evidence, extended through domain phases and final acceptance in
P19. P0-A writes no scripts, runtime declarations, tests, fixtures, CI or package
changes and runs no installation, application, build or test.

## Provider and deployment bindings

| Boundary | Current evidence limit | Required later evidence; not authorized by P0-A |
| --- | --- | --- |
| Supabase | Consumed configuration names and accepted CSV snapshots; project ownership, target, effective grants/RLS/Storage and deployed migration history NOT VERIFIED | Explicit target authorization, compatible schema/consumer map, environment separation and actor/access evidence |
| Vercel | [next.config.ts](../next.config.ts), line 3, and [vercel.json](../vercel.json), line 4, are repository configuration; project, deployment, domain, runtime and cron activation NOT VERIFIED | Attributable project/environment/artifact mapping, deployed SHA/runtime, isolation, secure job identity and nonmutating health/readiness |
| Stripe | Checkout/renewal application references; account/mode binding, webhook fulfillment, recurring-method support and existing customer records NOT VERIFIED | Authorized test-mode acceptance and reconciled customer/order/event/entitlement/cancellation history before operational changes |
| Google | Browser/server names and real request paths; project, enabled APIs, restrictions, quotas and accepted results NOT VERIFIED | Approved public/server credential boundaries, privacy/cost controls and attributable allowed/denied/provider-failure acceptance |
| OpenAI | Server key/model-selector references; project, effective model, limits and output acceptance NOT VERIFIED | Approved provider/data scope, bounded request policy and representative output/failure/provenance evidence |

Trusted deployment domains, return-origin allowlists, provider identifiers,
monitoring owners and recovery target values are UNKNOWN unless later supplied
and accepted. Do not infer any of them from repository naming or example code.
Maintenance mutation endpoints, including coordinate repair and renewal, must
never be treated as deployment health checks.

## Traceability and approval boundary

This contract traces to SW-041 (quality-gate requirements), SW-042 (runtime
contract), SW-044 (non-secret environment/deployment contract) and SW-046
(recovery evidence before operations), with PR-026, PR-029, PR-038 and PR-039.
The accepted P0 mapping is G01-G60, with environment/operations focus G50, G59 and
G60; direct previous references are PA-01, PA-07, PA-22; SE-01, SE-03, SE-04,
SE-05, SE-07; DP-02. Per-finding mappings and accepted source locations are in
[launch traceability](launch-contract.md#traceability-and-preservation).

P0-A does not establish environment readiness or close SW-044/SW-046. Future
provider access, configuration changes, deployment, cron activation, credential
rotation, network checks and live tests require separate explicit authorization,
attributable target/isolation evidence and the applicable recovery/privacy/cost
holds. None is performed or authorized by this document. No provider IDs, runtime
versions, domains or secret values are invented to fill evidence gaps.
