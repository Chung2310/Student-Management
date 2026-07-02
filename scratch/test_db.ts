import "dotenv/config";
import mongoose from "mongoose";
import { Student } from "../server/models/student.model";
import { connectDB } from "../server/config/db";

async function main() {
  await connectDB();
  const students = await Student.find({}, "fullName idCard");
  console.log("--- List of Students in DB ---");
  for (const s of students) {
    console.log(`Name: ${s.fullName}, CCCD: ${s.idCard}`);
  }
  await mongoose.disconnect();
}

main().catch(console.error);
