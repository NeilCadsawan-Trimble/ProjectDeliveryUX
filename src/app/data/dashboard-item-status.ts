export interface StatusOption {
  value: string;
  label: string;
  dotClass: string;
}

export const STATUS_OPTIONS: StatusOption[] = [
  { value: 'open', label: 'Open', dotClass: 'bg-primary' },
  { value: 'overdue', label: 'Overdue', dotClass: 'bg-destructive' },
  { value: 'upcoming', label: 'Upcoming', dotClass: 'bg-warning' },
  { value: 'closed', label: 'Closed', dotClass: 'bg-success' },
];

export const PUNCH_STATUS_OPTIONS: StatusOption[] = [
  { value: 'open', label: 'Open', dotClass: 'bg-primary' },
  { value: 'in-progress', label: 'In Progress', dotClass: 'bg-warning' },
  { value: 'completed', label: 'Completed', dotClass: 'bg-success' },
  { value: 'verified', label: 'Verified', dotClass: 'bg-success' },
];

export const ASSIGNEE_OPTIONS: string[] = [
  'Sarah Chen',
  'James Carter',
  'Priya Nair',
  'Tom Evans',
  'Lena Brooks',
  'Mike Osei',
  'Daniel Park',
  'Rachel Kim',
  'Marcus Webb',
  'Olivia Grant',
];

const STATUS_DOT: Record<string, string> = {
  open: 'bg-primary',
  overdue: 'bg-destructive',
  upcoming: 'bg-warning',
  closed: 'bg-success',
  'in-progress': 'bg-warning',
  completed: 'bg-success',
  verified: 'bg-success',
};

export function itemStatusDot(status: string): string {
  return STATUS_DOT[status] ?? 'bg-muted';
}

export function capitalizeStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
