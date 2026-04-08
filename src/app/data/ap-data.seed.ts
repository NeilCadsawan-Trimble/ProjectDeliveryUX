import type {
  ApInvoice,
  ApVendor,
  ApPayApplication,
  ApLienWaiver,
  ApRetentionRecord,
  ApActivityItem,
  ApPaymentScheduleItem,
  CalendarAppointment,
} from './dashboard-data.types';

// ---------------------------------------------------------------------------
// Vendors
// ---------------------------------------------------------------------------
export const AP_VENDORS_SEED: ApVendor[] = [
  { id: 'v1', name: 'Rocky Mountain Electrical', vendorType: 'subcontractor', totalOwed: 187_500, current: 62_500, aging30: 75_000, aging60: 50_000, aging90: 0, aging90plus: 0, lastPaymentDate: 'Mar 21, 2026', lastPaymentAmount: 42_000 },
  { id: 'v2', name: 'Summit Concrete Supply', vendorType: 'supplier', totalOwed: 134_200, current: 89_200, aging30: 45_000, aging60: 0, aging90: 0, aging90plus: 0, lastPaymentDate: 'Mar 28, 2026', lastPaymentAmount: 31_500 },
  { id: 'v3', name: 'Alpine Mechanical Inc.', vendorType: 'subcontractor', totalOwed: 246_800, current: 0, aging30: 112_300, aging60: 94_500, aging90: 40_000, aging90plus: 0, lastPaymentDate: 'Feb 15, 2026', lastPaymentAmount: 55_000 },
  { id: 'v4', name: 'Pinnacle Steel Fabricators', vendorType: 'supplier', totalOwed: 92_750, current: 48_750, aging30: 44_000, aging60: 0, aging90: 0, aging90plus: 0, lastPaymentDate: 'Mar 25, 2026', lastPaymentAmount: 22_000 },
  { id: 'v5', name: 'High Country Consulting', vendorType: 'consultant', totalOwed: 38_400, current: 18_400, aging30: 20_000, aging60: 0, aging90: 0, aging90plus: 0, lastPaymentDate: 'Mar 30, 2026', lastPaymentAmount: 12_000 },
  { id: 'v6', name: 'Western Crane Services', vendorType: 'equipment-rental', totalOwed: 67_200, current: 22_400, aging30: 22_400, aging60: 22_400, aging90: 0, aging90plus: 0, lastPaymentDate: 'Mar 1, 2026', lastPaymentAmount: 22_400 },
  { id: 'v7', name: 'Front Range Drywall', vendorType: 'subcontractor', totalOwed: 156_300, current: 72_000, aging30: 48_300, aging60: 36_000, aging90: 0, aging90plus: 0, lastPaymentDate: 'Mar 18, 2026', lastPaymentAmount: 36_000 },
  { id: 'v8', name: 'Colorado Lumber & Materials', vendorType: 'supplier', totalOwed: 43_600, current: 43_600, aging30: 0, aging60: 0, aging90: 0, aging90plus: 0, lastPaymentDate: 'Apr 1, 2026', lastPaymentAmount: 18_200 },
];

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------
export const AP_INVOICES_SEED: ApInvoice[] = [
  // Pending review
  { id: 'api-1', invoiceNumber: 'RME-2026-0412', vendor: 'Rocky Mountain Electrical', project: 'Riverside Office Complex', projectId: 1, amount: 62_500, dueDate: 'Apr 15, 2026', receivedDate: 'Apr 2, 2026', status: 'pending', costCode: '16-100', poNumber: 'PO-1042', daysOutstanding: 5 },
  { id: 'api-2', invoiceNumber: 'SCS-8834', vendor: 'Summit Concrete Supply', project: 'Harbor View Condominiums', projectId: 2, amount: 44_200, dueDate: 'Apr 18, 2026', receivedDate: 'Apr 3, 2026', status: 'pending', costCode: '03-300', poNumber: 'PO-1098', daysOutstanding: 4 },
  { id: 'api-3', invoiceNumber: 'AMI-2026-087', vendor: 'Alpine Mechanical Inc.', project: 'Downtown Transit Hub', projectId: 3, amount: 112_300, dueDate: 'Apr 10, 2026', receivedDate: 'Mar 20, 2026', status: 'pending', costCode: '15-500', poNumber: 'PO-0987', daysOutstanding: 18 },
  { id: 'api-4', invoiceNumber: 'PSF-4421', vendor: 'Pinnacle Steel Fabricators', project: 'Industrial Park Warehouse', projectId: 8, amount: 48_750, dueDate: 'Apr 20, 2026', receivedDate: 'Apr 5, 2026', status: 'pending', costCode: '05-120', poNumber: 'PO-1105', daysOutstanding: 2 },
  { id: 'api-5', invoiceNumber: 'FRD-2026-0331', vendor: 'Front Range Drywall', project: 'Riverside Office Complex', projectId: 1, amount: 72_000, dueDate: 'Apr 12, 2026', receivedDate: 'Mar 27, 2026', status: 'pending', costCode: '09-250', poNumber: 'PO-1055', daysOutstanding: 11 },
  { id: 'api-6', invoiceNumber: 'WCS-APR-001', vendor: 'Western Crane Services', project: 'Harbor View Condominiums', projectId: 2, amount: 22_400, dueDate: 'Apr 14, 2026', receivedDate: 'Apr 1, 2026', status: 'pending', costCode: '01-540', poNumber: 'PO-1067', daysOutstanding: 6 },
  // Approved / ready to pay
  { id: 'api-7', invoiceNumber: 'CLM-9921', vendor: 'Colorado Lumber & Materials', project: 'Sunset Ridge Apartments', projectId: 7, amount: 43_600, dueDate: 'Apr 9, 2026', receivedDate: 'Mar 18, 2026', status: 'approved', costCode: '06-100', poNumber: 'PO-1072', daysOutstanding: 20 },
  { id: 'api-8', invoiceNumber: 'HCC-2026-Q1', vendor: 'High Country Consulting', project: 'Lakeside Medical Center', projectId: 4, amount: 18_400, dueDate: 'Apr 11, 2026', receivedDate: 'Mar 22, 2026', status: 'approved', costCode: '01-310', poNumber: 'PO-1083', daysOutstanding: 16 },
  // On hold
  { id: 'api-9', invoiceNumber: 'AMI-2026-072', vendor: 'Alpine Mechanical Inc.', project: 'Lakeside Medical Center', projectId: 4, amount: 94_500, dueDate: 'Mar 25, 2026', receivedDate: 'Feb 28, 2026', status: 'on-hold', costCode: '15-500', poNumber: 'PO-0965', daysOutstanding: 38 },
  { id: 'api-10', invoiceNumber: 'RME-2026-0389', vendor: 'Rocky Mountain Electrical', project: 'Downtown Transit Hub', projectId: 3, amount: 75_000, dueDate: 'Mar 30, 2026', receivedDate: 'Mar 5, 2026', status: 'on-hold', costCode: '16-100', poNumber: 'PO-0992', daysOutstanding: 33 },
  // Recently paid
  { id: 'api-11', invoiceNumber: 'SCS-8790', vendor: 'Summit Concrete Supply', project: 'Metro Bridge Rehabilitation', projectId: 6, amount: 31_500, dueDate: 'Mar 28, 2026', receivedDate: 'Mar 1, 2026', status: 'paid', costCode: '03-300', poNumber: 'PO-1030', daysOutstanding: 0 },
  { id: 'api-12', invoiceNumber: 'FRD-2026-0298', vendor: 'Front Range Drywall', project: 'Sunset Ridge Apartments', projectId: 7, amount: 36_000, dueDate: 'Mar 18, 2026', receivedDate: 'Feb 20, 2026', status: 'paid', costCode: '09-250', poNumber: 'PO-1038', daysOutstanding: 0 },
  { id: 'api-13', invoiceNumber: 'PSF-4398', vendor: 'Pinnacle Steel Fabricators', project: 'Metro Bridge Rehabilitation', projectId: 6, amount: 22_000, dueDate: 'Mar 25, 2026', receivedDate: 'Mar 2, 2026', status: 'paid', costCode: '05-120', poNumber: 'PO-1015', daysOutstanding: 0 },
  { id: 'api-14', invoiceNumber: 'CLM-9887', vendor: 'Colorado Lumber & Materials', project: 'Industrial Park Warehouse', projectId: 8, amount: 18_200, dueDate: 'Apr 1, 2026', receivedDate: 'Mar 12, 2026', status: 'paid', costCode: '06-100', poNumber: 'PO-1060', daysOutstanding: 0 },
];

