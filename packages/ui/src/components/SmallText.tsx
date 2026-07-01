import * as React from 'react';

export const SmallText = ({
  children,
  className = '',
  as: Component = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}) => (
  <Component className={`text-sm text-base-content/60 ${className}`.trim()}>{children}</Component>
);
