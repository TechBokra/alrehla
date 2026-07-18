/**
 * Shared Clerk styling for Clerk-owned surfaces such as CAPTCHA and fallback
 * dialogs. Sign-in and sign-up pages use the custom shadcn forms instead.
 */
export const alrehlaClerkAppearance = {
  variables: {
    colorPrimary: 'hsl(var(--primary))',
    colorBackground: 'hsl(var(--background))',
    colorForeground: 'hsl(var(--foreground))',
    colorMutedForeground: 'hsl(var(--muted-foreground))',
    colorInput: 'hsl(var(--input))',
    colorInputForeground: 'hsl(var(--foreground))',
    borderRadius: '0.5rem',
    fontFamily: 'Cairo, sans-serif',
  },
  elements: {
    cardBox: 'shadow-none',
    card: 'border border-border bg-card text-card-foreground shadow-sm',
    formButtonPrimary:
      'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring',
    formFieldInput:
      'border-input bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring',
    footerActionLink: 'text-primary hover:text-primary/90',
  },
} as const;
