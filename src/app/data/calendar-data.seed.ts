import type { ApptType, CalendarAppointment } from './dashboard-data.types';

const RIVERSIDE = 'riverside-office-complex';
const HARBOR = 'harbor-view-condominiums';
const TRANSIT = 'downtown-transit-hub';
const MEDICAL = 'lakeside-medical-center';
const WESTFIELD = 'westfield-shopping-center';
const BRIDGE = 'metro-bridge-rehabilitation';
const SUNSET = 'sunset-ridge-apartments';
const WAREHOUSE = 'industrial-park-warehouse';

interface ExtraSpec {
  month: number;
  day: number;
  title: string;
  startHour: number;
  startMin?: number;
  endHour: number;
  endMin?: number;
  type: ApptType;
  projectSlug?: string;
}

function ymd(year: number, month: number, day: number): Date {
  return new Date(year, month, day);
}

function weekdaysBetween(start: Date, end: Date): Date[] {
  const out: Date[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) out.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function appt(
  id: number,
  title: string,
  date: Date,
  startHour: number,
  startMin: number,
  endHour: number,
  endMin: number,
  type: ApptType,
  projectSlug?: string,
): CalendarAppointment {
  const row: CalendarAppointment = { id, title, date, startHour, startMin, endHour, endMin, type };
  if (projectSlug) row.projectSlug = projectSlug;
  return row;
}

function extrasToMap(extras: ExtraSpec[]): Map<string, ExtraSpec[]> {
  const map = new Map<string, ExtraSpec[]>();
  for (const extra of extras) {
    const key = `${extra.month}-${extra.day}`;
    const list = map.get(key) ?? [];
    list.push(extra);
    map.set(key, list);
  }
  return map;
}

function buildCalendar(
  startId: number,
  huddleTitle: string,
  extras: ExtraSpec[],
  weekly: { dow: number; title: string; startHour: number; startMin: number; endHour: number; endMin: number; type: ApptType }[],
): CalendarAppointment[] {
  const start = ymd(2026, 7, 17);
  const end = ymd(2026, 11, 31);
  const days = weekdaysBetween(start, end);
  const extraMap = extrasToMap(extras);
  const items: CalendarAppointment[] = [];
  let id = startId;

  for (const date of days) {
    if (date.getDay() === 1) {
      items.push(appt(id++, huddleTitle, date, 9, 0, 9, 30, 'meeting'));
    }
    for (const rec of weekly) {
      if (date.getDay() === rec.dow) {
        items.push(appt(id++, rec.title, date, rec.startHour, rec.startMin, rec.endHour, rec.endMin, rec.type));
      }
    }
    const key = `${date.getMonth()}-${date.getDate()}`;
    for (const extra of extraMap.get(key) ?? []) {
      items.push(appt(
        id++,
        extra.title,
        date,
        extra.startHour,
        extra.startMin ?? 0,
        extra.endHour,
        extra.endMin ?? 0,
        extra.type,
        extra.projectSlug,
      ));
    }
  }
  for (const extra of extras) {
    const extraDate = ymd(2026, extra.month, extra.day);
    if (extraDate >= start) continue;
    const dow = extraDate.getDay();
    if (dow === 0 || dow === 6) continue;
    items.push(appt(
      id++,
      extra.title,
      extraDate,
      extra.startHour,
      extra.startMin ?? 0,
      extra.endHour,
      extra.endMin ?? 0,
      extra.type,
      extra.projectSlug,
    ));
  }
  return items;
}

const FRANK_EXTRAS: ExtraSpec[] = [
  { month: 6, day: 15, title: 'Q2 Portfolio Close Review', startHour: 10, endHour: 12, type: 'review' },
  { month: 6, day: 22, title: 'July Cash Position Review', startHour: 10, endHour: 11, type: 'review' },
  { month: 7, day: 18, title: 'Client Call -- Trimble Internal', startHour: 14, endHour: 14, endMin: 30, type: 'call', projectSlug: RIVERSIDE },
  { month: 7, day: 19, title: 'Transit Hub Recovery Review', startHour: 10, endHour: 11, endMin: 30, type: 'review', projectSlug: TRANSIT },
  { month: 7, day: 20, title: 'Portfolio Risk Briefing', startHour: 11, endHour: 12, type: 'review' },
  { month: 7, day: 21, title: 'Harbor View Budget Call -- Apex Corp', startHour: 13, endHour: 14, type: 'call', projectSlug: HARBOR },
  { month: 7, day: 24, title: 'Q3 Cash Position Review', startHour: 10, endHour: 11, type: 'review' },
  { month: 7, day: 26, title: 'Owner Walkthrough -- Riverside', startHour: 14, endHour: 15, endMin: 30, type: 'meeting', projectSlug: RIVERSIDE },
  { month: 7, day: 28, title: 'Lakeside Medical Board Update', startHour: 11, endHour: 12, type: 'call', projectSlug: MEDICAL },
  { month: 8, day: 2, title: 'Labor Day Planning -- Crew Coverage', startHour: 15, endHour: 16, type: 'meeting' },
  { month: 8, day: 4, title: 'Westfield Tenant Mix Briefing', startHour: 10, endHour: 11, type: 'review', projectSlug: WESTFIELD },
  { month: 8, day: 10, title: 'Bridge Closeout Gate Review', startHour: 13, endHour: 14, type: 'review', projectSlug: BRIDGE },
  { month: 8, day: 16, title: 'Sunset Ridge Recovery Call', startHour: 14, endHour: 15, type: 'call', projectSlug: SUNSET },
  { month: 8, day: 22, title: 'Warehouse Steel Package Decision', startHour: 11, endHour: 12, type: 'meeting', projectSlug: WAREHOUSE },
  { month: 8, day: 30, title: 'September Forecast Lock', startHour: 10, endHour: 11, endMin: 30, type: 'deadline' },
  { month: 9, day: 7, title: 'Client Call -- GlobalTech Ltd', startHour: 14, endHour: 15, type: 'call', projectSlug: TRANSIT },
  { month: 9, day: 14, title: 'Insurance Renewal Review', startHour: 10, endHour: 11, type: 'review' },
  { month: 9, day: 21, title: 'Harbor View Owner Walk -- Apex', startHour: 13, endHour: 15, type: 'meeting', projectSlug: HARBOR },
  { month: 9, day: 28, title: 'October Forecast Lock', startHour: 10, endHour: 11, endMin: 30, type: 'deadline' },
  { month: 10, day: 4, title: 'Election-Week Crew Coverage', startHour: 15, endHour: 16, type: 'meeting' },
  { month: 10, day: 12, title: 'Riverside Substantial Completion Gate', startHour: 10, endHour: 12, type: 'review', projectSlug: RIVERSIDE },
  { month: 10, day: 18, title: 'Metro Bridge Traffic Reopening Brief', startHour: 9, startMin: 30, endHour: 11, type: 'meeting', projectSlug: BRIDGE },
  { month: 10, day: 25, title: 'Thanksgiving Coverage Plan', startHour: 14, endHour: 15, type: 'meeting' },
  { month: 11, day: 2, title: 'Year-End Contingency Review', startHour: 10, endHour: 11, endMin: 30, type: 'review' },
  { month: 11, day: 9, title: 'Transit Hub Recovery Checkpoint', startHour: 13, endHour: 14, endMin: 30, type: 'review', projectSlug: TRANSIT },
  { month: 11, day: 16, title: 'Holiday Shutdown Plan', startHour: 10, endHour: 11, type: 'meeting' },
  { month: 11, day: 18, title: 'Client Call -- NexGen Analytics', startHour: 14, endHour: 15, type: 'call', projectSlug: MEDICAL },
  { month: 11, day: 23, title: 'Year-End Financial Close Prep', startHour: 10, endHour: 12, type: 'focus' },
  { month: 11, day: 30, title: '2026 Portfolio Close Review', startHour: 10, endHour: 12, type: 'review' },
];

const BERT_EXTRAS: ExtraSpec[] = [
  { month: 6, day: 16, title: 'All-Job Look-Ahead -- July', startHour: 10, endHour: 12, type: 'meeting' },
  { month: 6, day: 23, title: 'RFI / Submittal Backlog Sweep', startHour: 13, endHour: 15, type: 'focus' },
  { month: 7, day: 17, title: 'Riverside Site Walk -- Finishes', startHour: 10, endHour: 11, endMin: 30, type: 'meeting', projectSlug: RIVERSIDE },
  { month: 7, day: 18, title: 'RFI-014 Response Review', startHour: 13, endHour: 14, type: 'review', projectSlug: HARBOR },
  { month: 7, day: 19, title: 'Transit Hub Canopy Coordination', startHour: 10, endHour: 12, type: 'meeting', projectSlug: TRANSIT },
  { month: 7, day: 20, title: 'Submittal Log Sweep', startHour: 14, endHour: 16, type: 'focus' },
  { month: 7, day: 21, title: 'Harbor View Roof Membrane Hold', startHour: 11, endHour: 12, type: 'review', projectSlug: HARBOR },
  { month: 7, day: 24, title: 'Medical Gas Coordination -- Lakeside', startHour: 10, endHour: 11, endMin: 30, type: 'meeting', projectSlug: MEDICAL },
  { month: 7, day: 25, title: 'Westfield Permit Check-In', startHour: 14, endHour: 15, type: 'call', projectSlug: WESTFIELD },
  { month: 7, day: 26, title: 'Bridge Punch Walk -- Spans 3-4', startHour: 8, startMin: 30, endHour: 10, type: 'meeting', projectSlug: BRIDGE },
  { month: 7, day: 27, title: 'Sunset Ridge Framing Deficiency', startHour: 13, endHour: 14, endMin: 30, type: 'review', projectSlug: SUNSET },
  { month: 7, day: 28, title: 'Warehouse Slab Pour Gate', startHour: 10, endHour: 11, type: 'deadline', projectSlug: WAREHOUSE },
  { month: 8, day: 1, title: 'Labor Day Weekend Site Security', startHour: 15, endHour: 16, type: 'meeting' },
  { month: 8, day: 3, title: 'Elevator Inspection -- Riverside', startHour: 10, endHour: 12, type: 'review', projectSlug: RIVERSIDE },
  { month: 8, day: 8, title: 'PCO-003 Recovery Hours Review', startHour: 11, endHour: 12, type: 'review', projectSlug: TRANSIT },
  { month: 8, day: 11, title: 'ADA Ramp Re-inspection -- Transit Hub', startHour: 9, startMin: 30, endHour: 11, type: 'meeting', projectSlug: TRANSIT },
  { month: 8, day: 15, title: 'Riverside Envelope Completion Gate', startHour: 13, endHour: 14, type: 'deadline', projectSlug: RIVERSIDE },
  { month: 8, day: 17, title: 'Harbor View Waterproofing Hold Point', startHour: 10, endHour: 11, endMin: 30, type: 'review', projectSlug: HARBOR },
  { month: 8, day: 22, title: 'ESFR Submittal Review -- Warehouse', startHour: 14, endHour: 15, type: 'review', projectSlug: WAREHOUSE },
  { month: 8, day: 29, title: 'Monthly Schedule Update All Jobs', startHour: 10, endHour: 12, type: 'focus' },
  { month: 9, day: 6, title: 'Fire Marshal Walk -- Riverside', startHour: 10, endHour: 12, type: 'meeting', projectSlug: RIVERSIDE },
  { month: 9, day: 13, title: 'Medical Center Steel Sequence', startHour: 13, endHour: 14, endMin: 30, type: 'meeting', projectSlug: MEDICAL },
  { month: 9, day: 20, title: 'Sunset Ridge Envelope Kickoff', startHour: 10, endHour: 11, type: 'meeting', projectSlug: SUNSET },
  { month: 9, day: 27, title: 'October Look-Ahead Scheduling', startHour: 14, endHour: 16, type: 'focus' },
  { month: 10, day: 3, title: 'Bridge Load Test Window', startHour: 8, startMin: 30, endHour: 12, type: 'deadline', projectSlug: BRIDGE },
  { month: 10, day: 10, title: 'Riverside Punch List Walk', startHour: 9, startMin: 30, endHour: 12, type: 'meeting', projectSlug: RIVERSIDE },
  { month: 10, day: 17, title: 'Transit Hub Systems Integration', startHour: 10, endHour: 12, type: 'review', projectSlug: TRANSIT },
  { month: 10, day: 24, title: 'Thanksgiving Site Coverage', startHour: 15, endHour: 16, type: 'meeting' },
  { month: 11, day: 1, title: 'Riverside Commissioning Start', startHour: 10, endHour: 11, endMin: 30, type: 'meeting', projectSlug: RIVERSIDE },
  { month: 11, day: 8, title: 'Bridge Traffic Reopening Coord', startHour: 9, startMin: 30, endHour: 11, type: 'meeting', projectSlug: BRIDGE },
  { month: 11, day: 15, title: 'Transit Hub Recovery Checkpoint', startHour: 13, endHour: 15, type: 'review', projectSlug: TRANSIT },
  { month: 11, day: 22, title: 'Holiday Shutdown Walk All Sites', startHour: 10, endHour: 12, type: 'meeting' },
  { month: 11, day: 29, title: 'Year-End Schedule Closeout', startHour: 10, endHour: 12, type: 'focus' },
];

const KELLY_EXTRAS: ExtraSpec[] = [
  { month: 6, day: 15, title: 'July Check Run Close', startHour: 10, endHour: 11, type: 'deadline' },
  { month: 6, day: 31, title: 'July Accrual Cutoff', startHour: 9, endHour: 10, type: 'deadline' },
  { month: 7, day: 18, title: 'Alpine Mechanical -- Pay App Review', startHour: 14, endHour: 15, type: 'meeting', projectSlug: TRANSIT },
  { month: 7, day: 19, title: 'Lien Waiver Follow-up -- Pinnacle Steel', startHour: 10, endHour: 10, endMin: 30, type: 'call' },
  { month: 7, day: 20, title: 'CLM Early-Pay Discount Deadline', startHour: 12, endHour: 12, endMin: 30, type: 'deadline' },
  { month: 7, day: 21, title: 'Vendor W-9 Audit -- Western Crane', startHour: 14, endHour: 14, endMin: 30, type: 'review' },
  { month: 7, day: 25, title: 'Rocky Mountain Elec -- Lien Waiver', startHour: 13, startMin: 30, endHour: 14, type: 'call', projectSlug: RIVERSIDE },
  { month: 7, day: 27, title: 'COI Expiration Sweep', startHour: 15, endHour: 16, type: 'deadline' },
  { month: 7, day: 31, title: 'August Accrual Cutoff', startHour: 9, endHour: 10, type: 'deadline' },
  { month: 8, day: 2, title: 'Labor Day Payment Calendar', startHour: 11, endHour: 12, type: 'review' },
  { month: 8, day: 8, title: 'Front Range Drywall -- Pay App', startHour: 14, endHour: 15, type: 'meeting', projectSlug: SUNSET },
  { month: 8, day: 10, title: 'SCS Early-Pay Discount Deadline', startHour: 12, endHour: 12, endMin: 30, type: 'deadline' },
  { month: 8, day: 15, title: 'Vendor Statement Reconciliation', startHour: 13, endHour: 16, type: 'focus' },
  { month: 8, day: 22, title: 'AP Audit Documentation Prep', startHour: 9, endHour: 12, type: 'focus' },
  { month: 8, day: 30, title: 'September Accrual Cutoff', startHour: 9, endHour: 10, type: 'deadline' },
  { month: 9, day: 6, title: 'Q3 AP Close Checkpoint', startHour: 10, endHour: 12, type: 'review' },
  { month: 9, day: 14, title: 'Retention Release -- BridgeTech', startHour: 11, endHour: 12, type: 'review', projectSlug: BRIDGE },
  { month: 9, day: 21, title: '1099 Vendor Data Cleanup', startHour: 13, endHour: 16, type: 'focus' },
  { month: 9, day: 30, title: 'October Accrual Cutoff', startHour: 9, endHour: 10, type: 'deadline' },
  { month: 10, day: 10, title: 'Year-End 1099 Prep Kickoff', startHour: 10, endHour: 11, endMin: 30, type: 'meeting' },
  { month: 10, day: 17, title: 'Lien Waiver Sweep -- All Jobs', startHour: 13, endHour: 15, type: 'focus' },
  { month: 10, day: 25, title: 'Thanksgiving Check Run Advance', startHour: 10, endHour: 11, type: 'deadline' },
  { month: 11, day: 8, title: 'December Payment Calendar Lock', startHour: 10, endHour: 11, type: 'review' },
  { month: 11, day: 15, title: 'Year-End Accrual Walkthrough', startHour: 9, endHour: 12, type: 'focus' },
  { month: 11, day: 22, title: 'Holiday Check Run', startHour: 10, endHour: 11, type: 'deadline' },
  { month: 11, day: 30, title: '2026 AP Close', startHour: 9, endHour: 17, type: 'deadline' },
];

const DOMINIQUE_EXTRAS: ExtraSpec[] = [
  { month: 6, day: 14, title: 'Firestopping Punch -- Riverside', startHour: 10, endHour: 12, type: 'meeting', projectSlug: RIVERSIDE },
  { month: 6, day: 21, title: 'Transit Hub Canopy Field Check', startHour: 8, startMin: 30, endHour: 11, type: 'meeting', projectSlug: TRANSIT },
  { month: 7, day: 17, title: 'Riverside Finishes Field Check', startHour: 10, endHour: 12, type: 'meeting', projectSlug: RIVERSIDE },
  { month: 7, day: 18, title: 'Daily Report Batch -- All Sites', startHour: 16, endHour: 17, type: 'focus' },
  { month: 7, day: 19, title: 'Transit Hub ADA Ramp Layout', startHour: 10, endHour: 12, type: 'review', projectSlug: TRANSIT },
  { month: 7, day: 20, title: 'RFI-016 Curtain Wall Anchors', startHour: 13, endHour: 14, endMin: 30, type: 'review', projectSlug: RIVERSIDE },
  { month: 7, day: 21, title: 'Harbor View Roof Flood Test', startHour: 8, startMin: 30, endHour: 11, type: 'meeting', projectSlug: HARBOR },
  { month: 7, day: 24, title: 'Lakeside Medical Gas Pressure Test', startHour: 10, endHour: 12, type: 'meeting', projectSlug: MEDICAL },
  { month: 7, day: 25, title: 'Westfield SWPPP Inspection', startHour: 14, endHour: 15, endMin: 30, type: 'review', projectSlug: WESTFIELD },
  { month: 7, day: 26, title: 'Bridge Deck Overlay Survey', startHour: 8, startMin: 30, endHour: 11, type: 'meeting', projectSlug: BRIDGE },
  { month: 7, day: 27, title: 'Sunset Ridge Stairwell Framing', startHour: 13, endHour: 15, type: 'meeting', projectSlug: SUNSET },
  { month: 7, day: 28, title: 'Warehouse Slab Pre-Pour Check', startHour: 7, startMin: 30, endHour: 9, type: 'deadline', projectSlug: WAREHOUSE },
  { month: 8, day: 3, title: 'Elevator Guide Rail Inspection', startHour: 10, endHour: 12, type: 'review', projectSlug: RIVERSIDE },
  { month: 8, day: 9, title: 'Firestopping Corrections -- Stair 2', startHour: 13, endHour: 15, type: 'meeting', projectSlug: RIVERSIDE },
  { month: 8, day: 16, title: 'Harbor View WRB Window Openings', startHour: 10, endHour: 12, type: 'review', projectSlug: HARBOR },
  { month: 8, day: 23, title: 'Transit Hub Tactile Strip Repair', startHour: 9, startMin: 30, endHour: 11, type: 'meeting', projectSlug: TRANSIT },
  { month: 8, day: 30, title: 'September Field Look-Ahead', startHour: 14, endHour: 16, type: 'focus' },
  { month: 9, day: 7, title: 'Fire Marshal Walk -- Riverside', startHour: 10, endHour: 12, type: 'meeting', projectSlug: RIVERSIDE },
  { month: 9, day: 14, title: 'Medical Gas Zone C Rough-In', startHour: 10, endHour: 12, type: 'meeting', projectSlug: MEDICAL },
  { month: 9, day: 21, title: 'Warehouse ESFR Hanger Layout', startHour: 13, endHour: 15, type: 'review', projectSlug: WAREHOUSE },
  { month: 10, day: 4, title: 'Bridge Load Test Support', startHour: 8, endHour: 12, type: 'meeting', projectSlug: BRIDGE },
  { month: 10, day: 12, title: 'Riverside Punch List Field Walk', startHour: 9, startMin: 30, endHour: 12, type: 'meeting', projectSlug: RIVERSIDE },
  { month: 10, day: 18, title: 'Transit Hub Systems Test Support', startHour: 10, endHour: 13, type: 'review', projectSlug: TRANSIT },
  { month: 11, day: 2, title: 'Commissioning Deficiency Log', startHour: 13, endHour: 16, type: 'focus', projectSlug: RIVERSIDE },
  { month: 11, day: 9, title: 'Bridge Reopening Field Check', startHour: 8, startMin: 30, endHour: 11, type: 'meeting', projectSlug: BRIDGE },
  { month: 11, day: 16, title: 'Winterization Walk -- Open Sites', startHour: 10, endHour: 12, type: 'meeting' },
  { month: 11, day: 22, title: 'Holiday Shutdown Field Lock', startHour: 13, endHour: 15, type: 'deadline' },
];

const PAMELA_EXTRAS: ExtraSpec[] = [
  { month: 6, day: 15, title: 'July Bid Calendar Lock', startHour: 14, endHour: 16, type: 'deadline' },
  { month: 6, day: 22, title: 'Takeoff Catch-Up -- Open Pipeline', startHour: 13, endHour: 16, type: 'focus' },
  { month: 7, day: 18, title: 'EST-2026-047 Follow-up -- Sunset Ridge', startHour: 10, endHour: 11, type: 'call', projectSlug: SUNSET },
  { month: 7, day: 19, title: 'Takeoff: Transit Hub Signage Package', startHour: 13, endHour: 16, type: 'focus', projectSlug: TRANSIT },
  { month: 7, day: 20, title: 'EST-2026-044 Deadline -- Medical MEP', startHour: 17, endHour: 17, endMin: 30, type: 'deadline', projectSlug: MEDICAL },
  { month: 7, day: 21, title: 'Pre-Con -- Westfield Facade', startHour: 10, endHour: 11, endMin: 30, type: 'meeting', projectSlug: WESTFIELD },
  { month: 7, day: 24, title: 'Eldorado Canyon Community Center Review', startHour: 9, startMin: 30, endHour: 11, type: 'review' },
  { month: 7, day: 26, title: 'Harbor View Unit Interiors Pricing', startHour: 13, endHour: 16, type: 'focus', projectSlug: HARBOR },
  { month: 7, day: 28, title: 'Warehouse Loading Dock Estimate', startHour: 10, endHour: 12, type: 'review', projectSlug: WAREHOUSE },
  { month: 8, day: 2, title: 'Labor Day Bid Coverage Plan', startHour: 15, endHour: 16, type: 'meeting' },
  { month: 8, day: 8, title: 'Riverside Furniture Procurement Bid', startHour: 10, endHour: 11, endMin: 30, type: 'review', projectSlug: RIVERSIDE },
  { month: 8, day: 15, title: 'Bridge Expansion Joint T&M Review', startHour: 13, endHour: 14, type: 'review', projectSlug: BRIDGE },
  { month: 8, day: 22, title: 'County Courthouse ADA Retrofit', startHour: 10, endHour: 12, type: 'focus' },
  { month: 8, day: 29, title: 'September Bid Calendar Lock', startHour: 14, endHour: 16, type: 'deadline' },
  { month: 9, day: 6, title: 'Solar Canopy -- Fleet Yard Takeoff', startHour: 10, endHour: 12, type: 'focus', projectSlug: WAREHOUSE },
  { month: 9, day: 13, title: 'Pre-Con -- Lakeshore Seawall', startHour: 13, endHour: 14, endMin: 30, type: 'meeting' },
  { month: 9, day: 20, title: 'Q4 Bid Pipeline Review', startHour: 10, endHour: 11, endMin: 30, type: 'review' },
  { month: 9, day: 27, title: 'Transit Hub Post-Occupancy Retainer', startHour: 14, endHour: 15, type: 'call', projectSlug: TRANSIT },
  { month: 10, day: 3, title: 'Parking Structure Repair Estimate', startHour: 10, endHour: 12, type: 'focus' },
  { month: 10, day: 10, title: 'Riverside Phase 3 Scope Alignment', startHour: 13, endHour: 14, endMin: 30, type: 'meeting', projectSlug: RIVERSIDE },
  { month: 10, day: 17, title: 'Thanksgiving Bid Freeze Plan', startHour: 15, endHour: 16, type: 'meeting' },
  { month: 11, day: 1, title: 'December Bid Calendar', startHour: 10, endHour: 11, type: 'review' },
  { month: 11, day: 8, title: 'Year-End Estimate Archive', startHour: 13, endHour: 16, type: 'focus' },
  { month: 11, day: 15, title: '2027 Pursuit List Workshop', startHour: 10, endHour: 12, type: 'meeting' },
  { month: 11, day: 22, title: 'Holiday Bid Coverage', startHour: 14, endHour: 15, type: 'meeting' },
];

export const CALENDAR_APPOINTMENTS_FRANK: CalendarAppointment[] = buildCalendar(
  1,
  'Leadership Huddle',
  FRANK_EXTRAS,
  [
    { dow: 1, title: 'Weekly Portfolio Review', startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
    { dow: 3, title: 'Client Call Block', startHour: 14, startMin: 0, endHour: 15, endMin: 0, type: 'call' },
    { dow: 5, title: 'Weekly Financial Close Check', startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  ],
);

export const CALENDAR_APPOINTMENTS_BERT: CalendarAppointment[] = buildCalendar(
  1000,
  'PM Morning Huddle',
  BERT_EXTRAS,
  [
    { dow: 1, title: 'Look-Ahead Scheduling', startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'meeting' },
    { dow: 3, title: 'Subcontractor Coordination', startHour: 13, startMin: 0, endHour: 14, endMin: 0, type: 'meeting' },
    { dow: 5, title: 'Weekly Progress Review', startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'review' },
  ],
);

export const CALENDAR_APPOINTMENTS_KELLY: CalendarAppointment[] = buildCalendar(
  2000,
  'Invoice Review Queue',
  KELLY_EXTRAS,
  [
    { dow: 1, title: 'Weekly Check Run', startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'deadline' },
    { dow: 3, title: 'AP Team Standup', startHour: 9, startMin: 30, endHour: 10, endMin: 0, type: 'meeting' },
    { dow: 4, title: 'ACH Batch Processing', startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'deadline' },
    { dow: 5, title: 'Week-End AP Reconciliation', startHour: 9, startMin: 0, endHour: 11, endMin: 0, type: 'focus' },
  ],
);

export const CALENDAR_APPOINTMENTS_DOMINIQUE: CalendarAppointment[] = buildCalendar(
  3000,
  'Field Huddle',
  DOMINIQUE_EXTRAS,
  [
    { dow: 1, title: 'Inspection Look-Ahead', startHour: 10, startMin: 0, endHour: 10, endMin: 45, type: 'review' },
    { dow: 2, title: 'RFI Technical Review', startHour: 13, startMin: 0, endHour: 14, endMin: 0, type: 'review' },
    { dow: 4, title: 'Daily Reports Catch-Up', startHour: 16, startMin: 0, endHour: 17, endMin: 0, type: 'focus' },
    { dow: 5, title: 'Safety Coordination', startHour: 13, startMin: 0, endHour: 14, endMin: 0, type: 'meeting' },
  ],
);

export const CALENDAR_APPOINTMENTS_PAMELA: CalendarAppointment[] = buildCalendar(
  4000,
  'Estimating Standup',
  PAMELA_EXTRAS,
  [
    { dow: 1, title: 'Open Estimates Review', startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
    { dow: 2, title: 'Takeoff Focus Block', startHour: 13, startMin: 0, endHour: 16, endMin: 0, type: 'focus' },
    { dow: 4, title: 'Pre-Con / Bid Coordination', startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'meeting' },
    { dow: 5, title: 'Deadline Sweep', startHour: 16, startMin: 0, endHour: 17, endMin: 0, type: 'deadline' },
  ],
);

/** Default / Frank calendar -- existing import name. */
export const CALENDAR_APPOINTMENTS = CALENDAR_APPOINTMENTS_FRANK;

/** Kelly AP calendar -- existing import name. */
export const AP_CALENDAR_APPOINTMENTS_SEED = CALENDAR_APPOINTMENTS_KELLY;

export function calendarForPersona(personaSlug?: string): CalendarAppointment[] {
  switch (personaSlug) {
    case 'bert': return CALENDAR_APPOINTMENTS_BERT;
    case 'kelly': return CALENDAR_APPOINTMENTS_KELLY;
    case 'dominique': return CALENDAR_APPOINTMENTS_DOMINIQUE;
    case 'pamela': return CALENDAR_APPOINTMENTS_PAMELA;
    default: return CALENDAR_APPOINTMENTS_FRANK;
  }
}
