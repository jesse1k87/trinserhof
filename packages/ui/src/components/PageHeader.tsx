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
  <div className="flex items-center gap-2">
    {icon}
    <h1 className="text-lg font-semibold">{title}</h1>
    {children}
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
  <div className="flex items-center gap-2">
    {icon}
    <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
    {children}
  </div>
);
