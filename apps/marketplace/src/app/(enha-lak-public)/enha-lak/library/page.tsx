import LibraryPage from '@/features/enha-lak-library';

export const revalidate = 300;

interface LibraryRouteProps {
  searchParams: Promise<{
    search?: string;
    publisher?: string;
    sort?: string;
  }>;
}

export default async function Page({ searchParams }: LibraryRouteProps) {
  return <LibraryPage searchParams={await searchParams} />;
}
