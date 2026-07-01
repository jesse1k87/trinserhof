import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, ...props }, ref) => {
  return <button className={`btn ${className || ''}`.trim()} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { Button };
