import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, FileText, Loader2, Save, CreditCard } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { Student } from '../../types';
import { useAuth } from '../../hooks/useAuth';

interface AddPaymentModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddPaymentModal({ student, isOpen, onClose, onSuccess }: AddPaymentModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  React.useEffect(() => {
    if (isOpen && student) {
      const timer = setTimeout(() => {
        const totalFee = parseInt(student.fee.replace(/\D/g, ''));
        const remaining = totalFee - (student.paidAmount || 0);
        if (remaining > 0) {
          setAmount(new Intl.NumberFormat('vi-VN').format(remaining));
        } else {
          setAmount('');
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, student]);

  if (!isOpen || !student || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Safety check for inputs
    if (!amount || !student) return;

    try {
      const rawAmount = amount.replace(/\D/g, '');
      const rawFee = (student.fee || '0').replace(/\D/g, '');
      
      const payAmount = parseInt(rawAmount, 10);
      const totalFee = parseInt(rawFee, 10);
      const paidSoFar = student.paidAmount || 0;
      const remaining = totalFee - paidSoFar;
      
      if (isNaN(payAmount) || payAmount <= 0) {
        alert("Vui lòng nhập số tiền hợp lệ");
        return;
      }

      if (payAmount > remaining) {
        alert("Số tiền đóng vượt quá số tiền còn nợ. Vui lòng kiểm tra lại!");
        return;
      }

      setIsSubmitting(true);

      await apiFetch("/payments", {
        method: "POST",
        body: JSON.stringify({
          studentId: student.id,
          studentName: student.fullName,
          amount: payAmount,
          date: date.includes("-") ? date.split('-').reverse().join('/') : date,
          note: note.trim(),
        }),
      });

      // Dispatch events to refresh lists
      window.dispatchEvent(new Event("payment-mutation"));
      window.dispatchEvent(new Event("student-mutation"));

      alert("Ghi nhận thanh toán thành công!");
      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error("Payment Submission Error:", error);
      alert("Đã có lỗi xảy ra khi ghi nhận thanh toán: " + (error instanceof Error ? error.message : "Lỗi không xác định"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatInputCurrency = (val: string) => {
    const raw = val.replace(/\D/g, '');
    if (!raw) return '';
    return new Intl.NumberFormat('vi-VN').format(parseInt(raw));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <h3 className="text-xl font-extrabold text-slate-800">Thanh toán học phí</h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto no-scrollbar">
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100/50 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 leading-none">{student.fullName}</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1.5 ">
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Học phí: {student.fee}đ</p>
                  <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-300" />
                  <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                    Còn nợ: {new Intl.NumberFormat('vi-VN').format(parseInt(student.fee.replace(/\D/g, '')) - (student.paidAmount || 0))}đ
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Số tiền đóng (VNĐ)*</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={amount}
                    onChange={(e) => setAmount(formatInputCurrency(e.target.value))}
                    placeholder="VD: 5.000.000"
                    className="w-full h-14 bg-slate-50 px-5 rounded-2xl border border-slate-200 text-lg font-black text-indigo-600 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">VNĐ</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Ngày đóng</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    maxLength={10}
                    required
                    value={date}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length > 8) val = val.substring(0, 8);
                      if (val.length > 4) {
                        val = val.substring(0, 2) + '/' + val.substring(2, 4) + '/' + val.substring(4);
                      } else if (val.length > 2) {
                        val = val.substring(0, 2) + '/' + val.substring(2);
                      }
                      setDate(val);
                    }}
                    className="w-full h-14 bg-slate-50 px-5 rounded-2xl border border-slate-200 text-base font-bold text-slate-800 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                  />
                  <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Ghi chú</label>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="VD: Đóng đợt 1, chuyển khoản..."
                    className="w-full p-5 bg-slate-50 rounded-2xl border border-slate-200 text-sm font-medium text-slate-800 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 transition-all resize-none"
                  />
                  <FileText className="absolute right-5 top-5 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-14 bg-slate-100 text-slate-600 rounded-2xl text-base font-black hover:bg-slate-200 transition-all"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-[2] flex items-center justify-center gap-3 h-14 bg-indigo-600 text-white rounded-2xl text-base font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Xác nhận
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
