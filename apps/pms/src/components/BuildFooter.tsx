import * as React from 'react';

export const BuildFooter = () => {
  return (
    <div className="w-full text-center text-xs font-mono text-muted-foreground py-2 px-4">
      <div>{formatBuildTime(process.env.BUILD_TIME)}</div>
      <div>{process.env.BUILD_VERSION}</div>
    </div>
  );
};

const formatBuildTime = (isoString: string | undefined) => {
  if (!isoString) return '';
  return formatRelativeTime(new Date(isoString));
};

const formatRelativeTime = (date: Date) => {
  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1],
  ];
  for (const [unit, secondsInUnit] of units) {
    if (Math.abs(diffSeconds) >= secondsInUnit || unit === 'second') {
      return rtf.format(Math.round(diffSeconds / secondsInUnit), unit);
    }
  }
  return rtf.format(diffSeconds, 'second');
};
