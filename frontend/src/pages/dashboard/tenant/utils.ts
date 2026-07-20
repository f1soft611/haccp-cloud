import { APP_LABELS } from '../../../shared/constants/labels';

type WorkItemLike = {
  cycle?: string;
  title: string;
  category: string;
};

export function getWorkCycleLabel(item: WorkItemLike): string {
  const cycle = (item.cycle || '').trim().toLowerCase();
  if (cycle) {
    if (cycle.includes('일') || cycle.includes('daily') || cycle === 'd') {
      return APP_LABELS.dashboard.cycles[0];
    }

    if (cycle.includes('월') || cycle.includes('monthly') || cycle === 'm') {
      return APP_LABELS.dashboard.cycles[1];
    }

    if (cycle.includes('주') || cycle.includes('weekly') || cycle === 'w') {
      return APP_LABELS.dashboard.cycles[2];
    }

    if (cycle.includes('년') || cycle.includes('year') || cycle === 'y') {
      return APP_LABELS.dashboard.cycles[3];
    }

    if (
      cycle.includes('발생') ||
      cycle.includes('사고') ||
      cycle.includes('event') ||
      cycle === 'e'
    ) {
      return APP_LABELS.dashboard.cycles[4];
    }

    return cycle;
  }

  const text = `${item.title} ${item.category}`.toLowerCase();

  if (
    text.includes('일일') ||
    text.includes('일지') ||
    text.includes('ccp') ||
    text.includes('daily')
  ) {
    return APP_LABELS.dashboard.cycles[0];
  }

  if (text.includes('주간') || text.includes('weekly')) {
    return APP_LABELS.dashboard.cycles[2];
  }

  if (text.includes('월간') || text.includes('monthly')) {
    return APP_LABELS.dashboard.cycles[1];
  }

  if (
    text.includes('발생') ||
    text.includes('사고') ||
    text.includes('event')
  ) {
    return APP_LABELS.dashboard.cycles[4];
  }

  return APP_LABELS.dashboard.cycles[2];
}

export function getWorkCycleSx(cycleLabel: string) {
  if (cycleLabel === APP_LABELS.dashboard.cycles[0]) {
    return {
      bgcolor: 'rgba(239, 68, 68, 0.12)',
      color: '#b91c1c',
      border: '1px solid rgba(239, 68, 68, 0.25)',
    };
  }

  if (cycleLabel === APP_LABELS.dashboard.cycles[2]) {
    return {
      bgcolor: 'rgba(245, 158, 11, 0.16)',
      color: '#92400e',
      border: '1px solid rgba(245, 158, 11, 0.3)',
    };
  }

  if (cycleLabel === APP_LABELS.dashboard.cycles[1]) {
    return {
      bgcolor: 'rgba(59, 130, 246, 0.12)',
      color: '#1d4ed8',
      border: '1px solid rgba(59, 130, 246, 0.25)',
    };
  }

  return {
    bgcolor: 'rgba(16, 185, 129, 0.12)',
    color: '#047857',
    border: '1px solid rgba(16, 185, 129, 0.28)',
  };
}

export function formatDate(value: string): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
