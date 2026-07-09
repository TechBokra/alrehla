import * as userActions from '../actions/userActions';

export const userService = {
  getAllUsers: userActions.getAllUsers,
  isEmailTaken: userActions.isEmailTaken,
  createUser: userActions.createUser,
  createAndLinkStudentAccount: userActions.createAndLinkStudentAccount,
  linkStudentToChildProfile: userActions.linkStudentToChildProfile,
  unlinkStudentFromChildProfile: userActions.unlinkStudentFromChildProfile,
  createChildProfile: userActions.createChildProfile,
  updateChildProfile: userActions.updateChildProfile,
  deleteChildProfile: userActions.deleteChildProfile,
  getAllChildProfiles: userActions.getAllChildProfiles,
  updateUser: userActions.updateUser,
  updateUserPassword: userActions.updateUserPassword,
  resetStudentPassword: userActions.resetStudentPassword,
  bulkDeleteUsers: userActions.bulkDeleteUsers,
  getPublisherProfile: userActions.getPublisherProfile,
  updatePublisherProfile: userActions.updatePublisherProfile,
  mergeDuplicateChildren: userActions.mergeDuplicateChildren,
};
