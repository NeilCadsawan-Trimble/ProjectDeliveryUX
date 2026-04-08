export interface NavItem {
  value: string;
  label: string;
  icon?: string;
}

export interface SubnavAction {
  icon: string;
  label: string;
}

export interface SubnavViewToggle {
  icon: string;
  label: string;
  value: string;
}

export interface SubnavConfig {
  searchPlaceholder: string;
  actions: SubnavAction[];
  viewToggles: SubnavViewToggle[];
}

export const SIDE_NAV_ITEMS: NavItem[] = [
  { value: 'dashboard', label: 'Project Dashboard', icon: 'dashboard' },
  { value: 'schedule', label: 'Schedule', icon: 'gantt_chart' },
  { value: 'records', label: 'Records', icon: 'clipboard' },
  { value: 'drawings', label: 'Drawings', icon: 'floorplan' },
  { value: 'field-captures', label: 'Field Captures', icon: 'camera' },
  { value: 'models', label: 'Models', icon: 'package' },
  { value: 'financials', label: 'Financials', icon: 'bar_graph' },
  { value: 'files', label: 'Files', icon: 'folder_closed' },
];

export const RECORDS_SUB_NAV_ITEMS: NavItem[] = [
  { value: 'daily-reports', label: 'Daily Reports', icon: 'calendar' },
  { value: 'rfis', label: 'RFIs', icon: 'help' },
  { value: 'issues', label: 'Issues', icon: 'warning' },
  { value: 'field-work-directives', label: 'Field Work Directives', icon: 'clipboard' },
  { value: 'submittals', label: 'Submittals', icon: 'file_check_in' },
  { value: 'inspections', label: 'Inspections', icon: 'inspect' },
  { value: 'action-items', label: 'Action Items', icon: 'check_circle' },
  { value: 'check-list', label: 'Check List', icon: 'clipboard_check' },
  { value: 'drawing-sets', label: 'Drawing Sets', icon: 'floorplan' },
  { value: 'meeting-minutes', label: 'Meeting Minutes', icon: 'people_group' },
  { value: 'notices-to-comply', label: 'Notices to Comply', icon: 'alert' },
  { value: 'punch-items', label: 'Punch Items', icon: 'pin' },
  { value: 'safety-notices', label: 'Safety Notices', icon: 'hard_hat' },
  { value: 'specification-sets', label: 'Specification Sets', icon: 'document' },
  { value: 'submittal-packages', label: 'Submittal Packages', icon: 'package' },
  { value: 'transmittals', label: 'Transmittals', icon: 'paper_plane' },
];

export const FINANCIALS_SUB_NAV_ITEMS: NavItem[] = [
  { value: 'budget', label: 'Budget', icon: 'bar_graph' },
  { value: 'purchase-orders', label: 'Purchase Orders', icon: 'shopping_cart' },
  { value: 'contracts', label: 'Contracts', icon: 'copy_content' },
  { value: 'potential-change-orders', label: 'Potential Change Orders', icon: 'swap' },
  { value: 'subcontract-change-orders', label: 'Subcontract Change Orders', icon: 'swap' },
  { value: 'billings', label: 'Billings', icon: 'invoice' },
  { value: 'change-order-requests', label: 'Change Order Requests', icon: 'swap' },
  { value: 'contract-invoices', label: 'Contract Invoices', icon: 'invoice' },
  { value: 'cost-forecasts', label: 'Cost Forecasts', icon: 'line_graph' },
  { value: 'general-invoices', label: 'General Invoices', icon: 'invoice' },
  { value: 'prime-contract-change-orders', label: 'Prime Contract Change Orders', icon: 'swap' },
];

