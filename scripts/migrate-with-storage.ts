import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { getStorage, ref, getBytes } from "firebase/storage";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import https from "https";

// Load environment variables
dotenv.config();

// Config Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Load firebase config from the specified downloaded path or fallback to local
const downloadConfigPath = "C:\\Users\\PC\\Downloads\\Student-Management-main\\Student-Management-main\\firebase-applet-config.json";
const localConfigPath = path.resolve(process.cwd(), "firebase-applet-config.json");

let firebaseConfigPath = localConfigPath;
if (fs.existsSync(downloadConfigPath)) {
  console.log(`Tìm thấy cấu hình Firebase tại thư mục tải xuống: ${downloadConfigPath}`);
  firebaseConfigPath = downloadConfigPath;
} else if (fs.existsSync(localConfigPath)) {
  console.log(`Không tìm thấy cấu hình ở thư mục tải xuống, sử dụng cấu hình cục bộ: ${localConfigPath}`);
  firebaseConfigPath = localConfigPath;
} else {
  console.error("Không tìm thấy tệp firebase-applet-config.json ở bất kỳ đâu.");
  process.exit(1);
}

const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));

// MongoDB models
import { User } from "../server/models/user.model";
import { Student } from "../server/models/student.model";
import { Exam } from "../server/models/exam.model";
import { Payment } from "../server/models/payment.model";
import { Notification } from "../server/models/notification.model";

// Extract storage path from Firebase Storage URL
function getStoragePathFromUrl(url: string): string | null {
  if (!url.includes("firebasestorage.googleapis.com")) return null;
  try {
    const oIndex = url.indexOf("/o/");
    if (oIndex === -1) return null;
    const endPathIndex = url.indexOf("?", oIndex);
    const encodedPath = endPathIndex !== -1 
      ? url.substring(oIndex + 3, endPathIndex) 
      : url.substring(oIndex + 3);
    return decodeURIComponent(encodedPath);
  } catch {
    return null;
  }
}

