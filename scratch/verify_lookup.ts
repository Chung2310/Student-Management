import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../server/config/db";
import { StudentService } from "../server/services/student.service";

dotenv.config();

async function main() {
  await connectDB();
  const inputs = ["045634512311", "0456 345 12311", "0456.345.12311", " 045634512311 "];
  for (const input of inputs) {
    const student = await StudentService.getStudentByIdCard(input);
    console.log(input, "=>", student ? `${student.fullName} | ${student.idCard}` : "NOT_FOUND");
  }
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