export const SUBNAV_CONFIGS: Record<string, SubnavConfig> = {
  schedule: {
    searchPlaceholder: 'Search events...',
    actions: [
      { icon: 'add', label: 'Add event' },
      { icon: 'upload', label: 'Export' },
      { icon: 'print', label: 'Print' },
    ],
    viewToggles: [],
  },
  drawings: {
    searchPlaceholder: 'Search drawings...',
    actions: [
      { icon: 'upload', label: 'Upload' },
      { icon: 'download', label: 'Download' },
      { icon: 'share', label: 'Share' },
    ],
    viewToggles: [
      { icon: 'apps', label: 'Grid view', value: 'grid' },
      { icon: 'menu', label: 'List view', value: 'list' },
    ],
  },
  models: {
    searchPlaceholder: 'Search models...',
    actions: [
      { icon: 'upload', label: 'Upload' },
      { icon: 'download', label: 'Download' },
      { icon: 'share', label: 'Share' },
    ],
    viewToggles: [
      { icon: 'apps', label: 'Grid view', value: 'grid' },
      { icon: 'menu', label: 'List view', value: 'list' },
    ],
  },
  records: {
    searchPlaceholder: 'Search records...',
    actions: [
      { icon: 'add', label: 'Add record' },
      { icon: 'upload', label: 'Export' },
      { icon: 'print', label: 'Print' },
    ],
    viewToggles: [
      { icon: 'apps', label: 'Grid view', value: 'grid' },
      { icon: 'menu', label: 'List view', value: 'list' },
    ],
  },
  fieldCaptures: {
    searchPlaceholder: 'Search captures...',
    actions: [
      { icon: 'upload_cloud', label: 'Upload' },
      { icon: 'camera', label: 'New capture' },
      { icon: 'share', label: 'Share' },
    ],
    viewToggles: [
      { icon: 'apps', label: 'Grid view', value: 'grid' },
      { icon: 'menu', label: 'List view', value: 'list' },
    ],
  },
  financials: {
    searchPlaceholder: 'Search financials...',
    actions: [
      { icon: 'download', label: 'Export' },
      { icon: 'print', label: 'Print' },
    ],
    viewToggles: [],
  },
  'financials-invoices': {
    searchPlaceholder: 'Search invoices...',
    actions: [
      { icon: 'download', label: 'Export' },
      { icon: 'print', label: 'Print' },
    ],
    viewToggles: [
      { icon: 'apps', label: 'Grid view', value: 'grid' },
      { icon: 'menu', label: 'List view', value: 'list' },
    ],
  },
  'financials-tiles': {
    searchPlaceholder: 'Search financials...',
    actions: [
      { icon: 'download', label: 'Export' },
      { icon: 'print', label: 'Print' },
    ],
    viewToggles: [
      { icon: 'apps', label: 'Grid view', value: 'grid' },
      { icon: 'menu', label: 'List view', value: 'list' },
    ],
  },
  files: {
    searchPlaceholder: 'Search files...',
    actions: [
      { icon: 'upload_cloud', label: 'Upload' },
      { icon: 'create_new_folder', label: 'New folder' },
      { icon: 'download', label: 'Download' },
    ],
    viewToggles: [
      { icon: 'apps', label: 'Grid view', value: 'grid' },
      { icon: 'menu', label: 'List view', value: 'list' },
    ],
  },
  'rfi-detail': {
    searchPlaceholder: 'Search in RFI...',
    actions: [
      { icon: 'edit_mode', label: 'Edit' },
      { icon: 'printer', label: 'Print' },
      { icon: 'share', label: 'Share' },
      { icon: 'document', label: 'Details' },
      { icon: 'history', label: 'Activity' },
    ],
    viewToggles: [],
  },
  'submittal-detail': {
    searchPlaceholder: 'Search in submittal...',
    actions: [
      { icon: 'edit_mode', label: 'Edit' },
      { icon: 'printer', label: 'Print' },
      { icon: 'download', label: 'Download' },
      { icon: 'document', label: 'Details' },
      { icon: 'history', label: 'Activity' },
    ],
    viewToggles: [],
  },
  'drawing-detail': {
    searchPlaceholder: 'Search in drawing...',
    actions: [
      { icon: 'download', label: 'Download' },
      { icon: 'printer', label: 'Print' },
      { icon: 'share', label: 'Share' },
    ],
    viewToggles: [
      { icon: 'zoom_in', label: 'Zoom in', value: 'zoom-in' },
      { icon: 'zoom_out', label: 'Zoom out', value: 'zoom-out' },
    ],
  },
  'daily-report-detail': {
    searchPlaceholder: 'Search in report...',
    actions: [
      { icon: 'printer', label: 'Print' },
      { icon: 'share', label: 'Share' },
      { icon: 'document', label: 'Details' },
    ],
    viewToggles: [],
  },
  'inspection-detail': {
    searchPlaceholder: 'Search in inspection...',
    actions: [
      { icon: 'printer', label: 'Print' },
      { icon: 'share', label: 'Share' },
      { icon: 'document', label: 'Details' },
    ],
    viewToggles: [],
  },
  'punch-item-detail': {
    searchPlaceholder: 'Search in punch item...',
    actions: [
      { icon: 'edit_mode', label: 'Edit' },
      { icon: 'printer', label: 'Print' },
      { icon: 'document', label: 'Details' },
    ],
    viewToggles: [],
  },
  'change-order-detail': {
    searchPlaceholder: 'Search in change order...',
    actions: [
      { icon: 'edit_mode', label: 'Edit' },
      { icon: 'printer', label: 'Print' },
      { icon: 'document', label: 'Details' },
    ],
    viewToggles: [],
  },
  'contract-detail': {
    searchPlaceholder: 'Search in contract...',
    actions: [
      { icon: 'edit_mode', label: 'Edit' },
      { icon: 'printer', label: 'Print' },
      { icon: 'download', label: 'Export' },
      { icon: 'document', label: 'Details' },
    ],
    viewToggles: [],
  },
  'panorama-detail': {
    searchPlaceholder: 'Search in capture...',
    actions: [
      { icon: 'download', label: 'Download' },
      { icon: 'share', label: 'Share' },
    ],
    viewToggles: [],
  },
};
