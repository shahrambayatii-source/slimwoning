# Schema reconciliation

Status: P0-A initial documentation milestone only. This is an evidence and
prewrite-guardrail record, not a schema migration, security approval, recovery
drill or production-readiness certification. SW-041, SW-042, SW-044 and SW-046
remain open; SW-044 and SW-046 remain OPEN / NOT VERIFIED LIVE.

Use the accepted repository/HEAD and source ledger in
[launch contract](launch-contract.md). Configuration-name and target uncertainty
are recorded in [environment contract](environment-contract.md). No database,
Supabase, RLS, Storage or provider operation is authorized by P0-A.

## Accepted snapshot scope

The following files are accepted user-provided evidence snapshots in the external
`/Users/shahram.by/Downloads/slimwoning-audit-sources` pack. They are not newly
queried Supabase evidence. Accepted readability and contents do not establish
their current deployed target, completeness beyond their stated scope, or live
effective security. NOT VERIFIED LIVE classifications are not upgraded by them.

| Snapshot | Reported scope | Limitation |
| --- | --- | --- |
| `Supabase-RLS-Policies.csv` | 27 policy records | Snapshot policy expressions/RLS reporting, not new proof of effective grants, every role, deployed policy behavior or Storage security |
| `Supabase-Columns-Raw-100-row-limit.csv` | 100 raw column records | UI-limited export; not the complete column inventory |
| `Supabase-Columns-Complete-Grouped.csv` | Nine reported per-table inventories, 154 columns | Complete grouped inventory for those nine reported tables, not proof of every consumed relation or all schemas |
| `Supabase-Constraints-FKs.csv` | 26 records: 14 CHECK, nine PRIMARY KEY, three FOREIGN KEY | Reported constraints only; some referenced targets are null; effective behavior and unreported constraints remain unverified |

The grouped export takes precedence over the raw export for reported column
completeness. Original supplied aliases map respectively to the RLS query,
query-2 (100-row raw export), query-3 (grouped columns) and query-4 (constraints).
No row/contact records, credentials or secret values are copied into this document.

| Reported table | Column count | Grouped CSV line | Identifier/ownership facts reported by the snapshot |
| --- | --- | --- | --- |
| `favorites` | 3 | 2 | `id` bigint; `user_id` text; nullable `property_id` bigint |
| `makelaar_leads` | 13 | 3 | `id` UUID; nullable `property_id` bigint and `seller_user_id` UUID; `claimed_by` text |
| `makelaar_profiles` | 13 | 4 | `id` UUID; no owner `user_id` reported |
| `makelaar_subscriptions` | 10 | 5 | `id` UUID; `makelaar_email` text; no owner `user_id` or provider identifier columns reported |
| `nieuwbouw_projecten` | 20 | 6 | `id` UUID; nullable `user_id` UUID; reported status default is `pending` |
| `nieuwbouw_units` | 14 | 7 | `id` UUID; nullable `project_id` UUID; no own `user_id` reported; reported status default is `beschikbaar` |
| `properties` | 69 | 8 | `id` bigint; nullable `user_id` UUID; `publicatiestatus` reported |
| `questions` | 4 | 9 | `id` UUID; no `user_id` reported |
| `search_alerts` | 8 | 10 | `id` UUID; no `user_id` reported |

These are reported facts, not a mandate to reinterpret existing production data.
Missing snapshot columns are not proof of absence live. A null column default
alone does not establish absence of identity/sequence generation. Proposed future
owner fields, ledgers, outboxes, audit records, grants and constraints are not
asserted to exist.

## Repository versus reported schema

Accepted repository consumers reference ten relations: `properties`, `favorites`,
`market_comparables`, `makelaar_leads`, `makelaar_profiles`,
`makelaar_subscriptions`, `nieuwbouw_projecten`, `nieuwbouw_units`, `questions`
and `search_alerts`. `market_comparables` is not in the nine-table grouped
snapshot; its actual existence, structure and target remain UNKNOWN.

The sole committed migration at the accepted baseline is
[20260524000000_add_property_ai_scores.sql](../supabase/migrations/20260524000000_add_property_ai_scores.sql),
line 1. It adds six numeric score fields and their update timestamp; it does not
establish the complete baseline schema, grants, ownership, RLS or bucket policies.
Application aliases/status/score contracts must be reconciled with the grouped
snapshot and later attributable target evidence before any consumer cutover.

Missing migration/policy evidence in Git does not prove missing live policies.
Conversely, snapshot policies do not prove repository-reproducible security or a
compatible migration history. Previously reported staging results and migration
artifacts must be obtained, attributed and reconciled; they are not certified by
this documentation. The reported `pending` project default must be retained as
snapshot evidence, without inferring that every deployed insert/review path works.

The constraints export explicitly reports
`nieuwbouw_units.project_id -> nieuwbouw_projecten.id` at line 17. The user-ID
FK records at lines 14 and 20 do not report their target table/column. Do not
invent an `auth.users` target, cascade behavior, uniqueness rule or missing live
constraint from those incomplete records.

The RLS snapshot includes permissive expressions as well as owner-scoped and
administrative policies. Neither preserving those expressions nor assuming they
are the complete effective access model is a safety guarantee. Effective grants,
role behavior, functions/views, parent-child authorization and security-definer
boundaries remain NOT VERIFIED. Storage bucket policies, object visibility and
signed/public access contracts are not established by these four snapshots.

## Preserved data and compatibility

