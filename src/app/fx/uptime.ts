const pad = (value: number) => String(value).padStart(2, '0');

/**
 * Time from `from` to `now` as `8y 01m 07d 14:22:31`: whole calendar years and
 * months, then days and a clock for the rest. Times before `from` read as zero.
 */
export function formatUptime(from: Date, now: Date): string {
  const end = Math.max(now.getTime(), from.getTime());
  const start = from;

  const totalMonths = (date: Date) => date.getUTCFullYear() * 12 + date.getUTCMonth();
  const plusMonths = (months: number) => {
    const date = new Date(start);
    date.setUTCMonth(date.getUTCMonth() + months);
    return date;
  };

  let months = totalMonths(new Date(end)) - totalMonths(start);
  // Day-of-month overflow (Jan 31 + 1 month) rolls into the next month, so step back until it fits.
  while (months > 0 && plusMonths(months).getTime() > end) {
    months -= 1;
  }

  const rest = end - plusMonths(months).getTime();
  const days = Math.floor(rest / 86_400_000);
  const seconds = Math.floor((rest % 86_400_000) / 1000);
  const clock = [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60].map(pad).join(':');

  return `${Math.floor(months / 12)}y ${pad(months % 12)}m ${pad(days)}d ${clock}`;
}
