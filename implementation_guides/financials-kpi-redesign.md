# Financials Dashboard KPI Redesign

**Status**: Planning
**Date**: Mar 29, 2026
**Context**: ~$6M annual revenue GC, ~30 employees, 8 active projects

---

## 1. Current State

The financials KPIs are three hardcoded placeholders:

- **Total Budget**: $3.7M (hardcoded)
- **Total Spent**: $2.1M (hardcoded)
- **Remaining**: $1.6M (hardcoded)

Both desktop and canvas mode templates use inline HTML rather than a reusable component.

**Files**:
- `src/app/pages/financials-page/financials-page.component.ts` (lines 314-345 desktop, 384-411 canvas)

---

## 2. New Data to Add

### 2a. Invoices

```typescript
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'partially-paid' | 'void';

export interface Invoice {
  id: string;
  projectId: number;
  project: string;
  invoiceNumber: string;
  description: string;
  amount: number;
  amountPaid: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  terms: string;            // e.g. 'Net 30', 'Net 45'
  linkedContractId?: string;
  retainageHeld: number;
}
```

Seed ~25-30 invoices across all 8 projects with realistic aging:
- 5-6 paid (recent)
- 8-10 sent (current, not yet due)
- 3-4 overdue (past due date, not paid)
- 2-3 partially paid
- 2-3 draft (not yet sent)

### 2b. Billing Cycles

```typescript
export type BillingFrequency = 'monthly' | 'milestone' | 'progress' | 'upon-completion';

export interface BillingSchedule {
  projectId: number;
  project: string;
  frequency: BillingFrequency;
  nextBillingDate: string;
  lastBilledDate: string;
  lastBilledAmount: number;
  contractValue: number;
  totalBilled: number;
  totalRemaining: number;
}
```

One entry per project (8 total). Mix of billing frequencies typical for a GC:
- Monthly progress billing (most common for larger jobs)
- Milestone-based (for fixed-price contracts)
- Upon completion (for smaller jobs)

### 2c. Cash Management

```typescript
export interface CashFlowEntry {
  month: string;           // e.g. 'Jan 2026'
  inflows: number;         // collections received
  outflows: number;        // payments made (subs, materials, payroll, overhead)
  netCash: number;         // inflows - outflows
  runningBalance: number;  // cumulative
}

export interface CashPosition {
  currentBalance: number;
  thirtyDayForecast: number;
  sixtyDayForecast: number;
  ninetyDayForecast: number;
  monthlyPayroll: number;
  monthlyOverhead: number;
  upcomingPayables: number;   // sub/vendor payments due within 30 days
}
```

Seed 6-12 months of cash flow history plus forward-looking position. For a ~$6M firm:
- Monthly payroll ~$150K (30 employees avg ~$60K/yr)
- Monthly overhead ~$40K
- Cash balance fluctuates $200K-$600K range
- Collection lag creates periodic pressure

---

## 3. KPI Pool (Priority-Scored, Top 3 Shown)

### Tier 1: Cash Flow & Exposure (highest priority when present)

| Priority | KPI | Source | Condition | Subtitle |
|---|---|---|---|---|
| 100 | Overdue Invoices ($) | `INVOICES.filter(overdue)` | Any overdue | "X invoices, oldest Y days" |
| 95 | Cash Runway | `cashPosition.currentBalance / (monthlyPayroll + monthlyOverhead)` | < 3 months | "X.X months at current burn" |
| 90 | Outstanding Receivables ($) | `PROJECT_REVENUE.sum(outstandingRaw)` | > $50K | "across X projects" |
| 85 | Projects Over Budget (>80%) | `PROJECTS.filter(budgetPct > 80)` | Any | worst offender names |
| 80 | Pending Change Orders ($) | `CHANGE_ORDERS.filter(pending)` | Any pending | "across X orders" |

### Tier 2: Revenue Health & Billing

| Priority | KPI | Source | Condition | Subtitle |
|---|---|---|---|---|
| 75 | Revenue Growth (YoY %) | `ANNUAL_TOTALS` | Always (higher if negative) | period label |
| 70 | Days Sales Outstanding (DSO) | Weighted avg collection days from invoices | > 45 days | "target: 30 days" |
| 65 | Upcoming Billings Due | `BILLING_SCHEDULES.filter(next 14 days)` | Any upcoming | "X projects, $Y total" |
| 60 | Retainage Held ($) | `PROJECT_REVENUE.sum(retainageRaw)` or `INVOICES.sum(retainageHeld)` | > $50K | "released on completion" |
| 55 | Estimate Pipeline ($) | `ESTIMATES.filter(not approved).sum(valueRaw)` | Always | "X open estimates" |

