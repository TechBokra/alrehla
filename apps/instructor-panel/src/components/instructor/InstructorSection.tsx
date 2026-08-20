import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@alrehla/ui/card';
import { cn } from '../../lib/utils';

interface InstructorSectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}

const InstructorSection = React.forwardRef<
  HTMLElement,
  InstructorSectionProps & React.HTMLAttributes<HTMLElement>
>(({ title, icon, children, className, ...props }, ref) => {
    return (
        <Card ref={ref} className={cn(className)} {...props}>
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    {icon}
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {children}
            </CardContent>
        </Card>
    );
});
InstructorSection.displayName = "InstructorSection";

export default InstructorSection;
