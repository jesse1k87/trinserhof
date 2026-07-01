import * as React from 'react';

const Section = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`flex flex-col bg-base-100 rounded-md gap-3 p-2 pt-0 ${className ?? ''}`.trim()}
      {...props}
    />
  ),
);

Section.displayName = 'Section';

export { Section };
