import { Document } from "mongoose";

export type ResourceType = 'ROOM' | 'VEHICLE' | 'EQUIPMENT';
export type ResourceStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';

export interface IResourceBooking {
  _id?: string;
  purpose: string;
  by: string;
  date: string;      // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

export interface IResource extends Document {
  name: string;
  type: ResourceType;
  identifier: string; // Số phòng, Biển số xe, Serial thiết bị
  capacity: string;
  status: ResourceStatus;
  bookings: IResourceBooking[];
  ownerId: string;
  createdAt?: Date;
  updatedAt?: Date;
}
