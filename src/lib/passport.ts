export interface PassportVisit {
  destinationId: string;
  name: string;
  state: string;
  visitedOn: string;
  stampedAt: string;
}

export function passportStoragePrefix(accountId: string) {
  return `safarnama_passport_${accountId}:`;
}

export function readPassport(accountId: string): PassportVisit[] {
  if (!accountId) return [];
  const prefix = passportStoragePrefix(accountId);
  try {
    return Object.keys(localStorage)
      .filter(key => key.startsWith(prefix))
      .flatMap(key => {
        try {
          const visit = JSON.parse(localStorage.getItem(key) ?? 'null') as PassportVisit | null;
          return visit?.destinationId === key.slice(prefix.length) &&
            typeof visit.name === 'string' && typeof visit.state === 'string' &&
            typeof visit.visitedOn === 'string' && typeof visit.stampedAt === 'string' ? [visit] : [];
        } catch {
          return [];
        }
      })
      .sort((first, second) => second.stampedAt.localeCompare(first.stampedAt));
  } catch {
    return [];
  }
}

export function todayLocal() {
  const now = new Date();
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
}

export function validateVisitDate(visitedOn: string) {
  if (!visitedOn) return;
  const date = new Date(`${visitedOn}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(visitedOn) ||
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== visitedOn ||
      visitedOn > todayLocal()) {
    throw new Error('Choose a valid visit date up to today.');
  }
}

export function formatVisitDate(visitedOn: string) {
  const date = new Date(`${visitedOn}T00:00:00Z`);
  if (!Number.isFinite(date.getTime())) return 'Visited';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(date);
}