// ---------------------------------------------------------------------------
// Payment Schedule
// ---------------------------------------------------------------------------
export const AP_PAYMENT_SCHEDULE_SEED: ApPaymentScheduleItem[] = [
  { id: 'ps-1', vendor: 'Colorado Lumber & Materials', invoiceNumber: 'CLM-9921', amount: 43_600, dueDate: 'Apr 9, 2026', project: 'Sunset Ridge Apartments', discountAvailable: 872, discountDeadline: 'Apr 8, 2026' },
  { id: 'ps-2', vendor: 'Alpine Mechanical Inc.', invoiceNumber: 'AMI-2026-087', amount: 112_300, dueDate: 'Apr 10, 2026', project: 'Downtown Transit Hub', discountAvailable: 0, discountDeadline: '' },
  { id: 'ps-3', vendor: 'High Country Consulting', invoiceNumber: 'HCC-2026-Q1', amount: 18_400, dueDate: 'Apr 11, 2026', project: 'Lakeside Medical Center', discountAvailable: 0, discountDeadline: '' },
  { id: 'ps-4', vendor: 'Front Range Drywall', invoiceNumber: 'FRD-2026-0331', amount: 72_000, dueDate: 'Apr 12, 2026', project: 'Riverside Office Complex', discountAvailable: 1_440, discountDeadline: 'Apr 10, 2026' },
  { id: 'ps-5', vendor: 'Western Crane Services', invoiceNumber: 'WCS-APR-001', amount: 22_400, dueDate: 'Apr 14, 2026', project: 'Harbor View Condominiums', discountAvailable: 0, discountDeadline: '' },
  { id: 'ps-6', vendor: 'Rocky Mountain Electrical', invoiceNumber: 'RME-2026-0412', amount: 62_500, dueDate: 'Apr 15, 2026', project: 'Riverside Office Complex', discountAvailable: 1_250, discountDeadline: 'Apr 12, 2026' },
  { id: 'ps-7', vendor: 'Summit Concrete Supply', invoiceNumber: 'SCS-8834', amount: 44_200, dueDate: 'Apr 18, 2026', project: 'Harbor View Condominiums', discountAvailable: 884, discountDeadline: 'Apr 14, 2026' },
  { id: 'ps-8', vendor: 'Pinnacle Steel Fabricators', invoiceNumber: 'PSF-4421', amount: 48_750, dueDate: 'Apr 20, 2026', project: 'Industrial Park Warehouse', discountAvailable: 0, discountDeadline: '' },
];

