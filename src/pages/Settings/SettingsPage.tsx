import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Settings, QrCode, ClipboardList, Database,
  CreditCard, Plus, Edit2, Trash2,
  CheckCircle2, Info, ShieldCheck, Download, Upload,
  FileJson, RotateCcw, ToggleLeft, ToggleRight, Activity,
  Mail, Loader2, Smartphone
} from 'lucide-react';
import { cn, getVietQRBankCode } from '../../lib/utils';
import { useStudents } from '../../hooks/useStudents';
import { useAuth } from '../../hooks/useAuth';
import { apiFetch, getAccessToken } from '../../lib/api';
import { useToast } from '../../hooks/useToast';

type SettingsTab = 'Cấu hình hệ thống' | 'Quản lý dữ liệu' | 'Quản trị';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('Cấu hình hệ thống');
  const { students } = useStudents();
  const { user, fetchMe } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
  const [restoreFileName, setRestoreFileName] = useState<string>('');
  const [restoreFileToConfirm, setRestoreFileToConfirm] = useState<File | null>(null);
  const [showResult, setShowResult] = useState<{ show: boolean, count: number, type: 'Restore' | 'Import' }>({ show: false, count: 0, type: 'Restore' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const [requiredFields, setRequiredFields] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('requiredFieldsConfig');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing requiredFieldsConfig", e);
      }
    }
    return {
      fullName: true,
      phone: true,
      rank: false, // Hạng bằng lái xe — tùy chọn, ngành khác để trống
      birthday: false,
      idCard: false,
      email: false
    };
  });

  const fieldMapping = [
    { label: 'Họ và tên', key: 'fullName' },
    { label: 'Số điện thoại', key: 'phone' },
    { label: 'Hạng bằng (lái xe — tùy chọn)', key: 'rank' },
    { label: 'Ngày sinh', key: 'birthday' },
    { label: 'CCCD/CMND', key: 'idCard' },
    { label: 'Email', key: 'email' }
  ];

  const toggleRequiredField = (key: string) => {
    const updated = {
      ...requiredFields,
      [key]: !requiredFields[key]
    };
    setRequiredFields(updated);
    localStorage.setItem('requiredFieldsConfig', JSON.stringify(updated));
    toast.success(`Đã cập nhật cấu hình trường bắt buộc`);
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const [vietqrEnabled, setVietqrEnabled] = useState(true);
  const [vietqrBankId, setVietqrBankId] = useState('mbbank');
  const [vietqrAccountNo, setVietqrAccountNo] = useState('');
  const [vietqrAccountName, setVietqrAccountName] = useState('');
  const [vietqrTemplate, setVietqrTemplate] = useState('[Mã HV] - [Họ tên] - Nộp học phí khóa {hang}');
  const [isSavingVietqr, setIsSavingVietqr] = useState(false);

  // Đồng bộ cấu hình từ Backend về LocalStorage. "enabled" luôn lấy từ backend
  // (bankQrEnabled) để tránh bị "kẹt" theo giá trị cũ lưu cục bộ trên trình duyệt.
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem('vietqrConfig');
      const localConfig = saved ? JSON.parse(saved) : {
        bankId: user.bankId || 'mbbank',
        accountNo: user.bankAccountNo || '',
        accountName: user.bankAccountName || user.displayName || '',
        template: '[Mã HV] - [Họ tên] - Nộp học phí khóa {hang}'
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
    }
  }, [user]);

  const handleSaveVietqrConfig = async () => {
    setIsSavingVietqr(true);
    try {
      await apiFetch('/auth/bank-settings', {
        method: 'PATCH',
        body: JSON.stringify({
          bankAccountNo: vietqrAccountNo,
          bankId: vietqrBankId,
          bankAccountName: vietqrAccountName,
          bankQrEnabled: vietqrEnabled
        })
      });
      localStorage.setItem('vietqrConfig', JSON.stringify({
        enabled: vietqrEnabled,
        bankId: vietqrBankId,
        accountNo: vietqrAccountNo,
        accountName: vietqrAccountName,
        template: vietqrTemplate
      }));
      window.dispatchEvent(new Event('storage'));
      await fetchMe();
      toast.success("Đã lưu cấu hình ngân hàng VietQR thành công!");
    } catch (e: unknown) {
      console.error("Lỗi đồng bộ cấu hình ngân hàng lên server:", e);
      const errMsg = e instanceof Error ? e.message : String(e);
      toast.error("Lỗi khi lưu cấu hình ngân hàng: " + errMsg);
    } finally {
      setIsSavingVietqr(false);
    }
  };

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
  useEffect(() => {
    if (user) {
      setTimeout(() => {
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
    }
  }, [user]);

  const handleSaveSmtpSettings = async () => {
    setIsSavingSmtp(true);
    try {
      const isConfiguring = smtpUser.trim() !== '' && smtpPass.trim() !== '';
      await apiFetch('/auth/smtp-settings', {
        method: 'PATCH',
        body: JSON.stringify({
          smtpHost: isConfiguring ? (smtpHost || 'smtp.gmail.com') : '',
          smtpPort: isConfiguring ? (smtpPort ? parseInt(smtpPort, 10) : 587) : 587,
          smtpSecure: isConfiguring ? smtpSecure : false,
          smtpUser: isConfiguring ? smtpUser.trim() : '',
          smtpPass: isConfiguring ? smtpPass.trim() : '',
          smtpFrom: isConfiguring ? smtpFrom.trim() : '',
          smtpSandboxEmail: isConfiguring ? smtpSandboxEmail.trim() : ''
        })
      });
      await fetchMe();
      toast.success('Đã lưu cấu hình máy chủ SMTP thành công!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định.';
      toast.error('Lỗi khi lưu cấu hình SMTP: ' + msg);
    } finally {
      setIsSavingSmtp(false);
    }
  };

  const handleTestSmtpConnection = async () => {
    setIsTestingSmtp(true);
    try {
      const res = await apiFetch('/send-email', {
        method: 'POST',
        body: JSON.stringify({ check: true })
      });
      if (res.success && res.status === 'Ready') {
        toast.success('Kết nối SMTP thành công! Máy chủ đã sẵn sàng.');
      } else {
        toast.error('Kết nối SMTP thất bại: ' + (res.error || 'Lỗi không xác định.'));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định.';
      toast.error('Lỗi kết nối SMTP: ' + msg);
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
        })
      });
      await fetchMe();
      toast.success('Đã lưu cấu hình SMS thành công!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định.';
      toast.error('Lỗi khi lưu cấu hình SMS: ' + msg);
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
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ check: true })
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định.';
      toast.error('Lỗi kết nối TingTing: ' + msg);
    } finally {
      setIsTestingSms(false);
    }
  };



  const tabs: { id: SettingsTab; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
    { id: 'Cấu hình hệ thống', icon: Settings, label: 'Cấu hình hệ thống' },
    { id: 'Quản lý dữ liệu', icon: Database, label: 'Quản lý dữ liệu' },
    { id: 'Quản trị', icon: ShieldCheck, label: 'Quản trị' },
  ];

  // Backup data
  const handleBackup = async () => {
    setIsProcessing(true);
    setProgress({ current: 0, total: 3, message: 'Đang chuẩn bị sao lưu...' });
    
    try {
      // 1. Fetch all exams
      setProgress({ current: 0, total: 3, message: 'Đang tải danh sách kỳ thi...' });
      const examsRes = await apiFetch('/exams', { params: { limit: 1000 } });
      const exams = examsRes.exams || [];

      // 2. Fetch all payments
      setProgress({ current: 1, total: 3, message: 'Đang tải danh sách giao dịch...' });
      const paymentsRes = await apiFetch('/payments', { params: { limit: 1000 } });
      const payments = paymentsRes.payments || [];

      // 3. System configs
      setProgress({ current: 2, total: 3, message: 'Đang chuẩn bị file backup...' });
      
      const backupData = {
        version: "2.0",
        timestamp: new Date().toISOString(),
        students,
        exams,
        payments,
        configs: {
          requiredFieldsConfig: JSON.parse(localStorage.getItem('requiredFieldsConfig') || '{}'),
          vietqrConfig: JSON.parse(localStorage.getItem('vietqrConfig') || '{}'),
          tuitionStagesConfig: JSON.parse(localStorage.getItem('tuitionStagesConfig') || '{}')
        }
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
      toast.success("Đã xuất bản sao lưu hệ thống toàn bộ thành công!");
    } catch (e) {
      console.error("Backup error:", e);
      toast.error("Lỗi khi tạo bản sao lưu.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Pre-confirm before opening file picker
  const triggerRestore = () => {
    if (!user) {
      toast.warning("Vui lòng đăng nhập để thực hiện chức năng này.");
      return;
    }
    // Mở folder chọn file trực tiếp để đảm bảo tính tương tác cao nhất
    restoreInputRef.current?.click();
  };

  // Restore file selection
  const handleRestoreFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setRestoreFileToConfirm(file);
  };

  // Restore data execution
  const executeRestore = async (file: File) => {
    setRestoreFileToConfirm(null);
    setRestoreFileName(file.name);
    console.log(">>> [RESTORE] File selected:", file.name);

    setIsProcessing(true);
    setProgress({ current: 0, total: 0, message: 'Đang đọc file...' });

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const jsonData = JSON.parse(content);

        let studentsList = [];
        let examsList = [];
        let paymentsList: {
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
        }[] = [];
        let configsObj: {
          requiredFieldsConfig?: Record<string, boolean>;
          vietqrConfig?: {
            enabled: boolean;
            bankId: string;
            accountNo: string;
            accountName: string;
            template: string;
          };
          tuitionStagesConfig?: unknown;
        } | null = null;

        if (Array.isArray(jsonData)) {
          // Backward compatibility for old student-only array backup format
          studentsList = jsonData;
        } else if (jsonData && typeof jsonData === 'object') {
          studentsList = jsonData.students || [];
          examsList = jsonData.exams || [];
          paymentsList = jsonData.payments || [];
          configsObj = jsonData.configs || null;
        } else {
          throw new Error("Định dạng file backup không hợp lệ.");
        }

        if (studentsList.length > 0) {
          const first = studentsList[0];
          if (!first.fullName && !first.name) {
            throw new Error("Cấu trúc học viên trong file không hợp lệ.");
          }
        }

        // Step 1: Delete all current payments
        setProgress({ current: 0, total: 3, message: 'Đang xóa sạch giao dịch cũ...' });
        const currentPaymentsRes = await apiFetch('/payments', { params: { limit: 1000 } });
        const currentPayments = currentPaymentsRes.payments || [];
        let delPayCount = 0;
        for (const p of currentPayments) {
          await apiFetch(`/payments/${p._id || p.id}`, { method: 'DELETE' });
          delPayCount++;
          setProgress({ current: delPayCount, total: currentPayments.length, message: `Xóa giao dịch cũ: ${delPayCount}/${currentPayments.length}` });
        }

        // Step 2: Delete all current exams
        setProgress({ current: 0, total: 3, message: 'Đang xóa sạch kỳ thi cũ...' });
        const currentExamsRes = await apiFetch('/exams', { params: { limit: 1000 } });
        const currentExams = currentExamsRes.exams || [];
        let delExamCount = 0;
        for (const ex of currentExams) {
          await apiFetch(`/exams/${ex._id || ex.id}`, { method: 'DELETE' });
          delExamCount++;
          setProgress({ current: delExamCount, total: currentExams.length, message: `Xóa kỳ thi cũ: ${delExamCount}/${currentExams.length}` });
        }

        // Step 3: Delete all current students
        setProgress({ current: 0, total: 3, message: 'Đang xóa sạch học viên cũ...' });
        const currentStudentsRes = await apiFetch('/students', { params: { limit: 1000 } });
        const currentStudents = currentStudentsRes.students || [];
        let delStudCount = 0;
        for (const s of currentStudents) {
          await apiFetch(`/students/${s._id || s.id}`, { method: 'DELETE' });
          delStudCount++;
          setProgress({ current: delStudCount, total: currentStudents.length, message: `Xóa học viên cũ: ${delStudCount}/${currentStudents.length}` });
        }

        // Step 4: Recreate exam sessions and map IDs
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
            body: JSON.stringify(cleanExam)
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

        // Step 5: Recreate students and map IDs
        setProgress({ current: 0, total: studentsList.length || 1, message: 'Đang khôi phục danh sách học viên...' });
        const studentIdMap: Record<string, string> = {};
        let addedStudCount = 0;
        for (const studItem of studentsList) {
          const oldStudentId = studItem._id || studItem.id;
          const cleanData = { ...studItem };
          delete cleanData.id;
          delete cleanData._id;
          delete cleanData.ownerId;
          delete cleanData.createdAt;
          delete cleanData.updatedAt;

          // Map old exam ID to new exam ID
          if (cleanData.examId && examIdMap[cleanData.examId]) {
            cleanData.examId = examIdMap[cleanData.examId];
          }
          if (Array.isArray(cleanData.exams)) {
            cleanData.exams = cleanData.exams.map((exItem: { id: string; [key: string]: unknown }) => {
              if (exItem.id && examIdMap[exItem.id]) {
                return { ...exItem, id: examIdMap[exItem.id] };
              }
              return exItem;
            });
          }

          const createFields = {
            fullName: cleanData.fullName || cleanData.name,
            phone: cleanData.phone,
            email: cleanData.email || "",
            referral: cleanData.referral || "",
            birthday: cleanData.birthday || "",
            idCard: cleanData.idCard || "",
            rank: cleanData.rank,
            registrationDate: cleanData.registrationDate,
            fee: cleanData.fee,
            address: cleanData.address || "",
            status: cleanData.status,
          };

          const createRes = await apiFetch('/students', {
            method: 'POST',
            body: JSON.stringify(createFields),
          });

          if (createRes.success && createRes.data) {
            const newId = createRes.data._id || createRes.data.id;
            if (oldStudentId && newId) {
              studentIdMap[oldStudentId] = newId;
            }

            // Clean progress (strip _id)
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

            // Clean healthCheckFiles (strip _id)
            if (Array.isArray(cleanData.healthCheckFiles)) {
              cleanData.healthCheckFiles = cleanData.healthCheckFiles.map((file: unknown) => {
                if (file && typeof file === 'object') {
                  const cleanFile = { ...file } as Record<string, unknown>;
                  delete cleanFile._id;
                  delete cleanFile.id;
                  return cleanFile;
                }
                return file;
              });
            }

            // We patch other fields. Note: clear payment history initially
            // so that step 6 (payments creation) can dynamically increment it correctly.
            const updateFields = {
              healthCheckDate: cleanData.healthCheckDate || "",
              healthCheckNotes: cleanData.healthCheckNotes || "",
              healthCheckFiles: cleanData.healthCheckFiles || [],
              progress: cleanData.progress,
              exams: cleanData.exams,
              paymentHistory: [],
              examId: cleanData.examId || "",
              examName: cleanData.examName || "",
              examDate: cleanData.examDate || "",
            };

            await apiFetch(`/students/${newId}`, {
              method: 'PATCH',
              body: JSON.stringify(updateFields),
            });
          }
          addedStudCount++;
          setProgress({ current: addedStudCount, total: studentsList.length, message: `Khôi phục học viên: ${addedStudCount}/${studentsList.length}` });
        }

        // Step 6: Recreate payments and link to new students
        setProgress({ current: 0, total: paymentsList.length || 1, message: 'Đang khôi phục lịch sử giao dịch...' });
        let addedPayCount = 0;
        for (const payItem of paymentsList) {
          const cleanPay = { ...payItem };
          delete cleanPay.id;
          delete cleanPay._id;
          delete cleanPay.ownerId;
          delete cleanPay.createdAt;
          delete cleanPay.updatedAt;

          // Map old studentId to new studentId
          if (cleanPay.studentId && studentIdMap[cleanPay.studentId]) {
            cleanPay.studentId = studentIdMap[cleanPay.studentId];

            // Recreate the transaction record
            await apiFetch('/payments', {
              method: 'POST',
              body: JSON.stringify({
                studentId: cleanPay.studentId,
                studentName: cleanPay.studentName,
                amount: cleanPay.amount,
                date: cleanPay.date,
                note: cleanPay.note || ""
              })
            });
          }
          addedPayCount++;
          setProgress({ current: addedPayCount, total: paymentsList.length, message: `Khôi phục giao dịch: ${addedPayCount}/${paymentsList.length}` });
        }

        // Step 7: Restore local configurations
        if (configsObj) {
          if (configsObj.requiredFieldsConfig) {
            localStorage.setItem('requiredFieldsConfig', JSON.stringify(configsObj.requiredFieldsConfig));
            setRequiredFields(configsObj.requiredFieldsConfig);
          }
          if (configsObj.vietqrConfig) {
            localStorage.setItem('vietqrConfig', JSON.stringify(configsObj.vietqrConfig));
            const cfg = configsObj.vietqrConfig;
            if (cfg.enabled !== undefined) setVietqrEnabled(cfg.enabled);
            if (cfg.bankId !== undefined) setVietqrBankId(cfg.bankId);
            if (cfg.accountNo !== undefined) setVietqrAccountNo(cfg.accountNo);
            if (cfg.accountName !== undefined) setVietqrAccountName(cfg.accountName);
            if (cfg.template !== undefined) setVietqrTemplate(cfg.template);
            // Đồng bộ luôn xuống backend để tránh lệch với bankQrEnabled đã lưu ở server
            try {
              await apiFetch('/auth/bank-settings', {
                method: 'PATCH',
                body: JSON.stringify({
                  bankAccountNo: cfg.accountNo || '',
                  bankId: cfg.bankId || '',
                  bankAccountName: cfg.accountName || '',
                  bankQrEnabled: cfg.enabled !== false
                })
              });
              await fetchMe();
            } catch (syncErr) {
              console.error("Lỗi đồng bộ cấu hình VietQR lên server sau khi khôi phục:", syncErr);
            }
          }
          if (configsObj.tuitionStagesConfig) {
            localStorage.setItem('tuitionStagesConfig', JSON.stringify(configsObj.tuitionStagesConfig));
          }
          window.dispatchEvent(new Event('storage'));
        }

        console.log(`>>> [RESTORE] Successfully restored database.`);
        setShowResult({ show: true, count: addedStudCount, type: 'Restore' });
        window.dispatchEvent(new Event('student-mutation'));
        window.dispatchEvent(new Event('payment-mutation'));
        window.dispatchEvent(new Event('exam-mutation'));
      } catch (err: unknown) {
        console.error(">>> [RESTORE ERROR]:", err);
        const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi.";
        toast.error("LỖI: " + msg);
      } finally {
        setIsProcessing(false);
        setRestoreFileName('');
        if (restoreInputRef.current) restoreInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Import data
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsProcessing(true);
    setProgress({ current: 0, total: 0, message: 'Đang chuẩn bị nhập dữ liệu...' });

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const jsonData = JSON.parse(event.target?.result as string);
          
          let studentsList = [];
          if (Array.isArray(jsonData)) {
            // Old format
            studentsList = jsonData;
          } else if (jsonData && typeof jsonData === 'object') {
            // New format
            studentsList = jsonData.students || [];
          } else {
            throw new Error("File không đúng cấu hình.");
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

            const createFields = {
              fullName: cleanData.fullName || cleanData.name,
              phone: cleanData.phone,
              email: cleanData.email || "",
              referral: cleanData.referral || "",
              birthday: cleanData.birthday || "",
              idCard: cleanData.idCard || "",
              rank: cleanData.rank,
              registrationDate: cleanData.registrationDate,
              fee: cleanData.fee,
              address: cleanData.address || "",
              status: cleanData.status,
            };

            const createRes = await apiFetch('/students', {
              method: 'POST',
              body: JSON.stringify(createFields),
            });

            if (createRes.success && createRes.data) {
              const newId = createRes.data._id || createRes.data.id;

              // Clean progress (strip _id)
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

              // Clean healthCheckFiles (strip _id)
              if (Array.isArray(cleanData.healthCheckFiles)) {
                cleanData.healthCheckFiles = cleanData.healthCheckFiles.map((file: unknown) => {
                  if (file && typeof file === 'object') {
                    const cleanFile = { ...file } as Record<string, unknown>;
                    delete cleanFile._id;
                    delete cleanFile.id;
                    return cleanFile;
                  }
                  return file;
                });
              }

              const updateFields = {
                healthCheckDate: cleanData.healthCheckDate || "",
                healthCheckNotes: cleanData.healthCheckNotes || "",
                healthCheckFiles: cleanData.healthCheckFiles || [],
                progress: cleanData.progress,
                exams: cleanData.exams,
                paymentHistory: cleanData.paymentHistory,
                examId: cleanData.examId || "",
                examName: cleanData.examName || "",
                examDate: cleanData.examDate || "",
              };

              await apiFetch(`/students/${newId}`, {
                method: 'PATCH',
                body: JSON.stringify(updateFields),
              });
            }

            addedCount++;
            if (addedCount % 2 === 0 || addedCount === total) {
              setProgress({ current: addedCount, total, message: `Đang nhập thêm: ${addedCount}/${total}` });
            }
          }

          setShowResult({ show: true, count: addedCount, type: 'Import' });
          window.dispatchEvent(new Event('student-mutation'));
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi.";
          toast.error("Lỗi: " + msg);
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

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 rounded-2xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all duration-300",
              activeTab === tab.id
                ? "bg-white text-cyan-600 shadow-sm shadow-cyan-100"
                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
            )}
          >
            <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-cyan-600" : "text-slate-400")} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {activeTab === 'Cấu hình hệ thống' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Fields Required Settings */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                <ClipboardList className="w-5 h-5 text-cyan-600" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Trường bắt buộc trong Form</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fieldMapping.map(({ label, key }) => {
                  const isRequired = requiredFields[key];
                  return (
                    <div key={key} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-700">{label}</span>
                      <button
                        onClick={() => toggleRequiredField(key)}
                        className="transition-all hover:scale-105 active:scale-95"
                      >
                        {isRequired ? (
                          <ToggleRight className="w-8 h-8 text-cyan-600 animate-pulse" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-slate-400 opacity-60" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tuition Stages */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                <CreditCard className="w-5 h-5 text-cyan-600" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Giai đoạn học phí</h3>
              </div>
              <div className="space-y-2">
                {['1. Đăng ký ban đầu', '2. Nộp hồ sơ khai giảng', '3. Học thực hành', '4. Thi sát hạch'].map((stage) => (
                  <div key={stage} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100 group">
                    <span className="text-xs font-bold text-slate-700">{stage}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-slate-400 hover:text-cyan-600"><Edit2 size={12} /></button>
                      <button className="p-1.5 text-slate-400 hover:text-rose-500"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
                <button className="w-full py-3 border-2 border-dashed border-slate-100 rounded-xl text-xs font-black text-slate-400 hover:border-cyan-200 hover:text-cyan-500 transition-all flex items-center justify-center gap-2">
                  <Plus size={14} /> Thêm giai đoạn mới
                </button>
              </div>
            </div>

            {/* VietQR Settings */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-6 space-y-6 lg:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-50 pb-4 gap-4">
                <div className="flex items-center gap-3">
                  <QrCode className="w-5 h-5 text-cyan-600" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Cấu hình VietQR & Chuyển khoản</h3>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveVietqrConfig}
                      disabled={isSavingVietqr}
                      className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 active:scale-95 text-xs font-bold text-white transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingVietqr ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      Lưu cấu hình
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-600">Trạng thái VietQR</label>
                    <button 
                      type="button"
                      disabled={!isAdmin}
                      onClick={() => setVietqrEnabled(!vietqrEnabled)}
                      className={cn(
                        "font-bold text-xs flex items-center gap-1 transition-all",
                        vietqrEnabled ? "text-emerald-500" : "text-slate-400",
                        !isAdmin && "opacity-60 cursor-not-allowed"
                      )}
                    >
                      <CheckCircle2 size={14} /> {vietqrEnabled ? "Đang bật" : "Đang tắt"}
                    </button>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center min-h-[160px]">
                    {vietqrEnabled && vietqrBankId && vietqrAccountNo ? (
                      <img 
                        src={`https://img.vietqr.io/image/${getVietQRBankCode(vietqrBankId)}-${vietqrAccountNo}-compact2.png?amount=0&addInfo=TEST&accountName=${encodeURIComponent(vietqrAccountName)}`} 
                        alt="VietQR Code"
                        className="w-32 h-32 object-contain rounded-lg shadow-sm bg-white"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-300">
                        <QrCode size={48} />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngân hàng</label>
                      <select 
                        disabled={!isAdmin}
                        value={vietqrBankId}
                        onChange={(e) => setVietqrBankId(e.target.value)}
                        className="w-full h-11 bg-slate-50 px-4 rounded-xl border border-slate-100 text-sm font-medium text-slate-800 outline-none focus:border-cyan-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <option value="mbbank">MBBank (MB)</option>
                        <option value="vietcombank">Vietcombank (VCB)</option>
                        <option value="techcombank">Techcombank (TCB)</option>
                        <option value="vietinbank">Vietinbank (CTG)</option>
                        <option value="bidv">BIDV</option>
                        <option value="agribank">Agribank (VBA)</option>
                        <option value="acb">ACB</option>
                        <option value="sacombank">Sacombank (STB)</option>
                        <option value="tpbank">TPBank (TPB)</option>
                        <option value="vpbank">VPBank (VPB)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Số tài khoản</label>
                      <input 
                        type="text"
                        disabled={!isAdmin}
                        placeholder="Nhập số tài khoản..."
                        value={vietqrAccountNo}
                        onChange={(e) => setVietqrAccountNo(e.target.value.replace(/\D/g, ''))}
                        className="w-full h-11 bg-slate-50 px-4 rounded-xl border border-slate-100 text-sm font-medium text-slate-800 outline-none focus:border-cyan-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tên chủ tài khoản (Không dấu)</label>
                    <input 
                      type="text"
                      disabled={!isAdmin}
                      placeholder="VD: NGUYEN VAN A"
                      value={vietqrAccountName}
                      onChange={(e) => setVietqrAccountName(e.target.value.toUpperCase())}
                      className="w-full h-11 bg-slate-50 px-4 rounded-xl border border-slate-100 text-sm font-medium text-slate-800 outline-none focus:border-cyan-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nội dung chuyển khoản mặc định</label>
                    <textarea 
                      disabled={!isAdmin}
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-cyan-600/5 focus:border-cyan-600 disabled:opacity-60 disabled:cursor-not-allowed"
                      rows={3}
                      placeholder="Mẫu nội dung (Ví dụ: [Mã HV] - [Họ tên] - Nộp học phí khóa {hang})..."
                      value={vietqrTemplate}
                      onChange={(e) => setVietqrTemplate(e.target.value)}
                    />
                    <p className="text-[10px] text-slate-400 italic font-medium">* Sử dụng các biến tương tự BOT Thông báo để cá nhân hóa nội dung.</p>
                  </div>

                  {!isAdmin && (
                    <div className="bg-amber-50 border border-amber-150 rounded-2xl p-4 flex items-start gap-2.5">
                      <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 font-medium leading-relaxed">
                        Bạn đang đăng nhập với tài khoản Nhân viên. Hệ thống tự động kế thừa và sử dụng cấu hình tài khoản ngân hàng của Quản trị viên (Admin) thiết lập.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SMTP Settings */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-6 space-y-6 lg:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-50 pb-4 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-rose-500" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Cấu hình máy chủ SMTP gửi Mail</h3>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestSmtpConnection}
                      disabled={isTestingSmtp}
                      className="h-9 px-4 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-600 hover:text-slate-800 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {isTestingSmtp ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                      ) : (
                        <Activity className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      Kiểm tra kết nối
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSmtpSettings}
                      disabled={isSavingSmtp}
                      className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 active:scale-95 text-xs font-bold text-white transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingSmtp ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      Lưu cấu hình
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* Guideline */}
                <div className="bg-rose-50/40 rounded-2xl border border-rose-100/30 p-4 text-xs text-rose-800 leading-relaxed space-y-1">
                  <p className="font-bold">💡 Hướng dẫn lấy Mật khẩu ứng dụng (App Password):</p>
                  <p>
                    1. Bật **Bảo mật 2 lớp (2-Step Verification)** cho tài khoản Google của bạn.<br />
                    2. Truy cập trang tạo mật khẩu ứng dụng:{" "}
                    <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-rose-600">
                      myaccount.google.com/apppasswords
                    </a>.<br />
                    3. Tạo mật khẩu ứng dụng mới cho ứng dụng "Thư" hoặc "Khác" và sao chép mã 16 ký tự dán vào ô mật khẩu dưới đây.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tài khoản SMTP (User)</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      placeholder="VD: account@gmail.com"
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      className="w-full h-11 bg-slate-50 px-4 rounded-xl border border-slate-100 text-sm font-medium text-slate-800 outline-none focus:border-rose-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mật khẩu ứng dụng (Password)</label>
                    <input
                      type="password"
                      disabled={!isAdmin}
                      placeholder="Nhập mật khẩu ứng dụng 16 ký tự..."
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      className="w-full h-11 bg-slate-50 px-4 rounded-xl border border-slate-100 text-sm font-medium text-slate-800 outline-none focus:border-rose-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email gửi đi (From)</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      placeholder='VD: "Hệ thống" <account@gmail.com>'
                      value={smtpFrom}
                      onChange={(e) => setSmtpFrom(e.target.value)}
                      className="w-full h-11 bg-slate-50 px-4 rounded-xl border border-slate-100 text-sm font-medium text-slate-800 outline-none focus:border-rose-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {!isAdmin && (
                  <div className="bg-amber-50 border border-amber-150 rounded-2xl p-4 flex items-start gap-2.5">
                    <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 font-medium leading-relaxed">
                      Bạn đang đăng nhập với tài khoản Nhân viên. Hệ thống tự động kế thừa và sử dụng cấu hình SMTP của Quản trị viên (Admin) thiết lập để gửi email cho học viên.
                    </p>
                  </div>
                )}
              </div>
            </div>
            {/* SMS / eSMS Settings */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-6 space-y-6 lg:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-50 pb-4 gap-4">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-cyan-600" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Cấu hình SMS (TingTing)</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestSmsConnection}
                    disabled={isTestingSms}
                    className="h-9 px-4 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-600 hover:text-slate-800 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {isTestingSms ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-600" />
                    ) : (
                      <Activity className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    Kiểm tra kết nối
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSmsSettings}
                    disabled={isSavingSms}
                    className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 active:scale-95 text-xs font-bold text-white transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingSms ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    Lưu cấu hình
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nhà cung cấp SMS</label>
                    <select
                      value={smsProvider}
                      onChange={(e) => setSmsProvider(e.target.value as 'twilio' | 'stringee' | 'tingting')}
                      className="w-full h-11 bg-slate-50 px-4 rounded-xl border border-slate-100 text-sm font-medium text-slate-800 outline-none focus:border-cyan-600 transition-all"
                    >
                      <option value="tingting">TingTing (SpeedSMS)</option>
                      <option value="twilio">Twilio (Quốc tế - Chưa hỗ trợ)</option>
                      <option value="stringee">Stringee (Chưa hỗ trợ)</option>
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                  {smsProvider === 'tingting' ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1 col-span-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TingTing API Key</label>
                          <input
                            type="text"
                            placeholder="Nhập API Key từ TingTing..."
                            value={tingtingApiKey}
                            onChange={(e) => setTingtingApiKey(e.target.value)}
                            className="w-full h-11 bg-slate-50 px-4 rounded-xl border border-slate-100 text-sm font-medium text-slate-800 outline-none focus:border-cyan-600 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tên Sender (Nếu cần)</label>
                        <input
                          type="text"
                          placeholder="VD: Brandname hoặc Device ID (Để trống nếu dùng mặc định)..."
                          value={tingtingSender}
                          onChange={(e) => setTingtingSender(e.target.value)}
                          className="w-full h-11 bg-slate-50 px-4 rounded-xl border border-slate-100 text-sm font-medium text-slate-800 outline-none focus:border-cyan-600 transition-all"
                        />
                      </div>

                      <div className="bg-cyan-50/50 border border-cyan-100 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center gap-2 text-cyan-800 font-bold text-xs">
                          <Info size={14} className="shrink-0" />
                          <span>HƯỚNG DẪN CẤU HÌNH VÀ SỬ DỤNG TINGTING:</span>
                        </div>
                        <ul className="text-[11px] text-cyan-700/90 leading-relaxed list-decimal pl-4 space-y-1 font-medium">
                          <li>Đăng nhập hoặc đăng ký tài khoản tại <a href="https://app.tingting.im" target="_blank" rel="noreferrer" className="underline font-bold text-cyan-800 hover:text-cyan-900">app.tingting.im</a>, sau đó tiến hành nạp số dư tối thiểu.</li>
                          <li>Vào mục <strong>Developers</strong> để tạo <strong>API Key</strong>. Đừng quên cấu hình địa chỉ IP whitelist của server để được phép gọi API.</li>
                          <li>Copy <strong>API Key</strong> vừa tạo dán vào trường thông tin ở trên.</li>
                          <li>Nếu bạn có đăng ký sử dụng <strong>Brandname riêng</strong>, hãy nhập tên Brandname vào mục <strong>Tên Sender</strong>.</li>
                        </ul>
                      </div>
                    </>
                  ) : (
                    <div className="h-full min-h-[150px] border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 text-xs italic">
                      Nhà cung cấp này hiện chưa được hỗ trợ tích hợp trực tiếp trên giao diện. Vui lòng chọn TingTing.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Quản lý dữ liệu' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {isProcessing && (
              <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 px-10">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl flex flex-col items-center text-center space-y-6"
                >
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full border-4 border-slate-100 border-t-cyan-600 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Database className="w-8 h-8 text-cyan-600 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-black text-slate-800">Cơ sở dữ liệu</h4>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{progress.message}</p>
                  </div>
                  {progress.total > 0 && (
                    <div className="w-full space-y-2">
                      <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-cyan-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <p className="text-[10px] font-black text-cyan-600">
                        {Math.round((progress.current / progress.total) * 100)}% HOÀN TẤT
                      </p>
                    </div>
                  )}
                </motion.div>
              </div>
            )}

            {showResult.show && (
              <div className="fixed inset-0 z-[10000] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  className="bg-white rounded-[3rem] p-12 max-w-sm w-full shadow-2xl flex flex-col items-center text-center space-y-8"
                >
                  <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center text-emerald-500 shadow-inner">
                    <CheckCircle2 size={56} />
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-3xl font-black text-slate-900 leading-tight">
                      {showResult.type === 'Restore' ? 'Khôi phục Thành công!' : 'Nhập liệu Thành công!'}
                    </h4>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed px-4">
                      {showResult.type === 'Restore'
                        ? `Hệ thống đã được làm mới hoàn toàn với ${showResult.count} học viên từ bản sao.`
                        : `Đã thêm thành công ${showResult.count} học viên vào danh sách hiện tại của bạn.`}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowResult({ ...showResult, show: false })}
                    className="w-full py-5 bg-slate-900 text-white rounded-2xl text-sm font-black shadow-xl shadow-slate-200 hover:bg-black transition-all active:scale-95"
                  >
                    TUYỆT VỜI
                  </button>
                </motion.div>
              </div>
            )}

            {restoreFileToConfirm && (
              <div className="fixed inset-0 z-[9990] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  className="bg-white rounded-[3rem] p-8 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col space-y-6"
                >
                  <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest text-left">Xác nhận khôi phục</h3>
                      <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider text-left">Hành động nguy hiểm</p>
                    </div>
                  </div>

                  <div className="space-y-4 text-left">
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2.5">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tên tệp tin backup</span>
                        <p className="text-xs font-bold text-slate-800 break-all">{restoreFileToConfirm.name}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dung lượng</span>
                        <p className="text-xs font-bold text-slate-800">{(restoreFileToConfirm.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>

                    <div className="p-4 bg-rose-50 border border-rose-100/50 rounded-2xl space-y-1.5 text-xs text-left">
                      <p className="font-extrabold text-rose-700 leading-snug">⚠️ QUY TRÌNH KHÔI PHỤC HỆ THỐNG:</p>
                      <p className="font-medium text-rose-600/90 leading-relaxed">
                        1. Xóa sạch toàn bộ giao dịch, phòng thi và học viên hiện có.<br />
                        2. Nạp lại cấu hình và toàn bộ dữ liệu mới từ tệp tin này.
                      </p>
                      <p className="font-bold text-rose-700 mt-2 leading-snug">Hành động này không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục?</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setRestoreFileToConfirm(null);
                        if (restoreInputRef.current) restoreInputRef.current.value = '';
                      }}
                      className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-black transition-all active:scale-95"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={() => executeRestore(restoreFileToConfirm)}
                      className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-rose-100 transition-all active:scale-95"
                    >
                      Xác nhận khôi phục
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            <DataActionCard
              title="Backup (Xuất JSON)"
              description="Tải toàn bộ dữ liệu hiện tại về máy dưới dạng file .json để lưu trữ."
              icon={Download}
              actionLabel="Tải xuống Bản sao"
              color="indigo"
              onClick={handleBackup}
            />

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".json"
              onChange={handleImport}
            />
            <DataActionCard
              title="Import (Nhập dữ liệu)"
              description="Tải lên file JSON để thêm mới học viên hoặc lịch thi hàng loạt."
              icon={Upload}
              actionLabel="Chọn file để Nhập"
              color="blue"
              onClick={() => fileInputRef.current?.click()}
            />

            <input
              type="file"
              ref={restoreInputRef}
              className="hidden"
              accept=".json"
              onChange={handleRestoreFileSelected}
            />
            <div className="flex flex-col space-y-3">
              <DataActionCard
                title="Restore (Khôi phục)"
                description="Khôi phục hệ thống về trạng thái của một bản backup cũ. Lưu ý: Sẽ ghi đè dữ liệu hiện tại."
                icon={RotateCcw}
                actionLabel="Tiến hành Khôi phục"
                color="rose"
                onClick={triggerRestore}
              />
              {restoreFileName && (
                <div className="bg-rose-50 border border-rose-100 px-4 py-2 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-600">
                    <FileJson size={14} className="animate-pulse" />
                    <span className="text-[10px] font-black uppercase truncate max-w-[150px]">{restoreFileName}</span>
                  </div>
                  <button
                    onClick={() => {
                      setRestoreFileName('');
                      if (restoreInputRef.current) restoreInputRef.current.value = '';
                    }}
                    className="text-rose-400 hover:text-rose-600"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>
              )}
            </div>
            <div className="md:col-span-3 bg-cyan-50/50 rounded-[2rem] border border-cyan-100 p-6 flex items-start gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm text-cyan-600">
                <Info size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-indigo-900 mb-1">An toàn dữ liệu</h4>
                <p className="text-xs font-medium text-cyan-600/80 leading-relaxed">
                  Chúng tôi khuyến nghị bạn nên Backup dữ liệu ít nhất một lần mỗi tuần. File backup có thể được dùng để khôi phục hoặc chuyển đổi dữ liệu sang các hệ thống khác.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Quản trị' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Sys Info */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                  <Activity className="w-5 h-5 text-cyan-600" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Thông tin vận hành</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <SysStat label="Dung lượng DB" value="12.4 MB" />
                  <SysStat label="Uptime" value="99.9%" />
                  <SysStat label="Lần Backup cuối" value="2 giờ trước" />
                  <SysStat label="Phiên bản" value="v2.4.0-pro" />
                  <SysStat label="Yêu cầu API" value="1.2k / ngày" />
                  <SysStat label="Server Region" value="Asia-SE1" />
                </div>
              </div>

              {/* Admin Control */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                  <ShieldCheck className="w-5 h-5 text-cyan-600" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Kiểm soát cấu hình chung</h3>
                </div>
                <div className="space-y-4">
                  <AdminToggle label="Chế độ bảo trì hệ thống" disabled />
                  <AdminToggle label="Cho phép đăng ký tài khoản mới" enabled />
                  <AdminToggle label="Tự động Backup hằng ngày" enabled />
                  <AdminToggle label="Bật nhật ký hoạt động (Logs)" enabled />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                  <ShieldCheck size={120} />
                </div>
                <div className="relative z-10">
                  <h4 className="text-lg font-black mb-4">Quyền hạn Quản trị</h4>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6">
                    Mọi thay đổi trong module này có thể ảnh hưởng trực tiếp đến sự ổn định của hệ thống. Vui lòng kiểm tra kỹ trước khi thực hiện.
                  </p>
                  <button className="w-full py-4 bg-cyan-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-900/40 hover:bg-cyan-700 transition-all">
                    Xác thực quyền Admin
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SysStat({ label, value }: { label: string, value: string }) {
  return (
    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-black text-slate-800 tracking-tight">{value}</p>
    </div>
  );
}

function AdminToggle({ label, enabled = false, disabled = false }: { label: string, enabled?: boolean, disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 italic transition-all">
      <span className={cn("text-xs font-bold", disabled ? "text-slate-400" : "text-slate-700")}>{label}</span>
      <button className={cn(
        "relative w-12 h-6 rounded-full transition-all duration-300",
        enabled ? "bg-cyan-600" : "bg-slate-200"
      )}>
        <div className={cn(
          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300",
          enabled ? "left-7" : "left-1"
        )} />
      </button>
    </div>
  );
}

interface DataActionCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
  actionLabel: string;
  color: 'indigo' | 'blue' | 'rose';
  onClick: () => void;
}

function DataActionCard({ title, description, icon: Icon, actionLabel, color, onClick }: DataActionCardProps) {
  const colorMap: Record<'indigo' | 'blue' | 'rose', string> = {
    indigo: "text-cyan-600 bg-cyan-50 border-cyan-100",
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    rose: "text-rose-600 bg-rose-50 border-rose-100"
  };

  const btnColorMap: Record<'indigo' | 'blue' | 'rose', string> = {
    indigo: "bg-cyan-600 hover:bg-cyan-700 shadow-cyan-100",
    blue: "bg-blue-600 hover:bg-blue-700 shadow-blue-100",
    rose: "bg-rose-600 hover:bg-rose-700 shadow-rose-100"
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8 flex flex-col items-center text-center space-y-4 group">
      <div className={cn("w-20 h-20 rounded-3xl flex items-center justify-center mb-2 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3", colorMap[color])}>
        <Icon size={40} />
      </div>
      <div>
        <h3 className="text-base font-black text-slate-800 mb-2">{title}</h3>
        <p className="text-xs font-medium text-slate-400 leading-relaxed px-4">{description}</p>
      </div>
      <button
        onClick={onClick}
        className={cn("w-full py-4 mt-4 text-white rounded-2xl text-xs font-black shadow-lg transition-all active:scale-95", btnColorMap[color])}
      >
        {actionLabel}
      </button>
    </div>
  );
}
