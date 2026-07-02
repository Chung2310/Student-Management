import dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "../models/user.model";
import { CourseCategory } from "../models/course-category.model";
import { ResourceCategory } from "../models/resource-category.model";
import { Resource } from "../models/resource.model";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/student_management";

async function runBackfill() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected successfully!");

  try {
    // 1. Lấy tất cả user (owner)
    const users = await User.find({});
    console.log(`Found ${users.length} users in the database.`);

    const ownerIds = users.map(u => u._id.toString());

    // 2. Tạo các category mặc định cho từng owner
    for (const ownerId of ownerIds) {
      console.log(`Processing categories for ownerId: ${ownerId}...`);

      // Course category "Lái xe"
      try {
        const existCourseCat = await CourseCategory.findOne({ ownerId, name: "Lái xe" });
        if (!existCourseCat) {
          await CourseCategory.create({ ownerId, name: "Lái xe" });
          console.log(`- Created CourseCategory "Lái xe"`);
        }
      } catch (err: any) {
        console.error(`- Error creating CourseCategory "Lái xe":`, err.message);
      }

      // Resource categories: "Phòng học", "Xe tập lái", "Thiết bị"
      const defaultResourceCats = ["Phòng học", "Xe tập lái", "Thiết bị"];
      for (const catName of defaultResourceCats) {
        try {
          const existResCat = await ResourceCategory.findOne({ ownerId, name: catName });
          if (!existResCat) {
            await ResourceCategory.create({ ownerId, name: catName });
            console.log(`- Created ResourceCategory "${catName}"`);
          }
        } catch (err: any) {
          console.error(`- Error creating ResourceCategory "${catName}":`, err.message);
        }
      }
    }

    // 3. Migrate Resource.type từ 'ROOM'/'VEHICLE'/'EQUIPMENT' sang tiếng Việt
    console.log("Migrating Resource types...");
    const resources = await Resource.find({});
    let migratedCount = 0;

    for (const res of resources) {
      const typeLower = (res.type || "").toLowerCase();
      let newType = res.type;

      if (typeLower === "room") {
        newType = "Phòng học";
      } else if (typeLower === "vehicle") {
        newType = "Xe tập lái";
      } else if (typeLower === "equipment") {
        newType = "Thiết bị";
      }

      if (newType !== res.type) {
        res.type = newType;
        await res.save();
        migratedCount++;
        console.log(`- Resource "${res.name}" type updated to "${newType}"`);
      }
    }

    console.log(`Completed Resource migration: ${migratedCount} resources updated.`);
    console.log("Backfill process finished successfully!");

  } catch (error) {
    console.error("Error running backfill script:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

runBackfill();
