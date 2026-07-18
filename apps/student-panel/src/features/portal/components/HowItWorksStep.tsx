import React from 'react';

interface HowItWorksStepProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const HowItWorksStep: React.FC<HowItWorksStepProps> = ({ icon, title, description }) => (
  <div className="flex flex-col items-center text-center">
    <div className="flex items-center justify-center w-24 h-24 bg-primary/10 rounded-full mb-4 text-primary">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-foreground">{title}</h3>
    <p className="mt-2 text-muted-foreground">{description}</p>
  </div>
);

export default HowItWorksStep;
