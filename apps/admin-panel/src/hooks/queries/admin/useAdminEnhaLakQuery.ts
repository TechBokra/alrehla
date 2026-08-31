
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { adminQueryKeys } from '@alrehla/admin-core';
import { orderService } from '../../../services/orderService';
import type { OrderWithRelations } from '../../../lib/database.types';

interface UseAdminOrdersOptions {
    page?: number;
    pageSize?: number;
    search?: string;
    statusFilter?: string;
}

export const useAdminOrders = (options: UseAdminOrdersOptions = {}) => {
    return useQuery({
        queryKey: adminQueryKeys.orders(options),
        queryFn: async () => {
            const { orders, count } = await orderService.getAllOrders(options);
            return { orders: orders as OrderWithRelations[], count };
        },
        placeholderData: keepPreviousData,
    });
};

export const useAdminSubscriptions = () => useQuery({
    queryKey: adminQueryKeys.subscriptions(),
    queryFn: () => orderService.getAllSubscriptions(),
});

export const useAdminSubscriptionPlans = () => useQuery({
    queryKey: adminQueryKeys.subscriptionPlans(),
    queryFn: () => orderService.getSubscriptionPlans(),
});

export const useAdminPersonalizedProducts = () => useQuery({
    queryKey: adminQueryKeys.personalizedProducts(),
    queryFn: () => orderService.getPersonalizedProducts(),
});
