
export function getWorkCycleSx(cycle: string) {
  if (cycle === 'DAY') {
    return {
      bgcolor: 'rgba(239, 68, 68, 0.12)',
      color: '#b91c1c',
      border: '1px solid rgba(239, 68, 68, 0.25)',
    };
  }

  if (cycle === 'WEEK') {
    return {
      bgcolor: 'rgba(245, 158, 11, 0.16)',
      color: '#92400e',
      border: '1px solid rgba(245, 158, 11, 0.3)',
    };
  }

  if (cycle === 'MONTH') {
    return {
      bgcolor: 'rgba(59, 130, 246, 0.12)',
      color: '#1d4ed8',
      border: '1px solid rgba(59, 130, 246, 0.25)',
    };
  }

  if (cycle === 'ANYTIME') {
    return {
      bgcolor: 'rgba(139, 92, 246, 0.14)',
      color: '#6d28d9',
      border: '1px solid rgba(139, 92, 246, 0.32)',
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
