import { Student } from '../types';

export const INITIAL_STUDENTS: Student[] = [
  {
    id: '1',
    fullName: 'Nguyễn Văn An',
    phone: '0912345678',
    birthday: '1995-05-15',
    idCard: '012345678901',
    rank: 'B2',
    area: 'Nội thành',
    registrationDate: '10/03/2024',
    fee: '4.500.000',
    paidAmount: 3000000,
    address: 'Q1, TP.HCM',
    status: 'Đang học',
    ownerId: 'mock-user',
    progress: {
      theory: { completed: true, score: 35, lastDate: '10/04/2026' },
      practice: { hoursDone: 12, totalHours: 20 },
      cabin: { hoursDone: 3, totalHours: 3 },
      dat: { kmDone: 450, totalKm: 810 },
      sim: { completed: true, lastDate: '12/04/2026' }
    },
    exams: [
      {
        id: 'e1',
        name: 'Thi tốt nghiệp B2 - K24',
        date: '28/03/2026',
        type: 'Tốt nghiệp',
        status: 'Đã thi',
        result: { theory: 34, practice: 85, simulation: 45, overall: 'Đậu' }
      }
    ],
    paymentHistory: [
      { id: 'p1', amount: 2000000, date: '10/03/2026', method: 'Tiền mặt', recipient: 'Kế toán A' },
      { id: 'p2', amount: 1000000, date: '05/04/2026', method: 'Chuyển khoản', recipient: 'Kế toán B' }
    ]
  },
  {
    id: '2',
    fullName: 'Trần Thị Bình',
    phone: '0987654321',
    birthday: '1998-08-20',
    idCard: '098765432109',
    rank: 'A1',
    area: 'Ngoại thành',
    registrationDate: '15/03/2024',
    fee: '1.200.000',
    address: 'Bình Chánh, TP.HCM',
    status: 'Chờ KSK',
    ownerId: 'mock-user'
  }
];
