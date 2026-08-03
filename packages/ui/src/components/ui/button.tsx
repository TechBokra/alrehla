import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        pink: 'bg-pink-600 text-white shadow-sm hover:bg-pink-700 focus-visible:ring-pink-500',
        subtle: 'bg-primary/10 text-primary shadow-sm hover:bg-primary/20',
        success:
          'bg-green-600 text-white shadow-sm hover:bg-green-700 focus-visible:ring-green-500',
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
  extends
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'as' | 'type'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  href?: string;
  as?: React.ElementType;
  [key: string]: any;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      icon,
      href,
      as: Comp,
      children,
      ...props
    },
    ref,
  ) => {
    if (href) {
      return (
        <Link
          href={href}
          className={cn(buttonVariants({ variant, size, className }))}
          {...(props as any)}
        >
          {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          {!loading && icon}
          {children}
        </Link>
      );
    }

    if (Comp) {
      return (
        <Comp className={cn(buttonVariants({ variant, size, className }))} {...props}>
          {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          {!loading && icon}
          {children}
        </Comp>
      );
    }

    const Root = asChild ? Slot : 'button';
    return (
      <Root className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
        {asChild ? (
          children
        ) : (
          <>
            {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {!loading && icon}
            {children}
          </>
        )}
      </Root>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
