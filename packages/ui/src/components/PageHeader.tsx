import React from 'react';

interface BaseHeaderProps {
  icon?: React.ReactNode;
  title: string;
  center?: React.ReactNode;
  children?: React.ReactNode;
  titleClassName: string;
}

const BaseHeader = ({ icon, title, center, children, titleClassName }: BaseHeaderProps) => (
  <div className="flex w-full items-center justify-between gap-4">
    <div className="flex flex-1 items-center gap-3">
      {icon}
      <h1 className={titleClassName}>{title}</h1>
    </div>
    {center && <div className="shrink-0">{center}</div>}
    <div className="flex flex-1 justify-end">{children}</div>
  </div>
);

export const PageHeader = ({
  icon,
  title,
  center,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  center?: React.ReactNode;
  children?: React.ReactNode;
}) => (
  <BaseHeader icon={icon} title={title} center={center} titleClassName="text-lg font-semibold">
    {children}
  </BaseHeader>
);

export const PageSubHeader = ({
  icon,
  title,
  center,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  center?: React.ReactNode;
  children?: React.ReactNode;
}) => (
  <BaseHeader
    icon={icon}
    title={title}
    center={center}
    titleClassName="text-sm font-medium truncate"
  >
    {children}
  </BaseHeader>
);