// ---------------------------------------------------------------------------
// Pay Applications
// ---------------------------------------------------------------------------
export const AP_PAY_APPLICATIONS_SEED: ApPayApplication[] = [
  { id: 'pa-1', vendor: 'Rocky Mountain Electrical', project: 'Riverside Office Complex', projectId: 1, periodEnd: 'Mar 31, 2026', contractValue: 480_000, previousBilled: 245_000, thisPeriod: 62_500, retentionRate: 10, retentionHeld: 30_750, netDue: 56_250, status: 'pending' },
  { id: 'pa-2', vendor: 'Alpine Mechanical Inc.', project: 'Downtown Transit Hub', projectId: 3, periodEnd: 'Mar 31, 2026', contractValue: 920_000, previousBilled: 612_000, thisPeriod: 112_300, retentionRate: 10, retentionHeld: 72_430, netDue: 101_070, status: 'pending' },
  { id: 'pa-3', vendor: 'Front Range Drywall', project: 'Sunset Ridge Apartments', projectId: 7, periodEnd: 'Mar 31, 2026', contractValue: 340_000, previousBilled: 168_000, thisPeriod: 72_000, retentionRate: 5, retentionHeld: 12_000, netDue: 68_400, status: 'pending' },
  { id: 'pa-4', vendor: 'Pinnacle Steel Fabricators', project: 'Metro Bridge Rehabilitation', projectId: 6, periodEnd: 'Mar 31, 2026', contractValue: 210_000, previousBilled: 155_000, thisPeriod: 44_000, retentionRate: 10, retentionHeld: 19_900, netDue: 39_600, status: 'approved' },
  { id: 'pa-5', vendor: 'Western Crane Services', project: 'Harbor View Condominiums', projectId: 2, periodEnd: 'Mar 31, 2026', contractValue: 156_000, previousBilled: 89_600, thisPeriod: 22_400, retentionRate: 0, retentionHeld: 0, netDue: 22_400, status: 'approved' },
  { id: 'pa-6', vendor: 'Summit Concrete Supply', project: 'Industrial Park Warehouse', projectId: 8, periodEnd: 'Feb 28, 2026', contractValue: 275_000, previousBilled: 142_000, thisPeriod: 45_000, retentionRate: 5, retentionHeld: 9_350, netDue: 42_750, status: 'paid' },
];