// Download file via https GET (for Firebase storage public download URLs)
function downloadFileHttps(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Tải file thất bại: HTTP status ${res.statusCode}`));
        return;
      }
      const chunks: Uint8Array[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", (err) => reject(err));
    }).on("error", (err) => reject(err));
  });
}

// Upload buffer to Cloudinary
function uploadBufferToCloudinary(buffer: Buffer, fileName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const cleanFileName = path.parse(fileName).name.replace(/[^a-zA-Z0-9-_]/g, "_");
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "student_management",
        resource_type: "auto",
        public_id: `${cleanFileName}_${Date.now()}`,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result?.secure_url || "");
        }
      }
    );
    uploadStream.end(buffer);
  });
}

async function runMigration() {
  const email = process.argv[2] || process.env.FIREBASE_EMAIL;
  const password = process.argv[3] || process.env.FIREBASE_PASSWORD;

  if (!email || !password) {
    console.error("Vui lòng cung cấp email và mật khẩu Firebase. Hướng dẫn:");
    console.error("1. Chạy lệnh: npx tsx scripts/migrate-with-storage.ts <email> <password>");
    console.error("2. Hoặc thêm FIREBASE_EMAIL và FIREBASE_PASSWORD vào file .env");
    process.exit(1);
  }

  // 1. Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/student_management";
  console.log(`Đang kết nối MongoDB: ${mongoUri}`);
  await mongoose.connect(mongoUri);
  console.log("Đã kết nối MongoDB thành công.");

  // 2. Connect to Firebase
  console.log("Đang kết nối Firebase...");
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  // 3. Login to Firebase
  console.log(`Đang đăng nhập Firebase với tài khoản: ${email}`);
  let userCredential;
  try {
    userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Đăng nhập Firebase thành công. UID:", userCredential.user.uid);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Đăng nhập Firebase thất bại:", msg);
    await mongoose.disconnect();
    process.exit(1);
  }

  const firebaseUid = userCredential.user.uid;

  // 4. Create User in MongoDB if not exists
  let mongoUser = await User.findOne({ email });
  if (!mongoUser) {
    console.log(`Đang tạo người dùng mới ${email} trên MongoDB...`);
    const hashedPassword = await bcrypt.hash(password, 10);
    mongoUser = new User({
      email,
      password: hashedPassword,
      displayName: userCredential.user.displayName || email.split("@")[0],
    });
    await mongoUser.save();
    console.log("Đã tạo tài khoản quản trị trên MongoDB.");
  } else {
    console.log("Tài khoản quản trị đã tồn tại trên MongoDB.");
  }

  const newOwnerId = mongoUser._id.toString();
  const studentIdMap = new Map<string, string>();

  // 5. Migrate Students & Files
  console.log("Đang lấy dữ liệu học viên từ Firebase...");
  const studentQuery = query(collection(db, "students"), where("ownerId", "==", firebaseUid));
  const studentSnapshot = await getDocs(studentQuery);
  console.log(`Tìm thấy ${studentSnapshot.size} học viên trên Firestore.`);

  let studentCount = 0;
  for (const docSnap of studentSnapshot.docs) {
    const data = docSnap.data();
    
    // Check if student with same phone already exists on MongoDB
    let mongoStudent = await Student.findOne({ phone: data.phone, ownerId: newOwnerId });
    
    // Process and migrate healthCheckFiles to Cloudinary
    const migratedFiles = [];
    const healthCheckFiles = data.healthCheckFiles || [];
    
    for (const file of healthCheckFiles) {
      if (file.url && file.url.includes("firebasestorage.googleapis.com")) {
        console.log(`Đang xử lý tải file từ Firebase Storage: ${file.name}`);
        let fileBuffer: Buffer | null = null;
        
        // Strategy 1: Firebase Storage SDK getBytes
        const storagePath = getStoragePathFromUrl(file.url);
        if (storagePath) {
          try {
            console.log(`Thử tải bằng SDK (path: ${storagePath})...`);
            const storageRef = ref(storage, storagePath);
            const arrayBuffer = await getBytes(storageRef);
            fileBuffer = Buffer.from(arrayBuffer);
          } catch (sdkErr) {
            console.warn(`Lỗi khi tải bằng SDK: ${sdkErr instanceof Error ? sdkErr.message : String(sdkErr)}`);
          }
        }
        
        // Strategy 2: Fallback direct HTTPS fetch
        if (!fileBuffer) {
          try {
            console.log(`Thử tải trực tiếp bằng HTTPS...`);
            fileBuffer = await downloadFileHttps(file.url);
          } catch (httpErr) {
            console.error(`Lỗi khi tải trực tiếp bằng HTTPS: ${httpErr instanceof Error ? httpErr.message : String(httpErr)}`);
          }
        }
        
        // Upload to Cloudinary if successfully downloaded
        if (fileBuffer) {
          try {
            console.log(`Đang upload file lên Cloudinary...`);
            const cloudinaryUrl = await uploadBufferToCloudinary(fileBuffer, file.name || "health_check_file");
            console.log(`Upload thành công. Link Cloudinary: ${cloudinaryUrl}`);
            migratedFiles.push({
              name: file.name,
              url: cloudinaryUrl,
              type: file.type || "application/octet-stream",
              uploadedAt: file.uploadedAt || new Date().toISOString()
            });
          } catch (uploadErr) {
            console.error(`Lỗi khi upload lên Cloudinary: ${uploadErr instanceof Error ? uploadErr.message : String(uploadErr)}`);
            migratedFiles.push(file); // Giữ link cũ nếu lỗi
          }
        } else {
          console.error(`Không thể tải được file ${file.name}. Giữ nguyên liên kết cũ.`);
          migratedFiles.push(file);
        }
      } else {
        // Not a Firebase Storage URL, keep as-is
        migratedFiles.push(file);
      }
    }

    const cleanStudentData = {
      fullName: data.fullName,
      email: data.email || "",
      phone: data.phone,
      referral: data.referral || "",
      birthday: data.birthday || "",
      idCard: data.idCard || "",
      rank: data.rank,
      area: data.area,
      registrationDate: data.registrationDate,
      fee: data.fee,
      paidAmount: data.paidAmount || 0,
      address: data.address || "",
      status: data.status,
      healthCheckDate: data.healthCheckDate || "",
      healthCheckNotes: data.healthCheckNotes || "",
      healthCheckFiles: migratedFiles,
      progress: data.progress || {},
      exams: data.exams || [],
      paymentHistory: data.paymentHistory || [],
      ownerId: newOwnerId,
    };

    if (mongoStudent) {
      await Student.updateOne({ _id: mongoStudent._id }, { $set: cleanStudentData });
      studentIdMap.set(docSnap.id, mongoStudent._id.toString());
      console.log(`Đã cập nhật học viên: ${data.fullName}`);
    } else {
      mongoStudent = new Student(cleanStudentData);
      await mongoStudent.save();
      studentIdMap.set(docSnap.id, mongoStudent._id.toString());
      console.log(`Đã thêm mới học viên: ${data.fullName}`);
      studentCount++;
    }
  }
  console.log(`Đã chuyển đổi/cập nhật thành công ${studentSnapshot.size} học viên (Thêm mới: ${studentCount}).`);

  // Helper to migrate other collections
  const migrateCollection = async (
    firebaseColName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mongoModel: any,
    label: string,
    transformFn: (docData: Record<string, unknown>) => Record<string, unknown>
  ) => {
    console.log(`Đang lấy dữ liệu từ bộ sưu tập Firebase [${firebaseColName}]...`);
    const q = query(collection(db, firebaseColName), where("ownerId", "==", firebaseUid));
    const snapshot = await getDocs(q);
    console.log(`Tìm thấy ${snapshot.size} tài liệu trong [${firebaseColName}].`);

    let count = 0;
    // Clear old records for this owner to avoid duplicates on re-run
    await mongoModel.deleteMany({ ownerId: newOwnerId });

    for (const firebaseDoc of snapshot.docs) {
      const data = firebaseDoc.data();
      const cleanData = transformFn(data);
      
      const newDoc = new mongoModel({
        ...cleanData,
        ownerId: newOwnerId,
      });
      await newDoc.save();
      count++;
    }
    console.log(`Đã chuyển đổi thành công ${count} tài liệu sang MongoDB [${label}].`);
  };

  // 6. Migrate Exams
  await migrateCollection("exams", Exam, "Kỳ thi", (data) => {
    return {
      name: data.name,
      status: data.status,
      rank: data.rank,
      area: data.area,
      tentativeDate: data.tentativeDate,
      officialDate: data.officialDate || "",
      location: data.location,
      studentCount: data.studentCount || 0,
      passCount: data.passCount || 0,
      failCount: data.failCount || 0,
    };
  });

  // 7. Migrate Payments
  await migrateCollection("payments", Payment, "Thanh toán", (data) => {
    // Map the old Firebase studentId to the new MongoDB studentId
    const mappedStudentId = studentIdMap.get(data.studentId as string) || (data.studentId as string);
    return {
      studentId: mappedStudentId,
      studentName: data.studentName,
      amount: data.amount,
      date: data.date,
      note: data.note || "",
    };
  });

  // 8. Migrate Notifications
  await migrateCollection("notifications", Notification, "Thông báo", (data) => {
    return {
      title: data.title,
      content: data.content,
      recipients: data.recipients,
      recipientCount: data.recipientCount || 0,
      channels: data.channels || [],
      status: data.status,
    };
  });

  console.log("Chúc mừng! Quá trình di chuyển dữ liệu và tài liệu hoàn tất thành công.");
  await mongoose.disconnect();
}

runMigration().catch(async (error) => {
  console.error("Lỗi xảy ra trong quá trình di chuyển:", error);
  await mongoose.disconnect();
  process.exit(1);
});
