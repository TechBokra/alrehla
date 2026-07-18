import { redirect } from 'next/navigation';
import { getStudentPanelUrl } from '@/lib/studentPanelUrl';

export default function StudentPanelRedirectPage() {
  redirect(getStudentPanelUrl('/dashboard'));
}
