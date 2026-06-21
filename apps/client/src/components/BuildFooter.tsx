import * as React from 'react';

export const BuildFooter = () => {
  return (
    <div className="w-full text-center text-xs font-mono text-gray-400 py-2">
      {process.env.BUILD_VERSION} &middot; {formatBuildTime(process.env.BUILD_TIME)}
    </div>
  );
};

const formatBuildTime = (isoString: string | undefined) => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
};
