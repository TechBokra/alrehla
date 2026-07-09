"use server";

import { userService as apiUserService } from '@alrehla/api/services/userService';

export const getAllUsers = async (options?: any) => {
  return apiUserService.getAllUsers(options);
};

export const isEmailTaken = async (email: string) => {
  return apiUserService.isEmailTaken(email);
};

export const createUser = async (payload: any) => {
  return apiUserService.createUser(payload);
};

export const createAndLinkStudentAccount = async (payload: any) => {
  return apiUserService.createAndLinkStudentAccount(payload);
};

export const linkStudentToChildProfile = async (payload: any) => {
  return apiUserService.linkStudentToChildProfile(payload);
};

export const unlinkStudentFromChildProfile = async (childProfileId: number) => {
  return apiUserService.unlinkStudentFromChildProfile(childProfileId);
};

export const createChildProfile = async (payload: any) => {
  return apiUserService.createChildProfile(payload);
};

export const updateChildProfile = async (payload: any) => {
  return apiUserService.updateChildProfile(payload);
};

export const deleteChildProfile = async (childId: number) => {
  return apiUserService.deleteChildProfile(childId);
};

export const getAllChildProfiles = async (userIds?: string[]) => {
  return apiUserService.getAllChildProfiles(userIds);
};

export const updateUser = async (payload: any) => {
  return apiUserService.updateUser(payload);
};

export const updateUserPassword = async (payload: any) => {
  return apiUserService.updateUserPassword(payload);
};

export const resetStudentPassword = async (payload: any) => {
  return apiUserService.resetStudentPassword(payload);
};

export const bulkDeleteUsers = async (userIds: string[]) => {
  return apiUserService.bulkDeleteUsers(userIds);
};

export const getPublisherProfile = async (userId: string) => {
  return apiUserService.getPublisherProfile(userId);
};

export const updatePublisherProfile = async (payload: any) => {
  return apiUserService.updatePublisherProfile(payload);
};

export const mergeDuplicateChildren = async () => {
  return apiUserService.mergeDuplicateChildren();
};