// ---------------------------------------------------------------------------
// Lien Waivers
// ---------------------------------------------------------------------------
export const AP_LIEN_WAIVERS_SEED: ApLienWaiver[] = [
  // Missing -- blocking payment
  { id: 'lw-1', vendor: 'Alpine Mechanical Inc.', project: 'Downtown Transit Hub', projectId: 3, waiverType: 'conditional', periodEnd: 'Mar 31, 2026', amount: 112_300, status: 'missing', dueDate: 'Apr 10, 2026' },
  { id: 'lw-2', vendor: 'Rocky Mountain Electrical', project: 'Riverside Office Complex', projectId: 1, waiverType: 'conditional', periodEnd: 'Mar 31, 2026', amount: 62_500, status: 'missing', dueDate: 'Apr 12, 2026' },
  // Pending (requested, not yet returned)
  { id: 'lw-3', vendor: 'Front Range Drywall', project: 'Sunset Ridge Apartments', projectId: 7, waiverType: 'conditional', periodEnd: 'Mar 31, 2026', amount: 72_000, status: 'pending', dueDate: 'Apr 12, 2026' },
  { id: 'lw-4', vendor: 'Western Crane Services', project: 'Harbor View Condominiums', projectId: 2, waiverType: 'conditional', periodEnd: 'Mar 31, 2026', amount: 22_400, status: 'pending', dueDate: 'Apr 14, 2026' },
  { id: 'lw-5', vendor: 'Pinnacle Steel Fabricators', project: 'Metro Bridge Rehabilitation', projectId: 6, waiverType: 'unconditional', periodEnd: 'Feb 28, 2026', amount: 44_000, status: 'pending', dueDate: 'Apr 8, 2026' },
  // Received
  { id: 'lw-6', vendor: 'Summit Concrete Supply', project: 'Industrial Park Warehouse', projectId: 8, waiverType: 'unconditional', periodEnd: 'Feb 28, 2026', amount: 45_000, status: 'received', dueDate: 'Mar 30, 2026' },
  { id: 'lw-7', vendor: 'Colorado Lumber & Materials', project: 'Sunset Ridge Apartments', projectId: 7, waiverType: 'unconditional', periodEnd: 'Feb 28, 2026', amount: 18_200, status: 'received', dueDate: 'Mar 28, 2026' },
  { id: 'lw-8', vendor: 'High Country Consulting', project: 'Lakeside Medical Center', projectId: 4, waiverType: 'conditional', periodEnd: 'Mar 31, 2026', amount: 18_400, status: 'received', dueDate: 'Apr 8, 2026' },
];

