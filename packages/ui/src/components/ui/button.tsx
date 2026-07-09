import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        primary: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        success: 'bg-emerald-600 text-white shadow hover:bg-emerald-700',
        pink: 'bg-pink-600 text-white shadow hover:bg-pink-700',
        special: 'bg-orange-500 text-white shadow-lg hover:bg-orange-600',
        subtle: 'bg-muted text-muted-foreground shadow-sm hover:bg-muted/80',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  as?: React.ElementType;
  href?: string;
  to?: string;
  loading?: boolean;
  icon?: React.ReactNode;
  state?: unknown;
  target?: string;
  rel?: string;
  [key: string]: any;
}

const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  ({ className, variant, size, asChild = false, as, href, to, loading = false, icon, children, disabled, ...props }, ref) => {
    const Component: React.ElementType = asChild ? Slot : as || (href || to ? 'a' : 'button');
    const isButton = Component === 'button';
    const targetHref = href || to;

    return (
      <Component
        ref={ref as never}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={isButton ? disabled || loading : undefined}
        aria-busy={loading || undefined}
        aria-disabled={!isButton && (disabled || loading) ? true : undefined}
        href={!asChild && targetHref ? targetHref : undefined}
        {...props}
      >
        {loading ? <Loader2 className="animate-spin" /> : icon}
        {children}
      </Component>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
