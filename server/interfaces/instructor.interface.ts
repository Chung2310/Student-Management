import { Document } from "mongoose";

export type InstructorStatus = 'Available' | 'On Leave' | 'Busy';

export interface IInstructor extends Document {
  name: string;
  phone: string;
  email: string;
  specializations: string[];
  rating: number;
  activeClasses: number;
  status: InstructorStatus;
  ownerId: string;
  createdAt?: Date;
  updatedAt?: Date;
}