// ---------------------------------------------------------------------------
// Retention
// ---------------------------------------------------------------------------
export const AP_RETENTION_SEED: ApRetentionRecord[] = [
  { id: 'ret-1', project: 'Riverside Office Complex', projectId: 1, vendor: 'Rocky Mountain Electrical', contractValue: 480_000, retentionRate: 10, retentionHeld: 30_750, retentionReleased: 0, pendingRelease: 0 },
  { id: 'ret-2', project: 'Riverside Office Complex', projectId: 1, vendor: 'Front Range Drywall', contractValue: 340_000, retentionRate: 5, retentionHeld: 12_000, retentionReleased: 0, pendingRelease: 0 },
  { id: 'ret-3', project: 'Downtown Transit Hub', projectId: 3, vendor: 'Alpine Mechanical Inc.', contractValue: 920_000, retentionRate: 10, retentionHeld: 72_430, retentionReleased: 0, pendingRelease: 0 },
  { id: 'ret-4', project: 'Harbor View Condominiums', projectId: 2, vendor: 'Summit Concrete Supply', contractValue: 275_000, retentionRate: 5, retentionHeld: 9_350, retentionReleased: 4_200, pendingRelease: 0 },
  { id: 'ret-5', project: 'Metro Bridge Rehabilitation', projectId: 6, vendor: 'Pinnacle Steel Fabricators', contractValue: 210_000, retentionRate: 10, retentionHeld: 19_900, retentionReleased: 0, pendingRelease: 15_500 },
  { id: 'ret-6', project: 'Sunset Ridge Apartments', projectId: 7, vendor: 'Front Range Drywall', contractValue: 280_000, retentionRate: 5, retentionHeld: 12_000, retentionReleased: 0, pendingRelease: 0 },
  { id: 'ret-7', project: 'Industrial Park Warehouse', projectId: 8, vendor: 'Pinnacle Steel Fabricators', contractValue: 185_000, retentionRate: 10, retentionHeld: 14_500, retentionReleased: 0, pendingRelease: 0 },
  { id: 'ret-8', project: 'Lakeside Medical Center', projectId: 4, vendor: 'Alpine Mechanical Inc.', contractValue: 560_000, retentionRate: 10, retentionHeld: 42_000, retentionReleased: 0, pendingRelease: 0 },
];

// ---------------------------------------------------------------------------
// AP Activity Feed
// ---------------------------------------------------------------------------
export const AP_ACTIVITIES_SEED: ApActivityItem[] = [
  { id: 'aa-1', activityType: 'receipt', description: 'Invoice CLM-9921 received from Colorado Lumber & Materials', vendor: 'Colorado Lumber & Materials', amount: 43_600, timestamp: '2 hours ago', project: 'Sunset Ridge Apartments' },
  { id: 'aa-2', activityType: 'approval', description: 'Invoice HCC-2026-Q1 approved for payment', vendor: 'High Country Consulting', amount: 18_400, timestamp: '3 hours ago', project: 'Lakeside Medical Center' },
  { id: 'aa-3', activityType: 'payment', description: 'Check #10842 issued to Summit Concrete Supply', vendor: 'Summit Concrete Supply', amount: 31_500, timestamp: '5 hours ago', project: 'Metro Bridge Rehabilitation' },
  { id: 'aa-4', activityType: 'hold', description: 'Invoice AMI-2026-072 placed on hold -- PO mismatch', vendor: 'Alpine Mechanical Inc.', amount: 94_500, timestamp: '6 hours ago', project: 'Lakeside Medical Center' },
  { id: 'aa-5', activityType: 'payment', description: 'ACH payment sent to Front Range Drywall', vendor: 'Front Range Drywall', amount: 36_000, timestamp: 'Yesterday', project: 'Sunset Ridge Apartments' },
  { id: 'aa-6', activityType: 'discount-captured', description: '2% early-pay discount captured on CLM-9887', vendor: 'Colorado Lumber & Materials', amount: 364, timestamp: 'Yesterday', project: 'Industrial Park Warehouse' },
  { id: 'aa-7', activityType: 'vendor-update', description: 'Western Crane Services updated banking details', vendor: 'Western Crane Services', amount: 0, timestamp: 'Yesterday', project: '' },
  { id: 'aa-8', activityType: 'payment', description: 'Check #10841 issued to Pinnacle Steel Fabricators', vendor: 'Pinnacle Steel Fabricators', amount: 22_000, timestamp: '2 days ago', project: 'Metro Bridge Rehabilitation' },
  { id: 'aa-9', activityType: 'approval', description: 'Pay App #PA-6 approved for Summit Concrete Supply', vendor: 'Summit Concrete Supply', amount: 42_750, timestamp: '2 days ago', project: 'Industrial Park Warehouse' },
  { id: 'aa-10', activityType: 'receipt', description: 'Lien waiver received from High Country Consulting', vendor: 'High Country Consulting', amount: 18_400, timestamp: '3 days ago', project: 'Lakeside Medical Center' },
];

