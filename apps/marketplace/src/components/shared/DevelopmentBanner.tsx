import { MaintenanceSettings } from '@alrehla/types';
import { AlertTriangle } from 'lucide-react';
import React from 'react';

const DevelopmentBanner: React.FC = ({
  maintenanceSettings,
}: {
  maintenanceSettings: MaintenanceSettings | null;
}) => {
  const settings = maintenanceSettings;

  if (!settings?.isActive) return null;

  return (
    <div className="bg-yellow-400 text-yellow-900 px-4 py-2 text-center text-sm font-bold shadow-sm relative z-[50] flex items-center justify-center gap-2 dir-rtl">
      <AlertTriangle size={16} className="shrink-0" />
      <span>{settings.message || 'الموقع قيد التطوير حالياً'}</span>
    </div>
  );
};

export default DevelopmentBanner;
