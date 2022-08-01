import {FlashClient} from '@superset-ui/core';
import { FlashObject } from '../types';


export const fetchUsers = async (): Promise<any> => {
  return await FlashClient.get<FlashObject[]>("/users");
};

export const createFlash = async (payload: FlashObject): Promise<any> => {
  console.log('flash api post==', payload)
  return await FlashClient.post<FlashObject>("v1/flash/", payload);
};

export const updateUser = async (user: FlashObject): Promise<any> => {
  return await FlashClient.put<FlashObject>(`/users/${user.id}`, user);
};

export const deleteUser = async (user: FlashObject): Promise<any> => {
  return await FlashClient.delete<FlashObject>(`/users/${user.id}`);
};