/**
 * Student Types
 */

export type StudentStatus = 'Chờ KSK' | 'Đã KSK' | 'Đã nộp HS' | 'Đang học' | 'Đang thi' | 'Đã đậu' | 'Thi lại' | 'Nghỉ học' | 'Nợ học phí';

export interface DrivingStudent {
  id: string;
  fullName: string;
  slug?: string;
  email?: string;
  phone: string;
  referral?: string;
  birthday: string;
  idCard: string;
  idCardFront?: string;
  idCardBack?: string;
  rank: 'A1' | 'A2' | 'B1' | 'B2' | 'C';
  area: 'Nội thành' | 'Ngoại thành' | 'Tỉnh lân cận';
  registrationDate: string;
  fee: string; // This is the TOTAL fee string (e.g. "12,000,000")
  paidAmount?: number; // Total amount paid so far
  address: string;
  status: StudentStatus;
  ownerId: string;
  healthCheckDate?: string;
  healthCheckNotes?: string;
  healthCheckFiles?: { name: string; url: string; type: string; uploadedAt: string }[];
  
  // Progress tracking
  progress?: {
    theory: { completed: boolean; score?: number; lastDate?: string };
    practice: { hoursDone: number; totalHours: number };
    cabin: { hoursDone: number; totalHours: number };
    dat: { kmDone: number; totalKm: number };
    sim: { completed: boolean; lastDate?: string };
  };

  // Exam History
  exams?: {
    id: string;
    name: string;
    date: string;
    type: 'Tốt nghiệp' | 'Sát hạch';
    status: 'Sắp thi' | 'Đã thi';
    result?: {
      theory: number | 'Đạt' | 'Không đạt';
      practice: number | 'Đạt' | 'Không đạt';
      simulation?: number | 'Đạt' | 'Không đạt';
      overall: 'Đậu' | 'Trượt' | 'Chưa có';
    };
  }[];

  // Payment History (Detailed)
  paymentHistory?: {
    id: string;
    amount: number;
    date: string;
    method: 'Tiền mặt' | 'Chuyển khoản';
    note?: string;
    recipient: string;
  }[];

  createdAt?: Date | string;
  updatedAt?: Date | string;
  examId?: string;
  examName?: string;
  examDate?: string;
}

export interface FeePayment {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  date: string;
  note?: string;
  ownerId: string;
  createdAt?: Date | string;
}

export interface BroadcastNotification {
  id: string;
  title: string;
  content: string;
  recipients: string; // e.g. "Tất cả học viên đang học"
  recipientCount: number;
  channels: string[]; // ["Zalo OA", "SMS"]
  status: 'Đã gửi' | 'Đang gửi' | 'Thất bại';
  ownerId: string;
  createdAt: Date | string;
}

export interface RankSetting {
  id: string;
  rank: string;
  label: string;
  fee: string;
  modules: string[]; // ["Lý thuyết", "Thực hành", ...]
  ownerId: string;
}

export interface AreaSetting {
  id: string;
  name: string;
  studentCount?: number;
  ownerId: string;
}

export interface PaymentStage {
  id: string;
  name: string;
  order: number;
  ownerId: string;
}

export type Student = DrivingStudent;

export type ExamStatus = 'Sắp diễn ra' | 'Đã xác nhận' | 'Đã hoàn thành' | 'Đã hủy';

export interface ExamSession {
  id: string;
  name: string;
  status: ExamStatus;
  rank: 'A1' | 'A2' | 'B1' | 'B2' | 'C';
  area: string;
  tentativeDate: string;
  officialDate?: string;
  location: string;
  studentCount: number;
  passCount: number;
  failCount: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// ==== ERP: Khóa học / Giảng viên / Tài nguyên / Lịch tổng hợp ====

export type CourseCategory = string;
export type CourseStatus = 'Hoạt động' | 'Tạm dừng';

export interface Course {
  id: string;
  code: string;
  title: string;
  category: CourseCategory;
  fee: string;
  duration: string;
  maxLearners: number;
  activeBatches: number;
  status: CourseStatus;
  ownerId: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type InstructorStatus = 'Available' | 'On Leave' | 'Busy';

export interface Instructor {
  id: string;
  name: string;
  phone: string;
  email: string;
  specializations: string[];
  rating: number;
  activeClasses: number;
  status: InstructorStatus;
  ownerId: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type ResourceType = 'ROOM' | 'VEHICLE' | 'EQUIPMENT';
export type ResourceStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';

export interface ResourceBooking {
  id?: string;
  purpose: string;
  by: string;
  date: string;      // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

export interface ResourceItem {
  id: string;
  name: string;
  type: ResourceType;
  identifier: string;
  capacity: string;
  status: ResourceStatus;
  bookings: ResourceBooking[];
  ownerId: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  type: 'class' | 'exam' | 'resource';
  date: string; // YYYY-MM-DD
  time: string;
  details: string;
}

export interface StudentStats {
  totalStudents: number;
  averageGPA: number;
  attendanceRate: number;
  atRiskCount: number;
}