### Tier 3: Positive / Steady-State (fill remaining slots)

| Priority | KPI | Source | Condition | Subtitle |
|---|---|---|---|---|
| 30 | Approved COs This Month ($) | `CHANGE_ORDERS.filter(approved, this month)` | Any | "revenue captured" |
| 25 | Collection Rate (%) | `sum(collectedRaw) / sum(invoicedRaw) * 100` | Always | "X% of invoiced" |
| 20 | Total Collected ($) | `PROJECT_REVENUE.sum(collectedRaw)` | Always | collection rate subtitle |
| 15 | Total Budget (computed) | `PROJECTS.sum(budgetTotal)` | Always | "X active projects" |
| 10 | Budget Utilization (%) | weighted avg `budgetPct` | Always | "X of Y projects healthy" |

### Scoring Adjustments

- If revenue growth is **negative**, boost its priority to 95 (Tier 1)
- If DSO > 60 days, boost to 80 (approaching Tier 1)
- If cash runway < 2 months, boost to 100 (top priority)

---

## 4. Day-to-Day Examples

**Cash pressure:**
```
[$72K Overdue Invoices]  [2.1 Month Cash Runway]  [$188K Outstanding]
```

**Budget pressure:**
```
[2 Projects Over Budget]  [$127K Pending COs]  [52 Days DSO]
```

**Healthy month:**
```
[+15% Revenue Growth]  [$1.2M Pipeline]  [94% Collection Rate]
```

**Billing week:**
```
[3 Billings Due This Week]  [$146K Retainage Held]  [$85K COs Approved]
```

---

## 5. Implementation Plan

### Step 1: Add Data Models & Seed Data
- Add `Invoice`, `BillingSchedule`, `CashFlowEntry`, `CashPosition` types to `dashboard-data.types.ts`
- Add seed data to `dashboard-data.seed.ts`
- Export from `dashboard-data.ts`

### Step 2: Shared KPI Card Component
- Rename/move `HomeKpiCardsComponent` to a shared location (e.g. `src/app/shared/kpi-cards.component.ts`)
- Both Home and Financials pages import the same component
- The `KpiCard` interface already supports `subtitle`

### Step 3: Build Financial KPI Computed Signal
- Add computed signals for each data point (overdue invoices, DSO, cash runway, etc.)
- Build priority-scored `finKpiCards` computed signal (same pattern as home page)
- Replace hardcoded inline HTML with `<app-kpi-cards [cards]="finKpiCards()" />`

### Step 4: Navigation Actions
- Overdue invoices -> scroll to invoices widget or navigate to invoice list
- Cash runway -> show cash flow widget
- Over-budget projects -> navigate to job costs widget
- Billing due -> scroll to billing schedule
- Other financial KPIs -> appropriate widget or `/financials` sub-section

### Step 5: Add Financials Widgets (Optional)
- Invoice aging widget (bar chart by aging bucket: current, 30, 60, 90+ days)
- Cash flow chart widget (inflows vs outflows over time)
- Billing schedule widget (upcoming billing dates and amounts)
- These would be new widgets in the `financialsWidgets` array

### Step 6: Wire Agents
- Add invoice/billing/cash agents to `widget-agents/financials-agents.ts`
- Agent insights reference the new data
- AI panel can answer questions about invoices, billing, and cash position

---

## 6. Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| KPI card component | Shared between Home and Financials | DRY, consistent UX |
| Priority scoring | Dynamic, data-driven | Owner sees what matters most today |
| Invoice aging buckets | Current, 1-30, 31-60, 61-90, 90+ | Industry standard for construction |
| DSO calculation | Weighted average from paid invoices | More accurate than simple average |
| Cash runway | Balance / (payroll + overhead) | Conservative -- excludes variable costs |
| Billing terms | Net 30 default, Net 45 for larger contracts | Typical GC terms |

---

## 7. Difference from Home KPIs

| Aspect | Home Dashboard | Financials Dashboard |
|---|---|---|
| Focus | Operational -- what's blocking work? | Financial health -- where's the money? |
| Primary signals | Overdue items, at-risk projects, staffing | Cash flow, receivables, budget burn |
| Dollar emphasis | Secondary (counts first) | Primary (always show dollar amounts) |
| Time horizon | Today/this week | This month / next 90 days |
| Overlap | Pending COs, weather impact | Pending COs, estimate pipeline |