// ---------------------------------------------------------------------------
// Kelly's Calendar Appointments (AP-themed)
// ---------------------------------------------------------------------------
export const AP_CALENDAR_APPOINTMENTS_SEED: CalendarAppointment[] = [
  // ─── April 2026 ───
  // Week of Apr 6
  { id: 500, title: 'Invoice Review Queue', date: new Date(2026, 3, 6), startHour: 8, startMin: 30, endHour: 9, endMin: 30, type: 'focus' },
  { id: 501, title: 'Weekly Check Run', date: new Date(2026, 3, 6), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'deadline' },
  { id: 502, title: 'Alpine Mechanical -- Pay App Review', date: new Date(2026, 3, 6), startHour: 14, startMin: 0, endHour: 15, endMin: 0, type: 'meeting', projectSlug: 'downtown-transit-hub' },
  { id: 503, title: 'Invoice Review Queue', date: new Date(2026, 3, 7), startHour: 8, startMin: 30, endHour: 9, endMin: 30, type: 'focus' },
  { id: 504, title: 'Pinnacle Steel -- Lien Waiver Follow-up', date: new Date(2026, 3, 7), startHour: 10, startMin: 0, endHour: 10, endMin: 30, type: 'call' },
  { id: 505, title: 'Summit Concrete -- Invoice Dispute Call', date: new Date(2026, 3, 7), startHour: 13, startMin: 0, endHour: 13, endMin: 30, type: 'call' },
  { id: 506, title: 'COI Expiration Check', date: new Date(2026, 3, 7), startHour: 15, startMin: 0, endHour: 15, endMin: 30, type: 'deadline' },
  { id: 507, title: 'Invoice Review Queue', date: new Date(2026, 3, 8), startHour: 8, startMin: 30, endHour: 9, endMin: 30, type: 'focus' },
  { id: 508, title: 'CLM-9921 Early-Pay Discount Deadline', date: new Date(2026, 3, 8), startHour: 12, startMin: 0, endHour: 12, endMin: 30, type: 'deadline' },
  { id: 509, title: 'Vendor W-9 Audit -- Western Crane', date: new Date(2026, 3, 8), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'review' },
  { id: 510, title: 'Invoice Review Queue', date: new Date(2026, 3, 9), startHour: 8, startMin: 30, endHour: 9, endMin: 30, type: 'focus' },
  { id: 511, title: 'ACH Batch Processing', date: new Date(2026, 3, 9), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'deadline' },
  { id: 512, title: 'Rocky Mountain Elec -- Lien Waiver Follow-up', date: new Date(2026, 3, 9), startHour: 13, startMin: 30, endHour: 14, endMin: 0, type: 'call', projectSlug: 'riverside-office-complex' },
  { id: 513, title: 'Week-End AP Reconciliation', date: new Date(2026, 3, 10), startHour: 9, startMin: 0, endHour: 11, endMin: 0, type: 'focus' },
  // Week of Apr 13
  { id: 514, title: 'Invoice Review Queue', date: new Date(2026, 3, 13), startHour: 8, startMin: 30, endHour: 9, endMin: 30, type: 'focus' },
  { id: 515, title: 'Weekly Check Run', date: new Date(2026, 3, 13), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'deadline' },
  { id: 516, title: 'Front Range Drywall -- Pay App Review', date: new Date(2026, 3, 13), startHour: 14, startMin: 0, endHour: 15, endMin: 0, type: 'meeting', projectSlug: 'sunset-ridge-apartments' },
  { id: 517, title: 'Invoice Review Queue', date: new Date(2026, 3, 14), startHour: 8, startMin: 30, endHour: 9, endMin: 30, type: 'focus' },
  { id: 518, title: 'SCS-8834 Early-Pay Discount Deadline', date: new Date(2026, 3, 14), startHour: 12, startMin: 0, endHour: 12, endMin: 30, type: 'deadline' },
  { id: 519, title: 'Vendor Statement Reconciliation', date: new Date(2026, 3, 14), startHour: 14, startMin: 0, endHour: 16, endMin: 0, type: 'focus' },
  { id: 520, title: 'Invoice Review Queue', date: new Date(2026, 3, 15), startHour: 8, startMin: 30, endHour: 9, endMin: 30, type: 'focus' },
  { id: 521, title: 'AP Team Standup', date: new Date(2026, 3, 15), startHour: 9, startMin: 30, endHour: 10, endMin: 0, type: 'meeting' },
  { id: 522, title: 'ACH Batch Processing', date: new Date(2026, 3, 16), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'deadline' },
  { id: 523, title: 'Week-End AP Reconciliation', date: new Date(2026, 3, 17), startHour: 9, startMin: 0, endHour: 11, endMin: 0, type: 'focus' },
  // Week of Apr 20
  { id: 524, title: 'Invoice Review Queue', date: new Date(2026, 3, 20), startHour: 8, startMin: 30, endHour: 9, endMin: 30, type: 'focus' },
  { id: 525, title: 'Weekly Check Run', date: new Date(2026, 3, 20), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'deadline' },
  { id: 526, title: 'AP Audit Documentation Prep', date: new Date(2026, 3, 21), startHour: 9, startMin: 0, endHour: 12, endMin: 0, type: 'focus' },
  { id: 527, title: 'AP Team Standup', date: new Date(2026, 3, 22), startHour: 9, startMin: 30, endHour: 10, endMin: 0, type: 'meeting' },
  { id: 528, title: 'ACH Batch Processing', date: new Date(2026, 3, 23), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'deadline' },
  { id: 529, title: 'Week-End AP Reconciliation', date: new Date(2026, 3, 24), startHour: 9, startMin: 0, endHour: 11, endMin: 0, type: 'focus' },
  // Week of Apr 27 -- Month End
  { id: 530, title: 'Invoice Review Queue', date: new Date(2026, 3, 27), startHour: 8, startMin: 30, endHour: 9, endMin: 30, type: 'focus' },
  { id: 531, title: 'Weekly Check Run', date: new Date(2026, 3, 27), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'deadline' },
  { id: 532, title: 'Month-End Accrual Cutoff', date: new Date(2026, 3, 28), startHour: 9, startMin: 0, endHour: 10, endMin: 0, type: 'deadline' },
  { id: 533, title: 'Vendor Statement Reconciliation', date: new Date(2026, 3, 29), startHour: 9, startMin: 0, endHour: 12, endMin: 0, type: 'focus' },
  { id: 534, title: 'Month-End AP Close', date: new Date(2026, 3, 30), startHour: 9, startMin: 0, endHour: 17, endMin: 0, type: 'deadline' },
];
