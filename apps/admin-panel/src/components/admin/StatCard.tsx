
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@alrehla/ui/card';
import { cn } from '../../lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    onClick?: () => void;
    trend?: 'up' | 'down' | 'neutral'; // Optional mock trend
}

const StatCard = React.forwardRef<HTMLElement, StatCardProps & React.HTMLAttributes<HTMLElement>>(
    ({ title, value, icon, onClick, trend, className, ...props }, ref) => {
        const isButton = !!onClick;
        
        // Randomize trend for demo "alive" feel if not provided
        const computedTrend = trend || (Math.random() > 0.5 ? 'up' : 'neutral');

        return (
            <Card
                ref={ref}
                as={isButton ? 'button' : 'div'}
                onClick={onClick}
                className={cn(
                    "text-right w-full transition-all duration-300 overflow-hidden relative group",
                    "border hover:border-primary/50 hover:shadow-lg bg-white",
                    isButton && "cursor-pointer",
                    className
                )}
                {...props}
            >
                <div className="absolute top-0 right-0 w-1 h-full bg-primary/0 group-hover:bg-primary transition-all duration-300"></div>

                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
                    <div className="p-2 bg-muted/50 rounded-lg text-foreground group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                        {icon}
                    </div>
                </CardHeader>
                <CardContent className="relative z-10">
                    <div className="flex items-baseline justify-between">
                        <div className="text-2xl font-black text-gray-900 group-hover:text-primary transition-colors">
                            {value}
                        </div>
                        
                        {/* Mock Trend Indicator for UI Polish */}
                        <div className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            computedTrend === 'up' ? 'text-green-600 bg-green-50' : 
                            computedTrend === 'down' ? 'text-red-600 bg-red-50' : 'text-gray-500 bg-gray-50'
                        }`}>
                            {computedTrend === 'up' && <TrendingUp size={10} className="mr-1" />}
                            {computedTrend === 'down' && <TrendingDown size={10} className="mr-1" />}
                            {computedTrend === 'neutral' && <Minus size={10} className="mr-1" />}
                            {computedTrend === 'up' ? '+2.4%' : computedTrend === 'down' ? '-1.1%' : '0%'}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }
);
StatCard.displayName = 'StatCard';

export default React.memo(StatCard);
