import React from 'react';

export const PageHeader = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}) => (
  <div className="flex w-full items-center">
    <div className="flex flex-1 items-center gap-3">
      {icon}
      <h1 className="text-lg font-semibold">{title}</h1>
    </div>
    <div>{children}</div>
  </div>
);

export const PageSubHeader = ({
  icon,
  title,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}) => (
  <div className="flex w-full items-center">
    <div className="flex flex-1 items-center gap-3">
      {icon}
      <h1 className="text-sm font-medium">{title}</h1>
    </div>
    <div>{children}</div>
  </div>
);
