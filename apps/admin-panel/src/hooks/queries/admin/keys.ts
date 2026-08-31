export const adminDashboardKeys = {
    all: ['adminDashboard'] as const,
    entry: (key: string) => [...adminDashboardKeys.all, key] as const,
};
