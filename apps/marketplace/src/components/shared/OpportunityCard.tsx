import React from 'react';
import { Card, CardContent } from '../ui/card';

interface OpportunityCardProps { 
    icon: React.ReactNode; 
    title: string; 
    description: string; 
}

const OpportunityCard = React.forwardRef<HTMLElement, OpportunityCardProps & React.HTMLAttributes<HTMLElement>>(
    ({ icon, title, description, ...props }, ref) => (
        <Card ref={ref} className="text-center h-full flex flex-col transform hover:-translate-y-1 transition-transform duration-300" {...props}>
            <CardContent className="pt-6 flex flex-col items-center flex-grow">
                <div className="flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-4">
                    {icon}
                </div>
                <h3 className="text-xl font-bold text-foreground">{title}</h3>
                <p className="mt-2 text-muted-foreground flex-grow">{description}</p>
            </CardContent>
        </Card>
    )
);
OpportunityCard.displayName = 'OpportunityCard';

export default React.memo(OpportunityCard);
