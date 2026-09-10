# Launch contract

Status: P0-A initial documentation milestone, candidate for review. This document
does not certify production readiness, completion of P0, or closure of any audit
finding. In particular, SW-044 and SW-046 remain OPEN / NOT VERIFIED LIVE.

## Canonical identity and baseline

| Item | Accepted baseline |
| --- | --- |
| Repository | `shahrambayatii-source/slimwoning` |
| Local path | `/Users/shahram.by/Desktop/slimwoning` |
| Accepted origin identity | `https://github.com/shahrambayatii-source/slimwoning.git` |
| Branch before P0-A | `main` |
| HEAD before and during P0-A | `6264cf8b03a306aa0cae6600825a74599319fcae` |
| Accepted commit subject | `Add mobile PWA start screen` |
| Baseline tracked files | 89 |
| Authorized local work branch | `chore/slimwoning-p0-contracts` |
| Section 15 closing integrity | PASS, accepted direct blob/mode certification |
| Section 16A | EXECUTION SPEC COMPLETE, specification acceptance only |
| Accepted P0 packet | P0 IMPLEMENTATION PACKET READY, handoff acceptance only |

Before branch/file creation, P0-A requires matching `main`, HEAD and local
`refs/remotes/origin/main`, an empty cached diff, no non-ignored untracked files,
89 matching tracked blobs/modes, and an absent proposed branch. The local remote
reference is not a fresh verification of GitHub; no network check is authorized.

The accepted direct method hashes each file as a Git blob in memory and compares
its filesystem type/executable mode with its index entry. Index entries must also
match HEAD. Historical 89 modified/stat markers were metadata false positives;
they must not override successful content/mode evidence. A timed-out aggregate
fingerprint was not a demonstrated content mismatch. No aggregate retry is part
of P0-A. Integrity acceptance is not application or production acceptance.

## Accepted sources

The external source pack is at
`/Users/shahram.by/Downloads/slimwoning-audit-sources`. These documents reference
it; P0-A does not copy, regenerate or replace accepted audit sources.

| Source | Accepted scope and reference |
| --- | --- |
| `Section-12-Real-vs-Fake.md` | G01-G61, 61 capability groups; classifications and behavior remain accepted |
| `Section-13-Findings-Register.md` | SW-001 through SW-050; P0 finding rows at lines 47, 48, 50 and 52 |
| `Section-14-Previous-Audit-Verification.md` | PA-01 through PA-22, SE-01 through SE-07, DP-01 through DP-12; canonical corrections at lines 55-60 |
| `Section-15-Preservation-Matrix.md` | PR-001 through PR-040; relevant PR rows at lines 38, 41, 50 and 51; data guardrails at lines 59-61; anti-preservation requirements at lines 63-64 |
| Accepted Section 16 | Conversational roadmap; P0 objective, membership and execution order |
| Accepted Section 16A | Conversational execution specification; B finding rows, C/P0 phase row, traceability and deployment gates |
| Accepted P0 implementation packet | Conversational extraction of P0 and its smallest documentation-only PR |
| Four accepted Supabase CSV snapshots | User-provided evidence, not new live verification; see [schema reconciliation](schema-reconciliation.md) |

The later user-accepted Section 15 PASS supersedes historical closing STOP text
inside the source files. It does not upgrade database/provider evidence to live
verification. Preserve the canonical 45 page routes, eight API routes and 16
placeholder routes. Do not equate client layout with universal unindexability,
missing callback code with proven OAuth failure, or rental code reuse with absent
rental filtering. Coordinate repair uses anon context, not service-role context.
Missing committed policies do not prove that policies are absent live.

## Authorized P0-A boundary

P0-A authorizes the local branch and exactly these three new files:

- `docs/launch-contract.md`
- `docs/environment-contract.md`
- `docs/schema-reconciliation.md`

No existing tracked file may change in content or mode. No staging/index refresh,
commit, push, remote pull request, deployment, build, test, application execution,
package installation, migration, cleanup or external/provider access is authorized.
Creating/activating the approved local branch is the only authorized Git-state
change; it must leave HEAD at the accepted commit and the index unchanged.

Full P0 is broader than P0-A: it includes future runtime pinning and executable
test/CI scaffolding with authorized isolated verification. P0-A only documents
those requirements. It does not edit package files, lockfiles, runtime settings,
tests, CI, application code, secrets, databases, RLS or Storage.

## Milestone boundaries

P0's exact objective is **Repository/environment contract and verification
harness**. It has no prerequisite phase. The accepted phase estimate is M,
execution risk LOW, and release-blocking foundation status. Those estimates do
not imply that all included findings can be closed by a documentation PR.

