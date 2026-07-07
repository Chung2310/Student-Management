import React, { useEffect, useRef, useState } from 'react';
import { Database, Settings, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStudents } from '../../hooks/useStudents';
import { useAuth } from '../../hooks/useAuth';
import { apiFetch, getAccessToken } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { AdminSettingsPanel } from './components/AdminSettingsPanel';
import { DataManagementPanel } from './components/DataManagementPanel';
import { SystemSettingsPanel } from './components/SystemSettingsPanel';

type SettingsTab = 'Cấu hình hệ thống' | 'Quản lý dữ liệu' | 'Quản trị';

type PaymentItem = {
  id?: string;
  _id?: string;
  studentId?: string;
  studentName?: string;
  amount?: number;
  date?: string;
  note?: string;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
};

type StudentBackupRecord = {
  id?: string;
  _id?: string;
  name?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  referral?: string;
  birthday?: string;
  idCard?: string;
  rank?: string;
  registrationDate?: string;
  fee?: number;
  address?: string;
  status?: string;
  examId?: string;
  examName?: string;
  examDate?: string;
  exams?: Array<{ id?: string; [key: string]: unknown }>;
  progress?: Record<string, unknown>;
  paymentHistory?: unknown[];
  healthCheckDate?: string;
  healthCheckNotes?: string;
  healthCheckFiles?: unknown[];
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

type ExamBackupRecord = {
  id?: string;
  _id?: string;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  [key: string]: unknown;
};

type VietQrConfig = {
  enabled?: boolean;
  bankId?: string;
  accountNo?: string;
  accountName?: string;
  template?: string;
};

type BackupConfigs = {
  vietqrConfig?: VietQrConfig;
  tuitionStagesConfig?: unknown;
};

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('Cấu hình hệ thống');
  const { students } = useStudents();
  const { user, fetchMe } = useAuth();
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
  const [restoreFileName, setRestoreFileName] = useState('');
  const [restoreFileToConfirm, setRestoreFileToConfirm] = useState<File | null>(null);
  const [showResult, setShowResult] = useState<{ show: boolean; count: number; type: 'Restore' | 'Import' }>({
    show: false,
    count: 0,
    type: 'Restore',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const [vietqrEnabled, setVietqrEnabled] = useState(true);
  const [vietqrBankId, setVietqrBankId] = useState('mbbank');
  const [vietqrAccountNo, setVietqrAccountNo] = useState('');
  const [vietqrAccountName, setVietqrAccountName] = useState('');
  const [vietqrTemplate, setVietqrTemplate] = useState('[Mã HV] - [Họ tên] - Nộp học phí khóa {hang}');
  const [isSavingVietqr, setIsSavingVietqr] = useState(false);

  const [smtpHost, setSmtpHost] = useState(user?.smtpHost || 'smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(user?.smtpPort !== undefined ? String(user.smtpPort) : '587');
  const [smtpSecure, setSmtpSecure] = useState(user?.smtpSecure !== undefined ? user.smtpSecure : false);
  const [smtpUser, setSmtpUser] = useState(user?.smtpUser || '');
  const [smtpPass, setSmtpPass] = useState(user?.smtpPass || '');
  const [smtpFrom, setSmtpFrom] = useState(user?.smtpFrom || '');
  const [smtpSandboxEmail, setSmtpSandboxEmail] = useState(user?.smtpSandboxEmail || '');
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);

  const [smsProvider, setSmsProvider] = useState<'twilio' | 'stringee' | 'tingting'>(user?.smsSettings?.provider || 'tingting');
  const [tingtingApiKey, setTingtingApiKey] = useState(user?.smsSettings?.tingtingApiKey || '');
  const [tingtingSender, setTingtingSender] = useState(user?.smsSettings?.tingtingSender || '');
  const [isSavingSms, setIsSavingSms] = useState(false);
  const [isTestingSms, setIsTestingSms] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const visibleTabs = isAdmin
    ? (['Cấu hình hệ thống', 'Quản lý dữ liệu', 'Quản trị'] as SettingsTab[])
    : (['Cấu hình hệ thống'] as SettingsTab[]);
  const currentTab: SettingsTab = visibleTabs.includes(activeTab) ? activeTab : 'Cấu hình hệ thống';

  useEffect(() => {
    if (!user) return;

    const saved = localStorage.getItem('vietqrConfig');
    const localConfig = saved
      ? JSON.parse(saved)
      : {
          bankId: user.bankId || 'mbbank',
          accountNo: user.bankAccountNo || '',
          accountName: user.bankAccountName || user.displayName || '',
          template: '[Mã HV] - [Họ tên] - Nộp học phí khóa {hang}',
        };

    if (user.bankAccountNo !== undefined) localConfig.accountNo = user.bankAccountNo;
    if (user.bankId) localConfig.bankId = user.bankId;
    if (user.bankAccountName !== undefined) localConfig.accountName = user.bankAccountName;
    localConfig.enabled = user.bankQrEnabled !== false;

    localStorage.setItem('vietqrConfig', JSON.stringify(localConfig));

    const timer = setTimeout(() => {
      setVietqrEnabled(localConfig.enabled);
      setVietqrBankId(localConfig.bankId);
      setVietqrAccountNo(localConfig.accountNo);
      setVietqrAccountName(localConfig.accountName);
      setVietqrTemplate(localConfig.template);
    }, 0);

    return () => clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const timer = setTimeout(() => {
      setSmtpHost(user.smtpHost || 'smtp.gmail.com');
      setSmtpPort(user.smtpPort !== undefined ? String(user.smtpPort) : '587');
      setSmtpSecure(user.smtpSecure !== undefined ? user.smtpSecure : false);
      setSmtpUser(user.smtpUser || '');
      setSmtpPass(user.smtpPass || '');
      setSmtpFrom(user.smtpFrom || '');
      setSmtpSandboxEmail(user.smtpSandboxEmail || '');
      setSmsProvider(user.smsSettings?.provider || 'tingting');
      setTingtingApiKey(user.smsSettings?.tingtingApiKey || '');
      setTingtingSender(user.smsSettings?.tingtingSender || '');
    }, 0);

    return () => clearTimeout(timer);
  }, [user]);

  const ensureAdminAccess = () => {
    if (isAdmin) return true;
    toast.error('Tài khoản nhân viên chỉ được dùng phần Cấu hình hệ thống.');
    return false;
  };

  const handleSaveVietqrConfig = async () => {
    setIsSavingVietqr(true);
    try {
      await apiFetch('/auth/bank-settings', {
        method: 'PATCH',
        body: JSON.stringify({
          bankAccountNo: vietqrAccountNo,
          bankId: vietqrBankId,
          bankAccountName: vietqrAccountName,
          bankQrEnabled: vietqrEnabled,
        }),
      });

      localStorage.setItem(
        'vietqrConfig',
        JSON.stringify({
          enabled: vietqrEnabled,
          bankId: vietqrBankId,
          accountNo: vietqrAccountNo,
          accountName: vietqrAccountName,
          template: vietqrTemplate,
        })
      );

      window.dispatchEvent(new Event('storage'));
      await fetchMe();
      toast.success('Đã lưu cấu hình ngân hàng VietQR thành công!');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error('Lỗi khi lưu cấu hình ngân hàng: ' + message);
    } finally {
      setIsSavingVietqr(false);
    }
  };

  const handleSaveSmtpSettings = async () => {
    setIsSavingSmtp(true);
    try {
      const isConfiguring = smtpUser.trim() !== '' && smtpPass.trim() !== '';
      await apiFetch('/auth/smtp-settings', {
        method: 'PATCH',
        body: JSON.stringify({
          smtpHost: isConfiguring ? smtpHost || 'smtp.gmail.com' : '',
          smtpPort: isConfiguring ? (smtpPort ? parseInt(smtpPort, 10) : 587) : 587,
          smtpSecure: isConfiguring ? smtpSecure : false,
          smtpUser: isConfiguring ? smtpUser.trim() : '',
          smtpPass: isConfiguring ? smtpPass.trim() : '',
          smtpFrom: isConfiguring ? smtpFrom.trim() : '',
          smtpSandboxEmail: isConfiguring ? smtpSandboxEmail.trim() : '',
        }),
      });
      await fetchMe();
      toast.success('Đã lưu cấu hình máy chủ SMTP thành công!');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Lỗi không xác định.';
      toast.error('Lỗi khi lưu cấu hình SMTP: ' + message);
    } finally {
      setIsSavingSmtp(false);
    }
  };

  const handleTestSmtpConnection = async () => {
    setIsTestingSmtp(true);
    try {
      const response = await apiFetch('/send-email', {
        method: 'POST',
        body: JSON.stringify({ check: true }),
      });

      if (response.success && response.status === 'Ready') {
        toast.success('Kết nối SMTP thành công! Máy chủ đã sẵn sàng.');
      } else {
        toast.error('Kết nối SMTP thất bại: ' + (response.error || 'Lỗi không xác định.'));
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Lỗi không xác định.';
      toast.error('Lỗi kết nối SMTP: ' + message);
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handleSaveSmsSettings = async () => {
    setIsSavingSms(true);
    try {
      await apiFetch('/auth/sms-settings', {
        method: 'PATCH',
        body: JSON.stringify({
          provider: smsProvider,
          tingtingApiKey,
          tingtingSender,
        }),
      });
      await fetchMe();
      toast.success('Đã lưu cấu hình SMS thành công!');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Lỗi không xác định.';
      toast.error('Lỗi khi lưu cấu hình SMS: ' + message);
    } finally {
      setIsSavingSms(false);
    }
  };

  const handleTestSmsConnection = async () => {
    setIsTestingSms(true);
    try {
      const token = getAccessToken();
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ check: true }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.status === 'Ready') {
          toast.success(`Kết nối TingTing thành công! (Nguồn: ${data.source === 'tenant' ? 'Cấu hình riêng' : 'Mặc định hệ thống'})`);
        } else {
          toast.error('Kiểm tra TingTing thất bại: ' + (data.error || 'Lỗi phản hồi'));
        }
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error('Kiểm tra TingTing thất bại: ' + (data.error || 'Lỗi HTTP ' + response.status));
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Lỗi không xác định.';
      toast.error('Lỗi kết nối TingTing: ' + message);
    } finally {
      setIsTestingSms(false);
    }
  };

  const tabs: { id: SettingsTab; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
    { id: 'Cấu hình hệ thống', icon: Settings, label: 'Cấu hình hệ thống' },
    { id: 'Quản lý dữ liệu', icon: Database, label: 'Quản lý dữ liệu' },
    { id: 'Quản trị', icon: ShieldCheck, label: 'Quản trị' },
  ];
  const allowedTabs = tabs.filter((tab) => visibleTabs.includes(tab.id));

  const handleBackup = async () => {
    if (!ensureAdminAccess()) return;

    setIsProcessing(true);
    setProgress({ current: 0, total: 3, message: 'Đang chuẩn bị sao lưu...' });

    try {
      setProgress({ current: 0, total: 3, message: 'Đang tải danh sách kỳ thi...' });
      const examsRes = await apiFetch('/exams', { params: { limit: 1000 } });
      const exams = examsRes.exams || [];

      setProgress({ current: 1, total: 3, message: 'Đang tải danh sách giao dịch...' });
      const paymentsRes = await apiFetch('/payments', { params: { limit: 1000 } });
      const payments = paymentsRes.payments || [];

      setProgress({ current: 2, total: 3, message: 'Đang chuẩn bị file backup...' });
      const backupData = {
        version: '2.0',
        timestamp: new Date().toISOString(),
        students,
        exams,
        payments,
        configs: {
          vietqrConfig: JSON.parse(localStorage.getItem('vietqrConfig') || '{}'),
          tuitionStagesConfig: JSON.parse(localStorage.getItem('tuitionStagesConfig') || '{}'),
        },
      };

      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_toanbo_hethong_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Đã xuất bản sao lưu hệ thống toàn bộ thành công!');
    } catch (error) {
      console.error('Backup error:', error);
      toast.error('Lỗi khi tạo bản sao lưu.');
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerRestore = () => {
    if (!ensureAdminAccess()) return;
    if (!user) {
      toast.warning('Vui lòng đăng nhập để thực hiện chức năng này.');
      return;
    }
    restoreInputRef.current?.click();
  };

  const handleRestoreFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!ensureAdminAccess()) return;
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setRestoreFileToConfirm(file);
  };

  const executeRestore = async (file: File) => {
    if (!ensureAdminAccess()) return;
    setRestoreFileToConfirm(null);
    setRestoreFileName(file.name);
    setIsProcessing(true);
    setProgress({ current: 0, total: 0, message: 'Đang đọc file...' });

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const jsonData = JSON.parse(content);

        let studentsList: StudentBackupRecord[] = [];
        let examsList: ExamBackupRecord[] = [];
        let paymentsList: PaymentItem[] = [];
        let configsObj: BackupConfigs | null = null;

        if (Array.isArray(jsonData)) {
          studentsList = jsonData;
        } else if (jsonData && typeof jsonData === 'object') {
          studentsList = jsonData.students || [];
          examsList = jsonData.exams || [];
          paymentsList = jsonData.payments || [];
          configsObj = jsonData.configs || null;
        } else {
          throw new Error('Định dạng file backup không hợp lệ.');
        }

        if (studentsList.length > 0) {
          const first = studentsList[0];
          if (!first.fullName && !first.name) {
            throw new Error('Cấu trúc học viên trong file không hợp lệ.');
          }
        }

        setProgress({ current: 0, total: 3, message: 'Đang xóa sạch giao dịch cũ...' });
        const currentPaymentsRes = await apiFetch('/payments', { params: { limit: 1000 } });
        const currentPayments = currentPaymentsRes.payments || [];
        let delPayCount = 0;
        for (const payment of currentPayments) {
          await apiFetch(`/payments/${payment._id || payment.id}`, { method: 'DELETE' });
          delPayCount++;
          setProgress({ current: delPayCount, total: currentPayments.length, message: `Xóa giao dịch cũ: ${delPayCount}/${currentPayments.length}` });
        }

        setProgress({ current: 0, total: 3, message: 'Đang xóa sạch kỳ thi cũ...' });
        const currentExamsRes = await apiFetch('/exams', { params: { limit: 1000 } });
        const currentExams = currentExamsRes.exams || [];
        let delExamCount = 0;
        for (const exam of currentExams) {
          await apiFetch(`/exams/${exam._id || exam.id}`, { method: 'DELETE' });
          delExamCount++;
          setProgress({ current: delExamCount, total: currentExams.length, message: `Xóa kỳ thi cũ: ${delExamCount}/${currentExams.length}` });
        }

        setProgress({ current: 0, total: 3, message: 'Đang xóa sạch học viên cũ...' });
        const currentStudentsRes = await apiFetch('/students', { params: { limit: 1000 } });
        const currentStudents = currentStudentsRes.students || [];
        let delStudCount = 0;
        for (const student of currentStudents) {
          await apiFetch(`/students/${student._id || student.id}`, { method: 'DELETE' });
          delStudCount++;
          setProgress({ current: delStudCount, total: currentStudents.length, message: `Xóa học viên cũ: ${delStudCount}/${currentStudents.length}` });
        }

        setProgress({ current: 0, total: examsList.length || 1, message: 'Đang khôi phục danh sách kỳ thi...' });
        const examIdMap: Record<string, string> = {};
        let addedExamCount = 0;
        for (const examItem of examsList) {
          const oldExamId = examItem._id || examItem.id;
          const cleanExam = { ...examItem };
          delete cleanExam.id;
          delete cleanExam._id;
          delete cleanExam.ownerId;
          delete cleanExam.createdAt;
          delete cleanExam.updatedAt;
          delete cleanExam.__v;

          const createExamRes = await apiFetch('/exams', {
            method: 'POST',
            body: JSON.stringify(cleanExam),
          });

          if (createExamRes.success && createExamRes.data) {
            const newExamId = createExamRes.data._id || createExamRes.data.id;
            if (oldExamId && newExamId) {
              examIdMap[oldExamId] = newExamId;
            }
          }

          addedExamCount++;
          setProgress({ current: addedExamCount, total: examsList.length, message: `Khôi phục kỳ thi: ${addedExamCount}/${examsList.length}` });
        }

        setProgress({ current: 0, total: studentsList.length || 1, message: 'Đang khôi phục danh sách học viên...' });
        const studentIdMap: Record<string, string> = {};
        let addedStudCount = 0;

        for (const studentItem of studentsList) {
          const oldStudentId = studentItem._id || studentItem.id;
          const cleanData = { ...studentItem };
          delete cleanData.id;
          delete cleanData._id;
          delete cleanData.ownerId;
          delete cleanData.createdAt;
          delete cleanData.updatedAt;

          if (cleanData.examId && examIdMap[cleanData.examId]) {
            cleanData.examId = examIdMap[cleanData.examId];
          }
          if (Array.isArray(cleanData.exams)) {
            cleanData.exams = cleanData.exams.map((exam: { id: string; [key: string]: unknown }) =>
              exam.id && examIdMap[exam.id] ? { ...exam, id: examIdMap[exam.id] } : exam
            );
          }

          const createRes = await apiFetch('/students', {
            method: 'POST',
            body: JSON.stringify({
              fullName: cleanData.fullName || cleanData.name,
              phone: cleanData.phone,
              email: cleanData.email || '',
              referral: cleanData.referral || '',
              birthday: cleanData.birthday || '',
              idCard: cleanData.idCard || '',
              rank: cleanData.rank,
              registrationDate: cleanData.registrationDate,
              fee: cleanData.fee,
              address: cleanData.address || '',
              status: cleanData.status,
            }),
          });

          if (createRes.success && createRes.data) {
            const newId = createRes.data._id || createRes.data.id;
            if (oldStudentId && newId) {
              studentIdMap[oldStudentId] = newId;
            }

            if (cleanData.progress && typeof cleanData.progress === 'object') {
              const cleanProgress = { ...cleanData.progress } as Record<string, unknown>;
              delete cleanProgress._id;
              delete cleanProgress.id;
              for (const key of ['theory', 'practice', 'cabin', 'dat', 'sim']) {
                const subProgress = cleanProgress[key];
                if (subProgress && typeof subProgress === 'object') {
                  const cleanSub = { ...subProgress } as Record<string, unknown>;
                  delete cleanSub._id;
                  delete cleanSub.id;
                  cleanProgress[key] = cleanSub;
                }
              }
              cleanData.progress = cleanProgress;
            }

            if (Array.isArray(cleanData.healthCheckFiles)) {
              cleanData.healthCheckFiles = cleanData.healthCheckFiles.map((healthFile: unknown) => {
                if (healthFile && typeof healthFile === 'object') {
                  const cleanFile = { ...healthFile } as Record<string, unknown>;
                  delete cleanFile._id;
                  delete cleanFile.id;
                  return cleanFile;
                }
                return healthFile;
              });
            }

            await apiFetch(`/students/${newId}`, {
              method: 'PATCH',
              body: JSON.stringify({
                healthCheckDate: cleanData.healthCheckDate || '',
                healthCheckNotes: cleanData.healthCheckNotes || '',
                healthCheckFiles: cleanData.healthCheckFiles || [],
                progress: cleanData.progress,
                exams: cleanData.exams,
                paymentHistory: [],
                examId: cleanData.examId || '',
                examName: cleanData.examName || '',
                examDate: cleanData.examDate || '',
              }),
            });
          }

          addedStudCount++;
          setProgress({ current: addedStudCount, total: studentsList.length, message: `Khôi phục học viên: ${addedStudCount}/${studentsList.length}` });
        }

        setProgress({ current: 0, total: paymentsList.length || 1, message: 'Đang khôi phục lịch sử giao dịch...' });
        let addedPayCount = 0;
        for (const paymentItem of paymentsList) {
          const cleanPay = { ...paymentItem };
          delete cleanPay.id;
          delete cleanPay._id;
          delete cleanPay.ownerId;
          delete cleanPay.createdAt;
          delete cleanPay.updatedAt;

          if (cleanPay.studentId && studentIdMap[cleanPay.studentId]) {
            cleanPay.studentId = studentIdMap[cleanPay.studentId];
            await apiFetch('/payments', {
              method: 'POST',
              body: JSON.stringify({
                studentId: cleanPay.studentId,
                studentName: cleanPay.studentName,
                amount: cleanPay.amount,
                date: cleanPay.date,
                note: cleanPay.note || '',
              }),
            });
          }

          addedPayCount++;
          setProgress({ current: addedPayCount, total: paymentsList.length, message: `Khôi phục giao dịch: ${addedPayCount}/${paymentsList.length}` });
        }

        if (configsObj?.vietqrConfig) {
          const cfg = configsObj.vietqrConfig;
          localStorage.setItem('vietqrConfig', JSON.stringify(cfg));
          if (cfg.enabled !== undefined) setVietqrEnabled(cfg.enabled);
          if (cfg.bankId !== undefined) setVietqrBankId(cfg.bankId);
          if (cfg.accountNo !== undefined) setVietqrAccountNo(cfg.accountNo);
          if (cfg.accountName !== undefined) setVietqrAccountName(cfg.accountName);
          if (cfg.template !== undefined) setVietqrTemplate(cfg.template);

          try {
            await apiFetch('/auth/bank-settings', {
              method: 'PATCH',
              body: JSON.stringify({
                bankAccountNo: cfg.accountNo || '',
                bankId: cfg.bankId || '',
                bankAccountName: cfg.accountName || '',
                bankQrEnabled: cfg.enabled !== false,
              }),
            });
            await fetchMe();
          } catch (syncError) {
            console.error('Lỗi đồng bộ cấu hình VietQR lên server sau khi khôi phục:', syncError);
          }
        }

        if (configsObj?.tuitionStagesConfig) {
          localStorage.setItem('tuitionStagesConfig', JSON.stringify(configsObj.tuitionStagesConfig));
        }

        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('student-mutation'));
        window.dispatchEvent(new Event('payment-mutation'));
        window.dispatchEvent(new Event('exam-mutation'));
        setShowResult({ show: true, count: addedStudCount, type: 'Restore' });
      } catch (error: unknown) {
        console.error('>>> [RESTORE ERROR]:', error);
        const message = error instanceof Error ? error.message : 'Đã xảy ra lỗi.';
        toast.error('Lỗi: ' + message);
      } finally {
        setIsProcessing(false);
        setRestoreFileName('');
        if (restoreInputRef.current) restoreInputRef.current.value = '';
      }
    };

    reader.readAsText(file);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!ensureAdminAccess()) return;
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsProcessing(true);
    setProgress({ current: 0, total: 0, message: 'Đang chuẩn bị nhập dữ liệu...' });

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const jsonData = JSON.parse(event.target?.result as string);
          let studentsList: StudentBackupRecord[] = [];

          if (Array.isArray(jsonData)) {
            studentsList = jsonData;
          } else if (jsonData && typeof jsonData === 'object') {
            studentsList = jsonData.students || [];
          } else {
            throw new Error('File không đúng cấu hình.');
          }

          const total = studentsList.length;
          let addedCount = 0;

          for (const item of studentsList) {
            const cleanData = { ...item };
            delete cleanData.id;
            delete cleanData._id;
            delete cleanData.ownerId;
            delete cleanData.createdAt;
            delete cleanData.updatedAt;

            const createRes = await apiFetch('/students', {
              method: 'POST',
              body: JSON.stringify({
                fullName: cleanData.fullName || cleanData.name,
                phone: cleanData.phone,
                email: cleanData.email || '',
                referral: cleanData.referral || '',
                birthday: cleanData.birthday || '',
                idCard: cleanData.idCard || '',
                rank: cleanData.rank,
                registrationDate: cleanData.registrationDate,
                fee: cleanData.fee,
                address: cleanData.address || '',
                status: cleanData.status,
              }),
            });

            if (createRes.success && createRes.data) {
              const newId = createRes.data._id || createRes.data.id;

              if (cleanData.progress && typeof cleanData.progress === 'object') {
                const cleanProgress = { ...cleanData.progress } as Record<string, unknown>;
                delete cleanProgress._id;
                delete cleanProgress.id;
                for (const key of ['theory', 'practice', 'cabin', 'dat', 'sim']) {
                  const subProgress = cleanProgress[key];
                  if (subProgress && typeof subProgress === 'object') {
                    const cleanSub = { ...subProgress } as Record<string, unknown>;
                    delete cleanSub._id;
                    delete cleanSub.id;
                    cleanProgress[key] = cleanSub;
                  }
                }
                cleanData.progress = cleanProgress;
              }

              if (Array.isArray(cleanData.healthCheckFiles)) {
                cleanData.healthCheckFiles = cleanData.healthCheckFiles.map((healthFile: unknown) => {
                  if (healthFile && typeof healthFile === 'object') {
                    const cleanFile = { ...healthFile } as Record<string, unknown>;
                    delete cleanFile._id;
                    delete cleanFile.id;
                    return cleanFile;
                  }
                  return healthFile;
                });
              }

              await apiFetch(`/students/${newId}`, {
                method: 'PATCH',
                body: JSON.stringify({
                  healthCheckDate: cleanData.healthCheckDate || '',
                  healthCheckNotes: cleanData.healthCheckNotes || '',
                  healthCheckFiles: cleanData.healthCheckFiles || [],
                  progress: cleanData.progress,
                  exams: cleanData.exams,
                  paymentHistory: cleanData.paymentHistory,
                  examId: cleanData.examId || '',
                  examName: cleanData.examName || '',
                  examDate: cleanData.examDate || '',
                }),
              });
            }

            addedCount++;
            if (addedCount % 2 === 0 || addedCount === total) {
              setProgress({ current: addedCount, total, message: `Đang nhập thêm: ${addedCount}/${total}` });
            }
          }

          setShowResult({ show: true, count: addedCount, type: 'Import' });
          window.dispatchEvent(new Event('student-mutation'));
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Đã xảy ra lỗi.';
          toast.error('Lỗi: ' + message);
        } finally {
          setIsProcessing(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };

      reader.readAsText(file);
    } catch {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Cài đặt & Quản trị</h1>
          <p className="text-slate-400 text-sm font-medium mt-1">Quản lý cấu hình toàn bộ hệ thống và dữ liệu vận hành</p>
        </div>
      </div>

      <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 rounded-2xl w-fit">
        {allowedTabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all duration-300',
              activeTab === tab.id ? 'bg-white text-cyan-600 shadow-sm shadow-cyan-100' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            )}
          >
            <tab.icon className={cn('w-4 h-4', activeTab === tab.id ? 'text-cyan-600' : 'text-slate-400')} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {currentTab === 'Cấu hình hệ thống' && (
          <SystemSettingsPanel
            isAdmin={isAdmin}
            vietqrEnabled={vietqrEnabled}
            setVietqrEnabled={setVietqrEnabled}
            vietqrBankId={vietqrBankId}
            setVietqrBankId={setVietqrBankId}
            vietqrAccountNo={vietqrAccountNo}
            setVietqrAccountNo={setVietqrAccountNo}
            vietqrAccountName={vietqrAccountName}
            setVietqrAccountName={setVietqrAccountName}
            vietqrTemplate={vietqrTemplate}
            setVietqrTemplate={setVietqrTemplate}
            isSavingVietqr={isSavingVietqr}
            onSaveVietqr={handleSaveVietqrConfig}
            smtpHost={smtpHost}
            setSmtpHost={setSmtpHost}
            smtpPort={smtpPort}
            setSmtpPort={setSmtpPort}
            smtpSecure={smtpSecure}
            setSmtpSecure={setSmtpSecure}
            smtpUser={smtpUser}
            setSmtpUser={setSmtpUser}
            smtpPass={smtpPass}
            setSmtpPass={setSmtpPass}
            smtpFrom={smtpFrom}
            setSmtpFrom={setSmtpFrom}
            smtpSandboxEmail={smtpSandboxEmail}
            setSmtpSandboxEmail={setSmtpSandboxEmail}
            isSavingSmtp={isSavingSmtp}
            isTestingSmtp={isTestingSmtp}
            onSaveSmtp={handleSaveSmtpSettings}
            onTestSmtp={handleTestSmtpConnection}
            smsProvider={smsProvider}
            setSmsProvider={setSmsProvider}
            tingtingApiKey={tingtingApiKey}
            setTingtingApiKey={setTingtingApiKey}
            tingtingSender={tingtingSender}
            setTingtingSender={setTingtingSender}
            isSavingSms={isSavingSms}
            isTestingSms={isTestingSms}
            onSaveSms={handleSaveSmsSettings}
            onTestSms={handleTestSmsConnection}
          />
        )}

        {currentTab === 'Quản lý dữ liệu' && (
          <DataManagementPanel
            isProcessing={isProcessing}
            progress={progress}
            showResult={showResult}
            setShowResult={setShowResult}
            restoreFileToConfirm={restoreFileToConfirm}
            setRestoreFileToConfirm={setRestoreFileToConfirm}
            restoreInputRef={restoreInputRef}
            restoreFileName={restoreFileName}
            setRestoreFileName={setRestoreFileName}
            fileInputRef={fileInputRef}
            onBackup={handleBackup}
            onImport={handleImport}
            onTriggerRestore={triggerRestore}
            onRestoreFileSelected={handleRestoreFileSelected}
            onExecuteRestore={executeRestore}
          />
        )}

        {currentTab === 'Quản trị' && <AdminSettingsPanel />}
      </div>
    </div>
  );
}
