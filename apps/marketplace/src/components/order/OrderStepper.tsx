import React from 'react';
import { Check } from 'lucide-react';

interface OrderStepperProps {
    steps: { key: string; title: string }[];
    currentStep: string;
}

const OrderStepper: React.FC<OrderStepperProps> = ({ steps, currentStep }) => {
    const currentStepIndex = steps.findIndex(s => s.key === currentStep);

    return (
        <nav aria-label="Progress">
            <ol role="list" className="space-y-4 md:flex md:space-y-0 md:space-x-8 rtl:md:space-x-reverse">
                {steps.map((step, stepIdx) => {
                    const isCompleted = stepIdx < currentStepIndex;
                    const isCurrent = stepIdx === currentStepIndex;

                    return (
                        <li key={step.title} className="md:flex-1" role="listitem">
                            <div className={`group flex flex-col border-l-4 rtl:border-l-0 rtl:border-r-4 py-2 pl-4 rtl:pl-0 rtl:pr-4 md:border-l-0 rtl:md:border-r-0 md:border-t-4 md:pl-0 rtl:md:pr-0 md:pt-4 md:pb-0
                                ${isCurrent ? 'border-primary' : isCompleted ? 'border-green-600' : 'border-gray-200'}`}
                                aria-current={isCurrent ? 'step' : undefined}
                            >
                                <span className={`text-sm font-semibold ${isCurrent ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                                    الخطوة {stepIdx + 1}
                                </span>
                                <span className="text-sm font-medium flex items-center gap-2">
                                    {isCompleted && <Check size={16} className="text-green-600" />}
                                    {step.title}
                                </span>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default OrderStepper;
