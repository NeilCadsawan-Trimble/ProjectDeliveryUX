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
  { value: 'records', label: 'Records', icon: 'clipboard' },
  { value: 'drawings', label: 'Drawings', icon: 'floorplan' },
  { value: 'field-captures', label: 'Field Captures', icon: 'camera' },
  { value: 'models', label: 'Models', icon: 'package' },
  { value: 'financials', label: 'Financials', icon: 'bar_graph' },
  { value: 'files', label: 'Files', icon: 'folder_closed' },
];

export const RECORDS_SUB_NAV_ITEMS: NavItem[] = [
  { value: 'daily-reports', label: 'Daily Reports' },
  { value: 'rfis', label: 'RFIs' },
  { value: 'issues', label: 'Issues' },
  { value: 'field-work-directives', label: 'Field Work Directives' },
  { value: 'submittals', label: 'Submittals' },
  { value: 'inspections', label: 'Inspections' },
  { value: 'action-items', label: 'Action Items' },
  { value: 'check-list', label: 'Check List' },
  { value: 'drawing-sets', label: 'Drawing Sets' },
  { value: 'meeting-minutes', label: 'Meeting Minutes' },
  { value: 'notices-to-comply', label: 'Notices to Comply' },
  { value: 'punch-items', label: 'Punch Items' },
  { value: 'safety-notices', label: 'Safety Notices' },
  { value: 'specification-sets', label: 'Specification Sets' },
  { value: 'submittal-packages', label: 'Submittal Packages' },
  { value: 'transmittals', label: 'Transmittals' },
];

export const FINANCIALS_SUB_NAV_ITEMS: NavItem[] = [
  { value: 'budget', label: 'Budget' },
  { value: 'purchase-orders', label: 'Purchase Orders' },
  { value: 'contracts', label: 'Contracts' },
  { value: 'potential-change-orders', label: 'Potential Change Orders' },
  { value: 'subcontract-change-orders', label: 'Subcontract Change Orders' },
  { value: 'applications-for-payment', label: 'Applications for Payment' },
  { value: 'change-order-requests', label: 'Change Order Requests' },
  { value: 'contract-invoices', label: 'Contract Invoices' },
  { value: 'cost-forecasts', label: 'Cost Forecasts' },
  { value: 'general-invoices', label: 'General Invoices' },
  { value: 'prime-contract-change-orders', label: 'Prime Contract Change Orders' },
];

export const SUBNAV_CONFIGS: Record<string, SubnavConfig> = {
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
    viewToggles: [
      { icon: 'bar_graph', label: 'Chart view', value: 'grid' },
      { icon: 'menu', label: 'Table view', value: 'list' },
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
};
