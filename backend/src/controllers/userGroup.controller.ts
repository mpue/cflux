import { Request, Response } from 'express';
import { userGroupService } from '../services/userGroup.service';

export const createUserGroup = async (req: Request, res: Response) => {
  try {
    const userGroup = await userGroupService.createUserGroup(req.body);
    res.status(201).json(userGroup);
  } catch (error: any) {
    console.error('Error creating user group:', error);
    res.status(500).json({ error: error.message || 'Failed to create user group' });
  }
};

export const getAllUserGroups = async (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const userGroups = await userGroupService.getAllUserGroups(includeInactive);
    res.json(userGroups);
  } catch (error: any) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch user groups' });
  }
};

export const getUserGroupById = async (req: Request, res: Response) => {
  try {
    const userGroup = await userGroupService.getUserGroupById(req.params.id);
    if (!userGroup) {
      return res.status(404).json({ error: 'User group not found' });
    }
    res.json(userGroup);
  } catch (error: any) {
    console.error('Error fetching user group:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch user group' });
  }
};

export const updateUserGroup = async (req: Request, res: Response) => {
  try {
    const userGroup = await userGroupService.updateUserGroup(req.params.id, req.body);
    res.json(userGroup);
  } catch (error: any) {
    console.error('Error updating user group:', error);
    res.status(500).json({ error: error.message || 'Failed to update user group' });
  }
};

export const deleteUserGroup = async (req: Request, res: Response) => {
  try {
    await userGroupService.deleteUserGroup(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting user group:', error);
    res.status(500).json({ error: error.message || 'Failed to delete user group' });
  }
};

export const addUserToGroup = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    await userGroupService.addUserToGroup(userId, req.params.id);
    res.status(200).json({ message: 'User added to group' });
  } catch (error: any) {
    console.error('Error adding user to group:', error);
    res.status(500).json({ error: error.message || 'Failed to add user to group' });
  }
};

export const removeUserFromGroup = async (req: Request, res: Response) => {
  try {
    await userGroupService.removeUserFromGroup(req.params.userId);
    res.status(200).json({ message: 'User removed from group' });
  } catch (error: any) {
    console.error('Error removing user from group:', error);
    res.status(500).json({ error: error.message || 'Failed to remove user from group' });
  }
};

export const getUsersByGroup = async (req: Request, res: Response) => {
  try {
    const users = await userGroupService.getUsersByGroup(req.params.id);
    res.json(users);
  } catch (error: any) {
    console.error('Error fetching users by group:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch users' });
  }
};
