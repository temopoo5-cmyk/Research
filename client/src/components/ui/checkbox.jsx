import * as React from 'react';
import { cn } from '../../lib/utils';

const Checkbox = React.forwardRef(({ className, ...props }, ref) => (
  <input
    type="checkbox"
    className={cn(
      'peer h-4 w-4 shrink-0 rounded-sm border-[#DCEBE5] bg-ivory text-emerald-brand',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-brand/20',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=checked]:bg-emerald-brand data-[state=checked]:border-emerald-brand',
      className
    )}
    ref={ref}
    {...props}
  />
));
Checkbox.displayName = 'Checkbox';

export { Checkbox };