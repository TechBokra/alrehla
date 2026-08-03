import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase/client';

const fetchJitsiSettings = async () => {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'jitsi_settings')
    .maybeSingle();

  if (error || !data || (data as any).value === undefined || (data as any).value === null) {
    return null;
  }

  return (data as any).value;
};

export const useJitsiSettings = () => useQuery({
  queryKey: ['jitsiSettings'],
  queryFn: fetchJitsiSettings,
});
