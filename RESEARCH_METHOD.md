# Research Method — Moreshwar / Lab

## Why this section exists

A serious research homepage should not confuse curiosity with accomplishment. “Interested in distributed systems” is a direction, not an experiment. “This formula proves a production claim” is also misleading without data.

The **Inquiry Engine** makes a narrower promise:

> Here is a falsifiable question, an explicit model, a counterexample to look for, and the next observation that might change the hypothesis.

The technical questions are **proposed educational investigations**, not peer-reviewed papers, published benchmark results, invented credentials, or claimed academic collaborations. They articulate possible research directions consistent with the existing site, writings, and demonstrations.

## Current docket

| ID | Question | Present status | What evidence would strengthen the investigation |
|---|---|---|---|
| 01 | How does request fan-out amplify tail risk? | A live, deterministic **analytical probability calculator** | Simulate independent Bernoulli slowdowns and compare observed frequency; then model correlated delays |
| 02 | What does a read promise after failover? | Open protocol, **no new results claimed** | Define invariants, replay operation histories during delay and failover, compare a model against traces |
| 03 | Does one accuracy number represent real model quality? | Open protocol, **no trained model claimed** | Reproducible public dataset, baseline, split, per-class error and shift analysis |
| 04 | Can sanitized rich text preserve user intent? | Open protocol, **no benchmark results claimed** | Reproducible HTML fixtures, safety + fidelity invariants, cross-browser and keyboard checks |

### 01 — Fan-out and a slow downstream

A deliberately simplified example assumes:

1. A page needs to wait for **all** of its \(n\) independent downstream calls.
2. Each call has an identical probability \(p\) of being **slow** under a stated fixed threshold.
3. Each request is independent of the others. There is no shared bottleneck, hedging, cache hit, short-circuiting or timeout masking.

The exact probability of **at least one slow downstream** is:

\[
P(\text{at least one slow}) = 1 - (1-p)^n
\]

For 8 independent requests with a 5% slow rate each:

\[
1 - (1-0.05)^8 \approx 0.3366 \approx 33.7\%
\]

This is **not** the application's p99 latency, nor a proof about a live production service. A 33.7% chance of at least one slow dependency does **not** imply 33.7% of complete requests exceed a measured latency threshold. Actual response-time behavior depends on the aggregation strategy, correlations, scheduling, cancellation, queueing and many other mechanisms.

**Possible falsifiers / limits:** dependence among calls, a cache that absorbs slow responses, fan-out where only the fastest result matters, or changing the slow-response threshold.

**Next useful experiment:** implement a seeded simulation with one million or fewer trials, compare simulated frequencies against the closed-form formula, then introduce shared correlated slow events. Report the simulation seed, code, threshold, method, uncertainty and error bars. *No such experiment is claimed to have been run for this exhibit.*

**Background:** Dean & Barroso, *The Tail at Scale*: https://research.google/pubs/the-tail-at-scale/ . The paper is a reference, **not** a source of measured results from this site.

### 02 — Reads after failover

**Proposed experiment:** define a history of writes and reads, introduce a delayed replica and a failover, and test *whether each observed read satisfies an explicitly named consistency guarantee*. Keep “service answered” separate from “answer was up to date.” Compare with Lamport's logical ordering ideas.

Related **existing published commentary**, not experimental results:
[Moreshwar's Leslie Lamport essay](articles/165015687-leslie-lamport-genius-behind-computers-working-together-fe1d2415aee8.html).

### 03 — Machine-learning evaluation

**Proposed experiment:** start from a transparent, simple baseline, predefine train/test split and metrics, and compare overall accuracy with per-class failure rates, calibration and deliberately changed inputs.

Reference: [scikit-learn model evaluation](https://scikit-learn.org/stable/modules/model_evaluation.html). No trained models or claimed improvements are attached to the current docket.

### 04 — Editor and rendering fidelity

**Proposed experiment:** define which user-intended formatting and accessibility semantics must be preserved, and which unsafe constructs must be removed. Test against cross-browser fixtures, the sanitized DOM and keyboard expectations. Beware of conflating “secure to render” with “faithful to edit.”

## What counts as evidence of genuine work

For each future investigation, maintain:

- **Question:** narrow enough to answer with evidence, without exaggerated framing.
- **Assumptions:** explicit variables and failure conditions.
- **Prediction:** a statement that could be wrong.
- **Method:** runnable instructions, code revision, dependencies and a controlled baseline.
- **Result:** raw observations, not just screenshots or synthetic numbers.
- **Limitations:** what the method cannot establish.
- **Revisions:** how feedback changed the original prediction.

Only call a result an **experiment** once an actual reproducible experiment has been run. Clearly mark educational illustrations and simulations.

## Continuous improvement protocol

Every 3 hours, a recurring ChatGPT review has been requested. **A scheduled review is not a guarantee that a meaningful new feature will be invented at each run.** The assistant should:

1. Look at the main branch, recent commits and successful deployment status, then inspect one real problem or opportunity.
2. Prefer corrections, measured reliability improvements, credible learning artifacts, accessible UI and documented experimental designs to more ornamental sections.
3. Never fabricate academic milestones, publications, citations, endorsements, screenshots, performance data or outcomes.
4. Keep public pages read-only and protect publishing with the owner's GitHub permissions.
5. Make one focused, reversible change **only when** tests and authorization are available; otherwise report a precise blocker.
6. Run existing regression tests and relevant new tests, inspect the live deployment status, and report the commit and what remains unverified.

The aim is to grow an honest and useful research laboratory, not maximize the number of commits.
