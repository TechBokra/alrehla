import * as React from 'react';
import { Accordion as ShadcnAccordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion';

export interface AccordionProps {
    title: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

const Accordion: React.FC<AccordionProps> = ({ title, children, className }) => {
    return (
        <ShadcnAccordion type="single" collapsible className={className}>
            <AccordionItem value="item-1">
                <AccordionTrigger className="text-lg font-bold hover:no-underline">{title}</AccordionTrigger>
                <AccordionContent>
                    {children}
                </AccordionContent>
            </AccordionItem>
        </ShadcnAccordion>
    );
};

export default Accordion;
