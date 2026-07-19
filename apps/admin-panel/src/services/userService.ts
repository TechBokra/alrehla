import * as userActions from '../actions/userActions';

export const userService = {
  getAllUsers: userActions.getAllUsers,
  isEmailTaken: userActions.isEmailTaken,
  createUser: userActions.createUser,
  updateUser: userActions.updateUser,
  updateUserPassword: userActions.updateUserPassword,
  bulkDeleteUsers: userActions.bulkDeleteUsers,
  createAndLinkStudentAccount: userActions.createAndLinkStudentAccount,
  linkStudentToChildProfile: userActions.linkStudentToChildProfile,
  unlinkStudentFromChildProfile: userActions.unlinkStudentFromChildProfile,
  createChildProfile: userActions.createChildProfile,
  updateChildProfile: userActions.updateChildProfile,
  deleteChildProfile: userActions.deleteChildProfile,
  getAllChildProfiles: userActions.getAllChildProfiles,
  resetStudentPassword: userActions.resetStudentPassword,
  getPublisherProfile: userActions.getPublisherProfile,
  updatePublisherProfile: userActions.updatePublisherProfile,
  mergeDuplicateChildren: userActions.mergeDuplicateChildren,
};
