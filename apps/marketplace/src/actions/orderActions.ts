"use server";

import { orderService as apiOrderService } from '@alrehla/api/services/orderService';

export const getAllOrders = async (options?: any) => {
  return apiOrderService.getAllOrders(options);
};

export const createOrder = async (payload: any) => {
  return apiOrderService.createOrder(payload);
};

export const createSubscription = async (payload: any) => {
  return apiOrderService.createSubscription(payload);
};

export const getAllSubscriptions = async () => {
  return apiOrderService.getAllSubscriptions();
};

export const getSubscriptionPlans = async () => {
  return apiOrderService.getSubscriptionPlans();
};

export const updateSubscriptionStatus = async (subscriptionId: string, action: 'pause' | 'reactivate' | 'cancel') => {
  return apiOrderService.updateSubscriptionStatus(subscriptionId, action);
};

export const updateOrderStatus = async (orderId: string, newStatus: any) => {
  return apiOrderService.updateOrderStatus(orderId, newStatus);
};

export const updateServiceOrderStatus = async (orderId: string, newStatus: any) => {
  return apiOrderService.updateServiceOrderStatus(orderId, newStatus);
};

export const assignInstructorToServiceOrder = async (orderId: string, instructorId: number | null) => {
  return apiOrderService.assignInstructorToServiceOrder(orderId, instructorId);
};

export const updateOrderComment = async (orderId: string, comment: string) => {
  return apiOrderService.updateOrderComment(orderId, comment);
};

export const uploadReceipt = async (itemId: string, itemType: 'order' | 'booking' | 'subscription', receiptFile: File) => {
  return apiOrderService.uploadReceipt(itemId, itemType, receiptFile);
};

export const bulkUpdateOrderStatus = async (orderIds: string[], status: any) => {
  return apiOrderService.bulkUpdateOrderStatus(orderIds, status);
};

export const bulkDeleteOrders = async (orderIds: string[]) => {
  return apiOrderService.bulkDeleteOrders(orderIds);
};

export const createSubscriptionPlan = async (plan: any) => {
  return apiOrderService.createSubscriptionPlan(plan);
};

export const updateSubscriptionPlan = async (plan: any) => {
  return apiOrderService.updateSubscriptionPlan(plan);
};

export const deleteSubscriptionPlan = async (planId: number) => {
  return apiOrderService.deleteSubscriptionPlan(planId);
};

export const getPersonalizedProducts = async () => {
  return apiOrderService.getPersonalizedProducts();
};

export const createPersonalizedProduct = async (product: any) => {
  return apiOrderService.createPersonalizedProduct(product);
};

export const updatePersonalizedProduct = async (product: any) => {
  return apiOrderService.updatePersonalizedProduct(product);
};

export const approveProduct = async (productId: number, status: 'approved' | 'rejected') => {
  return apiOrderService.approveProduct(productId, status);
};

export const deletePersonalizedProduct = async (productId: number) => {
  return apiOrderService.deletePersonalizedProduct(productId);
};

export const getAllServiceOrders = async () => {
  return apiOrderService.getAllServiceOrders();
};
