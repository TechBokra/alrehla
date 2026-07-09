import * as React from 'react';
import { Search } from 'lucide-react';
import { Input, type InputProps } from '../ui/input';
import { cn } from '../../lib/utils';

export interface SearchInputProps extends InputProps {
  containerClassName?: string;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(({ className, containerClassName, type = 'search', ...props }, ref) => (
  <div className={cn('relative', containerClassName)}>
    <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input ref={ref} type={type} className={cn('ps-9', className)} {...props} />
  </div>
));
SearchInput.displayName = 'SearchInput';

export { SearchInput };