- PR-029: preserve legitimate identifiers, records, ownership and associations
  through a verified consumer/migration map. Do not coerce property bigint IDs to
  UUIDs, equate favorites text ownership with UUID ownership without reconciliation,
  or infer actual owners from display metadata/email/latest global records.
- Preserve `properties.user_id`, `nieuwbouw_projecten.user_id`,
  `makelaar_leads.seller_user_id`, property references and unit-parent associations
  according to verified semantics. Ambiguous or nullable legacy mappings require
  an approved disposition; do not invent owners or silently reassign records.
- Unit authorization must account for the owning project; a reported parent FK
  alone is not proof of an effective ownership or public-approval policy.
- Preserve genuine seller/contact/property facts. Lead claiming must never be
  treated as permission to overwrite seller contacts or insert demo identities.
- Preserve media references and record/object associations for the consumed
  `properties` and `nieuwbouw-images` buckets. Inventory owned/shared references
  before any replacement/deletion plan; do not assume public URLs prove intended
  public access or that an apparently orphaned object can be deleted safely.
- PR-026: before touching financial data, reconcile existing customer/payment
  references, periods, balances, entitlements, claim history and cancellation
  intent. Preserve genuine history and obligations, not browser payment authority,
  unpaid rollover, cancellation clearing or invented claimant/contact data.
- PR-038: privileged credentials stay server-only; target/configuration-name
  compatibility is required and no secret values enter fixtures or documentation.
- PR-039: preserve lockfile/toolchain reproducibility and verification strictness;
  Git rollback is not a database, media or entitlement recovery procedure.

Preservation is not a byte-for-byte freeze of unsafe policies or broken logic.
Approved later changes may replace them only with explicit compatibility,
authorization, recovery and before/after reconciliation evidence.

## Prewrite requirements

Every item below is a hold for a separately authorized later operation. No hold is
marked satisfied merely because a document, CSV or local branch exists.

| Area | Evidence and approval required before later operations |
| --- | --- |
| Target and permission | Explicit operation/environment scope, attributable project/database/bucket binding, authorized actor and approval record; unknown targets fail the hold |
| Schema and consumers | Versioned target schema/migration history; each changed relation/field/type/identifier and application consumer mapped; reported staging artifacts reconciled; additive compatibility and deployment order reviewed |
| Ownership and associations | Approved existing-record ownership/parent/foreign-reference reconciliation; ambiguous records identified; no metadata-derived privilege or guessed reassignment |
| RLS/grants/functions/views | Attributable effective access inventory and isolated positive/negative anon/owner/other/agent/admin tests, including parent-child/private-field boundaries; no policy relaxation to make a failing test pass |
| Storage | Approved bucket/path/content/upsert/read contract; owned/shared-reference inventory; partial-failure compensation; compatible gallery/export access and recovery evidence |
| Backfills | Approved source/provenance, dry-run counts, type/null/duplicate handling, stable identifiers, bounded batches, interruption/retry behavior and before/after reconciliation; no destructive speculative conversion |
| Recovery | Approved recovery targets, coverage/retention, checkpoints and isolated restore evidence for database/media/entitlements; compatible application/schema rollback or forward repair; named approval responsibilities |
| Verification harness | SW-041/SW-042 reproducibility and isolation requirements; no production fixture writes; authorization before any database test execution |

Recovery targets, actual backup coverage, responsible approvers, deployed schema,
effective policies and the applicable recovery path remain UNKNOWN or NOT VERIFIED
until attributable evidence is supplied and accepted. Early prewrite recovery
proof is required before the relevant data operation; full SW-046 closure in P18
does not authorize proceeding without that earlier hold.

## Recovery and rollback boundaries

SW-046 requires an authorized isolated restore/incident drill with recorded
recovery targets and reconciliation of identifiers, ownership, references, media,
seller facts, payment/period history, balances and entitlements. SW-044 additionally
requires an attributable compatible deployment/migration order and release/runtime
identity. Neither is established by the accepted Git integrity PASS.

A later rollback plan must distinguish code rollback from database/Storage and
provider state. Preserve replayable events, cancellation and legitimate records;
do not reverse security fixes by restoring permissive grants. A failed isolated
rehearsal must not become permission to restore or clean production. P0-A itself
needs no data rollback because it authorizes no data operation.

## Traceability and explicit prohibition

This document traces to SW-041 (isolated verification requirements), SW-042
(reproducible toolchain requirements), SW-044 (target/schema/deployment evidence)
and SW-046 (prewrite recovery evidence); PR-026, PR-029, PR-038 and PR-039 apply.
The accepted P0 capability union is G01-G60, with data/recovery focus G35-G36,
G38-G40, G42-G44, G47-G51, G59-G60. Direct P0 previous references are PA-01,
PA-07, PA-22; SE-01, SE-03, SE-04, SE-05, SE-07; DP-02. These mappings inherit
the exact per-finding evidence and source rows in
[launch traceability](launch-contract.md#traceability-and-preservation).

Relevant repository evidence also includes [shared client](../src/lib/supabase.ts),
line 3; [owner association](../src/app/dashboard/mijn-projecten/page.tsx), line 95;
[claim mutation](../src/app/makelaar-dashboard/page.tsx), line 274; and
[deployment documentation](../README.md), line 32. These are consumer/risk evidence,
not live security or recovery certification.

Unapproved production writes, migrations, schema/RLS/grant changes, fixture writes,
restores, backfills, object deletions and cleanup are explicitly prohibited.
P0-A also excludes read-only provider/database calls, application changes and all
deployment/provider operations. This initial documentation milestone fixes or
closes no finding and does not certify production readiness.
