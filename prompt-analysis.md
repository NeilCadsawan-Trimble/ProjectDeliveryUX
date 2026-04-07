# Prompt Effectiveness Analysis

**Date**: April 6, 2026
**Scope**: 118 chat sessions, 1,845 user prompts across the ProjectDeliveryUX codebase

---

## Most Successful Prompt Patterns

### 1. Incremental Feature Layering (highest success rate)

The pattern: **start with a question/idea, get a proposal, then refine step-by-step**. These sessions had the lowest frustration and highest output.

Best example (session `06489ea6` -- Urgent needs reactivity):
- "within a session, would it be possible for the Urgent Needs widget to reflect changes in status..."
- "yes, and I want all the urgent needs widgets on the project dashboards to get this fix as well"
- "Good. Now I want this for all the RFI and Submittals widgets..."
- "push to github, create a pr, push to main"

4 clear prompts, zero frustration, clean push. This pattern worked because each prompt built on confirmed success.

### 2. Specific, Scoped "Plan + Implement" Combos (26% were perfectly clean)

When a well-scoped plan with clear boundaries was given, it worked well. The 11 cleanest sessions all followed this shape:

- **One clear objective** per plan (not "fix everything")
- **Concrete acceptance criteria** ("the navlinks goes under the title. that's it.")
- **Followed by verification + push**

Best examples:
- Session `4fe7276b` -- Project tiles promotion (11 prompts, 5 plans, 1 push, 0 frustration)
- Session `5df38720` -- Fix financials navigation (9 prompts, 2 plans, 2 pushes, 0 frustration)

### 3. Constraint-Based Instructions

The most effective bug-fix prompts stated **what the rule is** rather than describing the symptom:

- "NO JUMPING OVER OTHER WIDGETS. that is all" -- led directly to the push-down-only collision fix
- "the only way a widget can move across other widgets is through a manual operation by the user"
- "match the outer edges of the content area to the outside edges of the navbar. that's it."

These worked because they gave an unambiguous invariant to implement and test against.

### 4. "Do X for All Y" Scaling Prompts

After something worked on one widget/page, scaling it was consistently smooth:

- "yes, and I want all the urgent needs widgets on the project dashboards to get this fix as well"
- "make sure that there are detail pages for all the financials sub pages"
- "Do this for all the financials sub page lists"

---

## Patterns That Led to Frustration

### 1. Anything Touching the Navbar (13 frustration prompts)

The navbar was the single most frustrating topic. It broke 5+ times across sessions. The prompts that worked worst were ones that assumed the fix would be simple:
- "please rebuild the top navbar. it's completely broken" -- too broad
- "the top navbar is broken again" -- no specifics on what broke

### 2. Implicit Layout Expectations (9 frustration prompts)

Session `57efcfde` is the textbook example: 35 prompts, 7 frustrated, because the desired layout was in the user's head but communicated through corrections rather than specifications up front. The turning point was prompt 22: "match the outer edges of the content area to the outside edges of the navbar. that's it." -- that simple invariant should have been the first prompt.

### 3. Regressions / Lost Work (14 frustration prompts -- highest category)

Prompts like "why do i have to keep asking for changes i made earlier to be restored?" signal that work was lost across sessions. This was a systemic issue, not a prompt issue -- it led to the memory system and skills documentation being created.

### 4. Canvas Mode Complexity (9 frustration prompts)

Canvas mode sessions had higher frustration because changes in one area (shell, navbar, layout) had cascading effects. The worst session `899fa497` (45% frustration rate) was a single broken `ng-content` that destroyed all canvas pages.

---

## Quantitative Summary

### Prompt Category Distribution

| Prompt Category | Count | % of Total | Frustration Rate |
|---|---|---|---|
| Feature requests (detailed) | 533 | 29% | Low |
| Direct commands (short) | 358 | 19% | Low |
| Questions/exploration | 237 | 13% | Very low |
| DOM path context | 184 | 10% | N/A (context) |
| Bug reports | 176 | 10% | Medium |
| Plan implementations | 146 | 8% | Mixed (26% clean, 36% frustrated) |
| Push/deploy | 111 | 6% | Low |
| Frustration prompts | 70 | 4% | -- |

### Plan-Implement Session Outcomes

| Outcome | Count | % |
|---|---|---|
| Total plan-implement sessions | 41 | 100% |
| Clean (pushed, no frustration) | 11 | 26% |
| Had frustration | 15 | 36% |
| No push (incomplete) | 15 | 37% |

### Frustration by Topic

| Topic | Frustration Prompts |
|---|---|
| Regressions / lost work | 14 |
| Navbar | 13 |
| Performance / crashes | 12 |
| Canvas mode | 9 |
| Alignment / layout | 9 |
| Hamburger button | 6 |
| Content missing | 3 |

### Session-Level Success Indicators

| Metric | Value |
|---|---|
| Total sessions analyzed | 118 |
| Sessions with prompts | 116 |
| Total user prompts | 1,845 |
| Cleanest sessions (plan + push, 0 frustration) | 11 |
| Most frustrating session | `899fa497` (45% frustration rate) |
| Largest session | `6387a8f3` (3,758 lines, 424 prompts) |
| Most productive sessions (many features, minimal frustration) | `b3ea14f9`, `331f2cb4`, `76bc1c7e` |

---

## Cleanest Sessions (Reference)

These sessions had plan-based execution, successful pushes, and zero frustration:

| Session | Prompts | Plans | Pushes | Topic |
|---|---|---|---|---|
| `c058e440` | 25 | 7 | 1 | Swap title above toolbar in sub-pages |
| `de6e4108` | 29 | 7 | 1 | Project calendar timeline |
| `4fe7276b` | 11 | 5 | 1 | Promote project tiles to independent widgets |
| `76bc1c7e` | 30 | 4 | 2 | Generate contracts + canvas parity |
| `06489ea6` | 14 | 2 | 1 | Urgent needs widget reactivity |
| `20b36c27` | 14 | 2 | 1 | Projects dashboard layout alignment |
| `5df38720` | 9 | 2 | 2 | Fix financials sub-page detail navigation |
| `94f99834` | 12 | 2 | 2 | Fix Vercel navbar rendering |
| `ce284b7f` | 5 | 2 | 1 | Fix Vercel build error |
| `e921d0e8` | 6 | 2 | 1 | Fix sidenav icon centering in mobile |
| `9fdabc76` | 6 | 1 | 1 | Fix Safari mobile Trimble logo |

---

## Key Takeaways

1. **State invariants, not symptoms**: "X must always equal Y" beats "fix X". The constraint becomes both spec and test.
2. **Incremental layering beats big plans**: Question -> confirm -> extend -> push had the highest success rate.
3. **Scaling ("do this everywhere") works great** after a single instance is confirmed working.
4. **Layout/alignment prompts need measurements up front**: Sessions that started with "the content area is 1280px, centered to viewport, matching navbar edges" went much smoother than ones that corrected through iteration.
5. **The plan-implement pattern is mixed**: 26% perfectly clean, but 36% hit frustration -- usually because the plan was too broad or touched fragile areas (navbar, canvas shell).
6. **"Add to skills" and "add regression tests" after fixes** was the most impactful meta-pattern -- it prevented the same class of issues from recurring.
