import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, History, UserCheck, 
  ChevronDown, SendHorizontal,
  AlertCircle, MessageCircle, Smartphone, Mail,
  Inbox, Loader2, CheckCircle2, X, Trash2, Lock
} from 'lucide-react';
import { cn, parseVND } from '../../lib/utils';
import { useStudents } from '../../hooks/useStudents';
import { useAuth } from '../../hooks/useAuth';
import { apiFetch, getAccessToken } from '../../lib/api';
import { BroadcastNotification, Student } from '../../types';
import { useToast } from '../../hooks/useToast';
import { AddPaymentModal } from '../../components/Fees/AddPaymentModal';

interface HistoryCardProps {
  key?: string | number;
  notification: BroadcastNotification;
  onDelete: (id: string) => void;
}

interface SendResult {
  student: Student;
  status: 'Thành công' | 'Thất bại';
  error?: string;
}

function HistoryCard({ notification, onDelete }: HistoryCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  
  let dateObj: Date | null = null;
  if (notification.createdAt) {
    const ca = notification.createdAt as unknown as { toDate?: () => Date };
    if (ca && typeof ca.toDate === 'function') {
      dateObj = ca.toDate();
    } else {
      dateObj = new Date(notification.createdAt);
    }
  }

  const formattedDate = dateObj && !isNaN(dateObj.getTime())
    ? new Intl.DateTimeFormat('vi-VN', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj)
    : 'Đang xử lý...';

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.id || isDeleting) {
      console.error("Missing notification ID:", notification);
      return;
    }
    
    setIsDeleting(true);
    try {
      await onDelete(notification.id);
    } catch (error) {
      console.error("Delete failed:", error);
      setIsDeleting(false);
      toast.error("Lỗi khi xóa: " + (error instanceof Error ? error.message : "Không rõ nguyên nhân"));
    }
  };

  return (
    <div className="p-5 rounded-[1.5rem] border border-slate-100 hover:border-cyan-100 hover:bg-cyan-50/20 transition-all group relative">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="space-y-1">
          <h4 className="text-sm font-black text-slate-800 line-clamp-1 text-left">{notification.title}</h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">{formattedDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            "px-2.5 py-1 rounded-lg text-[10px] font-black border",
            notification.status === 'Đã gửi' ? "bg-emerald-50 text-emerald-600 border-emerald-100/50" : "bg-rose-50 text-rose-600 border-rose-100/50"
          )}>
            {notification.status}
          </div>
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className={cn(
              "p-2 rounded-xl transition-all active:scale-95 disabled:opacity-50",
              isDeleting ? "bg-slate-100 text-slate-400" : "bg-rose-50 text-rose-500 hover:bg-rose-100"
            )}
            title="Xóa lịch sử"
          >
            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      
      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4 text-left">
        {notification.content}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100/50">
        <div className="flex items-center gap-2">
          {notification.channels.map(channel => (
            <span key={channel} className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-500 uppercase tracking-wider">
              {channel}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[10px] font-extrabold text-slate-600">{notification.recipientCount} HV</span>
        </div>
      </div>
    </div>
  );
}

export function NotificationsPage() {
  const { students } = useStudents();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recipientFilter, setRecipientFilter] = useState('Tất cả học viên đang học');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [channels, setChannels] = useState<string[]>(['Email']);
  const [history, setHistory] = useState<BroadcastNotification[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sendProgress, setSendProgress] = useState<{
    current: number;
    total: number;
    results: SendResult[];
    showModal: boolean;
    isFinishing: boolean;
  }>({
    current: 0,
    total: 0,
    results: [],
    showModal: false,
    isFinishing: false
  });

  const [apiStatus, setApiStatus] = useState<'Checking' | 'Ready' | 'Missing Key' | 'Error'>('Checking');
  const [smsApiStatus, setSmsApiStatus] = useState<'Checking' | 'Ready' | 'Sandbox' | 'Error'>('Checking');
  const [vietqrConfig] = useState<{
    enabled: boolean;
    bankId: string;
    accountNo: string;
    accountName: string;
    template: string;
  } | null>(() => {
    try {
      const cfg = localStorage.getItem("vietqrConfig");
      return cfg ? JSON.parse(cfg) : null;
    } catch (e) {
      console.error("Error parsing vietqrConfig in NotificationBot", e);
      return null;
    }
  });
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<Student | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const checkApiStatus = async () => {
    try {
      const data = await apiFetch('/send-email', {
        method: 'POST',
        body: JSON.stringify({ check: true }) 
      });
      if (data.success && data.status === 'Ready') {
        setApiStatus('Ready');
      } else {
        setApiStatus('Error');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('SMTP_CONFIG_missing') || msg.includes('cấu hình') || msg.includes('SMTP')) {
        setApiStatus('Missing Key');
      } else {
        setApiStatus('Error');
      }
    }
  };

  const checkSmsApiStatus = async () => {
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
        setSmsApiStatus('Ready');
      } else {
        setSmsApiStatus('Error');
      }
    } catch {
      setSmsApiStatus('Error');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      checkApiStatus();
      checkSmsApiStatus();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await apiFetch('/notifications');
      if (res.success && res.notifications) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped = res.notifications.map((n: any) => ({
          ...n,
          id: n._id,
        })) as BroadcastNotification[];
        setHistory(mapped);
      }
    } catch (error) {
      console.error("Lỗi khi tải lịch sử thông báo:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Fetch history
  useEffect(() => {
    if (!user) return;

    const timer = setTimeout(() => {
      fetchHistory();
    }, 0);

    const handleMutation = () => {
      fetchHistory();
    };

    window.addEventListener('notification-mutation', handleMutation);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('notification-mutation', handleMutation);
    };
  }, [user]);

  const toggleChannel = (channel: string) => {
    if (channel === 'Zalo OA' || channel === 'SMS') {
      toast.info('Tính năng đang phát triển');
      return;
    }
    setChannels(prev => 
      prev.includes(channel) 
        ? prev.filter(c => c !== channel) 
        : [...prev, channel]
    );
  };

  const getTargetStudents = () => {
    switch (recipientFilter) {
      case 'Tất cả học viên đang học':
        return students.filter(s => s.status === 'Đang học');
      case 'Học viên sắp thi':
        return students.filter(s => s.status === 'Đang thi' || s.exams?.some(e => e.status === 'Sắp thi'));
      case 'Học viên còn nợ học phí':
        return students.filter(s => {
          const totalFee = parseInt(parseVND(s.fee) || '0');
          return (s.paidAmount || 0) < totalFee;
        });
      case 'Học viên cần thi lại':
        return students.filter(s => s.status === 'Thi lại');
      default:
        return [];
    }
  };

  const replaceVariables = (str: string, student: Student) => {
    const examDate = student.exams?.find(e => e.status === 'Sắp thi')?.date || 
                    (student.status === 'Đang thi' ? student.examDate : '') || 
                    'Chưa có lịch';
    const totalFee = parseInt(parseVND(student.fee) || '0');
    const debtAmount = totalFee - (student.paidAmount || 0);
    const formattedSotien = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(debtAmount);
    
    return str
      .replace(/\{ten\}/g, student.fullName)
      .replace(/\{hang\}/g, student.rank)
      .replace(/\{kv\}/g, student.area)
      .replace(/\{email\}/g, student.email || '')
      .replace(/\{ngaythi\}/g, examDate)
      .replace(/\{sotien\}/g, formattedSotien);
  };

  const buildQrEmailHtml = (
    student: Student,
    config: { bankId: string; accountNo: string; accountName: string; template: string },
    textContent: string
  ) => {
    const totalFee = parseInt(parseVND(student.fee) || "0");
    const debtAmount = totalFee - (student.paidAmount || 0);
    
    let note = config.template || "Nop hoc phi {ten} {phone}";
    note = note.replace(/{ten}/g, student.fullName)
               .replace(/{phone}/g, student.phone)
               .replace(/{id}/g, student.id || "");
               
    const removeVietnameseTones = (str: string) => {
      str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a");
      str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e");
      str = str.replace(/ì|í|ị|ỉ|ĩ/g,"i");
      str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o");
      str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u");
      str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y");
      str = str.replace(/đ/g,"d");
      str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g,"A");
      str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g,"E");
      str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g,"I");
      str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g,"O");
      str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g,"U");
      str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g,"Y");
      str = str.replace(/Đ/g,"D");
      str = str.replace(/[^a-zA-Z0-9 ]/g, "");
      return str;
    };
    note = removeVietnameseTones(note);

    const qrUrl = `https://img.vietqr.io/image/${config.bankId}-${config.accountNo}-compact2.png?amount=${debtAmount}&addInfo=${encodeURIComponent(note)}&accountName=${encodeURIComponent(config.accountName)}`;

    return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #0f172a; margin-bottom: 16px;">Thông báo thanh toán học phí</h2>
        <div style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          ${textContent.replace(/\n/g, "<br/>")}
        </div>
        
        <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Quét mã VietQR để thanh toán</p>
          <img src="${qrUrl}" alt="Mã QR thanh toán" style="max-width: 250px; height: auto; display: block; margin: 0 auto 15px auto; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);" />
          <div style="text-align: left; max-width: 300px; margin: 0 auto; font-size: 13px; color: #334155;">
            <p style="margin: 4px 0;"><b>Ngân hàng:</b> ${config.bankId.toUpperCase()}</p>
            <p style="margin: 4px 0;"><b>Số tài khoản:</b> ${config.accountNo}</p>
            <p style="margin: 4px 0;"><b>Chủ tài khoản:</b> ${config.accountName}</p>
            <p style="margin: 4px 0;"><b>Số tiền:</b> <span style="color: #0284c7; font-weight: bold;">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(debtAmount)}</span></p>
            <p style="margin: 4px 0;"><b>Nội dung CK:</b> <span style="background-color: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-weight: bold; color: #0f172a;">${note}</span></p>
          </div>
        </div>
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">Email này được gửi tự động từ hệ thống quản lý học phí.</p>
      </div>
    `;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title || !content || channels.length === 0) return;

    const targetStudents = getTargetStudents();
    if (targetStudents.length === 0) {
      toast.warning("Không tìm thấy học viên phù hợp với bộ lọc này.");
      return;
    }

    setIsSubmitting(true);
    setSendProgress({
      current: 0,
      total: targetStudents.length,
      results: [],
      showModal: true,
      isFinishing: false
    });

    try {
      const results: SendResult[] = [];
      for (let i = 0; i < targetStudents.length; i++) {
        const student = targetStudents[i];
        const personalizedContent = replaceVariables(content, student);
        const personalizedTitle = replaceVariables(title, student);
        
        let isSuccess = true;
        let errorMessage = '';

        // If Email channel is selected, call our real API
        if (channels.includes('Email') && student.email) {
          try {
            const hasVietQr = vietqrConfig && vietqrConfig.enabled && vietqrConfig.bankId && vietqrConfig.accountNo;
            const isDebtFilter = recipientFilter === 'Học viên còn nợ học phí';
            const emailHtml = (isDebtFilter && hasVietQr)
              ? buildQrEmailHtml(student, vietqrConfig, personalizedContent)
              : personalizedContent.replace(/\n/g, '<br/>');

            const data = await apiFetch('/send-email', {
              method: 'POST',
              body: JSON.stringify({
                to: student.email,
                subject: personalizedTitle,
                html: emailHtml
              })
            });
            if (!data.success) {
              isSuccess = false;
              errorMessage = data.error || 'Lỗi gửi mail';
            }
          } catch (err: unknown) {
            isSuccess = false;
            errorMessage = err instanceof Error ? err.message : 'Lỗi gửi mail';
          }
        }

        // Handle SMS real API
        if (channels.includes('SMS')) {
          try {
            const token = getAccessToken();
            const response = await fetch('/api/send-sms', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              },
              body: JSON.stringify({
                to: student.phone,
                message: personalizedContent
              })
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
              isSuccess = false;
              errorMessage = (errorMessage ? errorMessage + ' & ' : '') + (data.error || 'Lỗi gửi SMS');
            }
          } catch {
            isSuccess = false;
            errorMessage = (errorMessage ? errorMessage + ' & ' : '') + 'Lỗi kết nối server (SMS)';
          }
        }

        // Simulation for other channels (Zalo)
        if (channels.includes('Zalo OA')) {
          await new Promise(resolve => setTimeout(resolve, 300));
          const zaloSuccess = Math.random() < 0.95;
          if (!zaloSuccess) {
            isSuccess = false;
            errorMessage = (errorMessage ? errorMessage + ' & ' : '') + 'Lỗi Zalo OA (Giả lập)';
          }
        }
        
        results.push({
          student,
          status: isSuccess ? 'Thành công' : 'Thất bại',
          error: isSuccess ? undefined : errorMessage
        });

        setSendProgress(prev => ({
          ...prev,
          current: i + 1,
          results: [...results]
        }));
      }

      setSendProgress(prev => ({ ...prev, isFinishing: true }));

      // Save to history
      await apiFetch('/notifications', {
        method: 'POST',
        body: JSON.stringify({
          title,
          content,
          recipients: recipientFilter,
          recipientCount: targetStudents.length,
          channels,
          status: 'Đã gửi',
        }),
      });

      window.dispatchEvent(new Event('notification-mutation'));

      setTitle('');
      setContent('');
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Lỗi khi gửi thông báo: " + (error instanceof Error ? error.message : "Không rõ nguyên nhân"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeResults = () => {
    setSendProgress(prev => ({ ...prev, showModal: false }));
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await apiFetch(`/notifications/${id}`, {
        method: 'DELETE',
      });
      window.dispatchEvent(new Event('notification-mutation'));
      toast.success("Đã xóa lịch sử thông báo!");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Không thể xóa thông báo này. Vui lòng thử lại.");
    }
  };

  const recipientCounts = {
    'Tất cả học viên đang học': students.filter(s => s.status === 'Đang học').length,
    'Học viên sắp thi': students.filter(s => s.status === 'Đang thi' || s.exams?.some(e => e.status === 'Sắp thi')).length,
    'Học viên còn nợ học phí': students.filter(s => (s.paidAmount || 0) < parseInt(parseVND(s.fee) || '0')).length,
    'Học viên cần thi lại': students.filter(s => s.status === 'Thi lại').length,
  };

  const currentRecipientCount = recipientCounts[recipientFilter as keyof typeof recipientCounts] || 0;

  const templates = [
    {
      name: 'Nhắc phí',
      title: 'THÔNG BÁO HOÀN THÀNH HỌC PHÍ - {ten}',
      content: 'Kính gửi học viên {ten}, Trung tâm xin thông báo học phí khóa học hạng {hang} của bạn hiện vẫn còn nợ {sotien}. Để đảm bảo tiến độ học tập và dự thi đúng hạn, bạn vui lòng hoàn tất học phí trong tuần này tại {kv}. Trân trọng.'
    },
    {
      name: 'Lịch thi',
      title: 'THÔNG BÁO LỊCH THI SÁT HẠCH - {ten}',
      content: 'Kính gửi học viên {ten}, Trung tâm xin thông báo lịch thi sát hạch hạng {hang} của bạn đã có vào ngày {ngaythi} tại {kv}. Bạn vui lòng có mặt đúng giờ và mang theo CCCD bản gốc để làm thủ tục dự thi. Chúc bạn thi tốt.'
    },
    {
      name: 'Thi lại',
      title: 'LỊCH THI LẠI & ÔN TẬP - {ten}',
      content: 'Kính gửi học viên {ten}, Trung tâm đã sắp xếp lịch ôn tập và thi lại cho bạn khóa hạng {hang} tại khu vực {kv}. Vui lòng liên hệ văn phòng để xác nhận lịch thi dự kiến kế tiếp. Cố gắng lên bạn nhé.'
    }
  ];

  const applyTemplate = (tpl: typeof templates[0]) => {
    setTitle(tpl.title);
    setContent(tpl.content);
  };

  return (
    <div className="space-y-6">
      {/* Send Progress Modal */}
      <AnimatePresence>
        {sendProgress.showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Kết quả gửi thông báo</h3>
                  <p className="text-slate-500 text-xs font-bold mt-1">Đang xử lý: {sendProgress.current}/{sendProgress.total} học viên</p>
                </div>
                {!isSubmitting && (
                  <button onClick={closeResults} className="p-2 bg-white text-slate-400 hover:text-slate-600 rounded-xl transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="p-8 space-y-6 flex-1 overflow-y-auto">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>Tiến độ</span>
                    <span>{Math.round((sendProgress.current / sendProgress.total) * 100)}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 p-0.5">
                    <motion.div 
                      className="h-full bg-cyan-600 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(sendProgress.current / sendProgress.total) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Results List */}
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Danh sách phản hồi</p>
                  <div className="space-y-1.5 min-h-[200px]">
                    {sendProgress.results.slice().reverse().map((res, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl border text-xs font-bold gap-2",
                          res.status === 'Thành công' ? "bg-emerald-50/50 border-emerald-100 text-emerald-700" : "bg-rose-50/50 border-rose-100 text-rose-700"
                        )}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {res.status === 'Thành công' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
                          <span className="truncate">{res.student.fullName} ({res.student.phone})</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {res.status === 'Thành công' && recipientFilter === 'Học viên còn nợ học phí' && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStudentForPayment(res.student);
                                setIsPaymentModalOpen(true);
                              }}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] rounded-lg transition-colors font-black active:scale-95"
                            >
                              Đánh dấu đã thu
                            </button>
                          )}
                          <span className="text-[10px] uppercase opacity-60">
                            {res.status} {res.error ? `- ${res.error}` : ''}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {!isSubmitting && (
                <div className="p-8 bg-slate-50 border-t border-slate-100">
                  <button 
                    onClick={closeResults}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-lg shadow-slate-200 hover:bg-black transition-all active:scale-95"
                  >
                    Hoàn tất
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight text-left">BOT Thông báo</h1>
          <p className="text-slate-400 text-sm font-medium mt-1 text-left">Gửi thông báo tự động đến học viên</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Composer */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden"
        >
          <div className="px-8 py-6 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
              <SendHorizontal className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Soạn thông báo</h3>
          </div>

          <form onSubmit={handleSend} className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left block">Đối tượng nhận</label>
              <div className="relative group">
                <select 
                  value={recipientFilter}
                  onChange={(e) => setRecipientFilter(e.target.value)}
                  className="w-full h-12 bg-slate-50 px-5 pr-12 rounded-2xl border border-slate-200 text-sm font-bold text-slate-800 outline-none appearance-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-500/5 transition-all text-left"
                >
                  <option>Tất cả học viên đang học</option>
                  <option>Học viên sắp thi</option>
                  <option>Học viên còn nợ học phí</option>
                  <option>Học viên cần thi lại</option>
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none transition-transform group-hover:translate-y-[-40%]" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left block">Tiêu đề</label>
              <input 
                type="text" 
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tiêu đề thông báo..."
                className="w-full h-12 bg-slate-50 px-5 rounded-2xl border border-slate-200 text-sm font-medium outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-500/5 transition-all text-left"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left block">Nội dung</label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Mẫu:</span>
                  <div className="flex gap-1">
                    {templates.map(tpl => (
                      <button 
                        key={tpl.name}
                        type="button"
                        onClick={() => applyTemplate(tpl)}
                        className="px-2 py-1 bg-cyan-50 text-cyan-600 text-[10px] font-bold rounded-md border border-cyan-100 hover:bg-cyan-600 hover:text-white transition-all"
                      >
                        {tpl.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="relative">
                <textarea 
                  required
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nội dung thông báo..."
                  className="w-full p-6 bg-slate-50 rounded-2xl border border-slate-200 text-sm font-medium outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-500/5 transition-all min-h-[220px] resize-none text-left pb-24"
                />
                <div className="absolute bottom-4 left-6 right-6 p-4 rounded-xl bg-white/80 border border-slate-100 backdrop-blur-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-left">Biến dùng được:</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <VariableTag name="ten" label="Tên" />
                    <VariableTag name="hang" label="Hạng" />
                    <VariableTag name="kv" label="KV" />
                    <VariableTag name="email" label="Email" />
                    <VariableTag name="ngaythi" label="Ngày thi" />
                    <VariableTag name="sotien" label="Tiền nợ" />
                  </div>
                </div>
              </div>
            </div>

            {recipientFilter === 'Học viên còn nợ học phí' && channels.includes('Email') && (
              <div className="text-xs font-bold text-left">
                {vietqrConfig && vietqrConfig.enabled && vietqrConfig.bankId && vietqrConfig.accountNo ? (
                  <div className="flex items-center gap-2 text-cyan-700 bg-cyan-50/50 border border-cyan-100/50 p-3.5 rounded-2xl">
                    <Smartphone size={16} className="text-cyan-600 flex-shrink-0" />
                    <span>📲 Mã VietQR cá nhân hóa chứa số tiền còn nợ sẽ được tự động nhúng trực tiếp vào email của từng học viên.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-700 bg-amber-50/50 border border-amber-100/50 p-3.5 rounded-2xl">
                    <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
                    <span>⚠️ Chưa cấu hình VietQR hoặc VietQR đang tắt. Email nhắc phí gửi đi sẽ chỉ là plain text. Bạn có thể vào Cài đặt để kích hoạt VietQR.</span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left block">Kênh gửi</label>
                  <div className="flex items-center gap-4">
                    {channels.includes('Email') && (
                      <div className="flex items-center gap-1.5 border-r border-slate-100 pr-4">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Email API:</span>
                        {apiStatus === 'Checking' && <Loader2 className="w-2.5 h-2.5 text-slate-400 animate-spin" />}
                        {apiStatus === 'Ready' && (
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase tracking-wider">
                              <CheckCircle2 size={8} /> Sẵn sàng
                            </span>
                          </div>
                        )}
                        {apiStatus === 'Missing Key' && <span className="text-[9px] font-black text-rose-500 uppercase">Thiếu Key</span>}
                        {apiStatus === 'Error' && <span className="text-[9px] font-black text-amber-500 uppercase">Lỗi</span>}
                      </div>
                    )}
                    {channels.includes('SMS') && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">SMS API:</span>
                        {smsApiStatus === 'Checking' && <Loader2 className="w-2.5 h-2.5 text-slate-400 animate-spin" />}
                        {smsApiStatus === 'Ready' && (
                          <span className="flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase tracking-wider">
                            <CheckCircle2 size={8} /> Sẵn sàng
                          </span>
                        )}
                        {smsApiStatus === 'Error' && <span className="text-[9px] font-black text-rose-500 uppercase">Chưa cấu hình</span>}
                      </div>
                    )}
                  </div>
                </div>
                {channels.includes('Email') && apiStatus === 'Ready' && (
                  <p className="text-[9px] text-slate-400 font-medium italic text-right">* SMTP Sender: Gửi email không giới hạn qua tài khoản của bạn.</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <button 
                  type="button"
                  onClick={() => toggleChannel('Email')}
                  className="flex items-center gap-2 group cursor-pointer"
                >
                  <div className={cn(
                    "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                    channels.includes('Email') ? "bg-cyan-600 border-cyan-600" : "border-slate-300 group-hover:border-slate-400"
                  )}>
                    {channels.includes('Email') && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-rose-500" />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">EMAIL</span>
                  </div>
                </button>

                <button 
                  type="button"
                  onClick={() => toggleChannel('Zalo OA')}
                  className="flex items-center gap-2 group cursor-pointer opacity-60 hover:opacity-80 transition-opacity"
                  title="Tính năng đang phát triển"
                >
                  <div className="w-5 h-5 rounded-md border border-slate-300 flex items-center justify-center bg-slate-50">
                    <Lock className="w-2.5 h-2.5 text-slate-400" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">ZALO OA</span>
                    <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100/50 px-1.5 py-0.5 rounded-md uppercase tracking-wider">Sắp có</span>
                  </div>
                </button>

                <button 
                  type="button"
                  onClick={() => toggleChannel('SMS')}
                  className="flex items-center gap-2 group cursor-pointer opacity-60 hover:opacity-80 transition-opacity"
                  title="Tính năng đang phát triển"
                >
                  <div className="w-5 h-5 rounded-md border border-slate-300 flex items-center justify-center bg-slate-50">
                    <Lock className="w-2.5 h-2.5 text-slate-400" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">SMS</span>
                    <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100/50 px-1.5 py-0.5 rounded-md uppercase tracking-wider">Sắp có</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-50">
              <p className="text-xs font-bold text-cyan-600 bg-cyan-50 px-4 py-2 rounded-full">
                Sẽ gửi đến: <span className="font-black underline underline-offset-4">{currentRecipientCount} học viên</span>
              </p>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button 
                  type="submit"
                  disabled={isSubmitting || channels.length === 0 || currentRecipientCount === 0}
                  className="w-full flex items-center justify-center gap-2 px-10 py-3.5 bg-cyan-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-cyan-100 hover:bg-cyan-700 transition-all disabled:opacity-50 active:scale-95"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  Gửi hàng loạt
                </button>
              </div>
            </div>
          </form>
        </motion.div>

        {/* History */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[600px] flex flex-col"
        >
          <div className="px-8 py-6 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
              <History className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Lịch sử thông báo</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {loadingHistory ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-sm font-medium">Đang nạp lịch sử...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 py-20">
                <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center">
                  <Inbox className="w-10 h-10 text-slate-200" />
                </div>
                <p className="text-sm font-bold tracking-tight">Chưa có thông báo nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <HistoryCard key={item.id} notification={item} onDelete={handleDeleteNotification} />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {isPaymentModalOpen && selectedStudentForPayment && (
        <AddPaymentModal
          student={selectedStudentForPayment}
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedStudentForPayment(null);
          }}
          onSuccess={() => {
            window.dispatchEvent(new Event('student-mutation'));
          }}
        />
      )}
    </div>
  );
}

function VariableTag({ name, label }: { name: string, label: string }) {
  return (
    <div className="flex items-center gap-1.5 group cursor-help bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
      <span className="text-[11px] font-black text-cyan-600 leading-none">{"{"}{name}{"}"}</span>
      <span className="text-[10px] font-extrabold text-slate-400 tracking-tight"> - {label}</span>
    </div>
  );
}