| Finding | Accepted obligation | P0-A documentation milestone | Work that remains outside P0-A |
| --- | --- | --- | --- |
| SW-041: Critical flows lack repository quality gates | HIGH; RELEASE BLOCKER | Record required reproducible gates, isolated fixtures, revision attribution and future coverage | Implement and verify the harness and risk-based suites through later phases; final release regression gate P19 |
| SW-042: Runtime toolchain is not pinned as a contract | MEDIUM; PRE-LAUNCH REQUIRED | Record the requirement to determine a supported Node/package-manager contract from the full dependency engine intersection | Choose, pin and reproduce the compatible toolchain in a separately authorized P0 slice; versions are not selected here |
| SW-044: Deployment/environment contract is unverified | HIGH; RELEASE BLOCKER; OPEN / NOT VERIFIED LIVE | Inventory names, unknown bindings, compatibility and prewrite approval holds | P18 closure requires attributable project/environment mappings, migration/release order, deployed SHA/runtime and safe readiness evidence; direct prerequisites SW-001, SW-041, SW-042, SW-043 |
| SW-046: Recovery capability lacks evidence | HIGH; RELEASE BLOCKER; OPEN / NOT VERIFIED LIVE | Record recovery evidence requirements and a hold before real-data operations | P18 closure requires approved recovery targets, coverage, isolated restore/reconciliation and compatible rollback evidence; direct prerequisites SW-001, SW-044 |

SW-041 and SW-042 have no direct finding prerequisites. The full-closure
dependencies of SW-044/SW-046 do not prevent early documentation. Conversely,
finishing early documentation does not satisfy those dependencies or authorize
waiting until P18 to obtain the recovery evidence required before a data change.

## Traceability and preservation

| Finding | Related capabilities | Preservation entries | Direct previous-claim references |
| --- | --- | --- | --- |
| SW-041 | G01-G60 | PR-039 | PA-01, PA-22; SE-05, SE-07 |
| SW-042 | G59, G60 | PR-039 | None directly accepted |
| SW-044 | G01-G03, G10, G18, G21, G23, G25, G27-G28, G38-G40, G44, G47, G49-G52, G56, G59-G60 | PR-029, PR-038, PR-039 | PA-07; SE-01, SE-03, SE-04, SE-05, SE-07; DP-02 |
| SW-046 | G35-G36, G38-G40, G42-G44, G47-G51, G59 | PR-026, PR-029, PR-039 | None directly accepted |

The union is G01-G60; PR-026, PR-029, PR-038, PR-039; PA-01, PA-07, PA-22;
SE-01, SE-03, SE-04, SE-05, SE-07; DP-02. These are reference mappings, not new
capability implementations or live evidence. Phase-level PR-038/PR-039 are joined
by PR-026/PR-029 because of the included deployment/recovery findings.

- PR-026: verify before touching existing billing records, return paths, period
  history, balances and cancellation intent; do not preserve URL payment authority
  or unpaid renewal as valid behavior.
- PR-029: verify before changing schema/consumer contracts; preserve identifiers,
  legitimate records, ownership and associations through compatible reconciliation.
- PR-038: preserve configuration-name compatibility, server-secret boundaries and
  exclusions of secret/private-key/build artifacts from Git.
- PR-039: preserve lockfile reproducibility, required framework dependencies,
  strict/no-emit TypeScript and genuine lint/build intent. Actual deployment,
  required checks, cron, monitoring and recovery remain NOT VERIFIED.

Preservation does not freeze permissive policies, fabricated records/claims,
false success states, browser payment authority or destructive claiming. Their
remediation belongs to later approved slices, not this documentation change.

## Approval holds

| Proposed later operation | Required hold before access or change |
| --- | --- |
| Database/schema/migration/RLS/backfill | Explicit authorization for target and operations; attributable target binding; approved schema/consumer/ownership map; isolation, dry-run and reconciliation criteria; applicable backup/restore/rollback evidence |
| Storage upload/replacement/deletion/cleanup | Explicit bucket/object scope and owner/reference map; verified access/content contracts; recovery and shared-reference protections; no inferred public-access guarantee |
| Any provider access, including read-only verification | Explicit provider/environment/scope authorization; permitted identities, data/privacy boundaries and cost limits; no credentials copied into documentation |
| Deployment, cron or traffic changes | Approved environment/runtime/artifact identity, compatible migration order, secure admission, nonmutating health, monitoring owner and recovery path |
| Production data, fixtures or restores | Separate explicit authorization; demonstrated isolation where applicable; approved recovery targets and before/after record/media/entitlement reconciliation; no production fixture writes by default |

Required approvers and target identifiers are UNKNOWN until explicitly assigned
and evidenced. The CSV snapshots, this branch and accepted audit verdicts do not
grant any of these permissions. Detailed requirements are in
[environment contract](environment-contract.md) and
[schema reconciliation](schema-reconciliation.md).

## Documentation acceptance and rollback

The candidate is reviewable only when exactly the three authorized documents are
new; the work branch and baseline HEAD match; the 89 baseline tracked blobs/modes
and index remain unchanged; the cached diff is empty; references use accepted
identifiers/evidence; and no secret values, invented bindings or closure claims
appear. Review is documentation validation, not an application test or live check.

P0-A does not certify production readiness. No SW finding is fixed or closed by
these documents, and no later phase is completed by this milestone.

If a later review rejects the documents, a separately authorized rollback must be
limited to these documentation changes. It must not reset unrelated work, alter
existing application/configuration files, weaken gates, touch the index without
permission, or perform database/provider operations. No rollback is executed by
this contract and no commit, push or remote PR is authorized.
