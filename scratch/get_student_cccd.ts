import mongoose from "mongoose";
import dotenv from "dotenv";
import { Student } from "../server/models/student.model";
import { connectDB } from "../server/config/db";

dotenv.config();

async function run() {
  await connectDB();
  const student = await Student.findOne({});
  if (student) {
    console.log("FOUND_STUDENT:", {
      fullName: student.fullName,
      idCard: student.idCard,
      phone: student.phone
    });
  } else {
    console.log("NO_STUDENTS_FOUND");
  }
  await mongoose.connection.close();
}

run().catch(console.error);
