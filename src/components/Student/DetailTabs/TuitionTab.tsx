import React from 'react';
import { CreditCard, History, Trash2, Pencil, Zap, AlertCircle } from 'lucide-react';
import { Student } from '../../../types';
import { cn, formatVND, parseVND } from '../../../lib/utils';

interface TuitionTabProps {
  student: Student;
  handleStartEditPayment: (p: any, idx: number) => void;
  handleDeletePaymentClick: (p: any, idx: number) => Promise<void>;
}

export function TuitionTab({
  student,
  handleStartEditPayment,
  handleDeletePaymentClick
}: TuitionTabProps) {
  return (
    <div className="space-y-6">
      {/* Fee Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeeCard 
          label="Tổng học phí" 
          amount={parseInt(parseVND(student.fee)) || 0} 
          icon={CreditCard}
          color="text-slate-800"
        />
        <FeeCard 
          label="Đã đóng" 
          amount={student.paidAmount || 0} 
          icon={CreditCard}
          color="text-emerald-600"
          isPaid
        />
        <FeeCard 
          label="Còn nợ" 
          amount={(parseInt(parseVND(student.fee)) || 0) - (student.paidAmount || 0)} 
          icon={AlertCircle}
          color="text-rose-600"
          isWarning
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment History */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-500" /> Nhật ký đóng phí
          </h3>
          <div className="space-y-3">
            {(student.paymentHistory || []).length > 0 ? (
              student.paymentHistory?.map((p, idx) => (
                <div key={idx} className="group relative flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/50 rounded-2xl border border-slate-100 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-500 shadow-sm border border-slate-100 shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-700">Thanh toán đợt {idx + 1}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{p.date} • {p.method}</p>
                      {p.note && <p className="text-[10px] text-slate-400 italic mt-0.5 max-w-[200px] truncate" title={p.note}>Ghi chú: {p.note}</p>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-800">{formatVND(p.amount)}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{p.recipient}</p>
                    </div>
                    
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleStartEditPayment(p, idx)}
                        className="p-2 bg-white hover:bg-cyan-50 border border-slate-200 hover:border-cyan-200 text-slate-500 hover:text-cyan-600 rounded-xl transition-all shadow-sm active:scale-90"
                        title="Sửa giao dịch"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeletePaymentClick(p, idx)}
                        className="p-2 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 rounded-xl transition-all shadow-sm active:scale-90"
                        title="Xóa giao dịch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 opacity-30">
                <History className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-xs font-bold text-slate-400 italic">Chưa có lịch sử thanh toán.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Payment Info */}
        <div className="lg:col-span-1 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-500 mb-4 shadow-inner shadow-cyan-100/50">
            <Zap className="w-8 h-8" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">Thông tin đóng phí</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-[180px]">Học viên cần hoàn tất học phí trước ngày thi sát hạch 15 ngày.</p>
          
          <div className="w-full mt-6 space-y-3">
            {(() => {
              const totalFee = parseInt(parseVND(student.fee)) || 0;
              const paid = student.paidAmount || 0;
              const remaining = totalFee - paid;
              
              let statusLabel = 'Chưa đóng';
              let statusColor = 'text-rose-500';
              let bgColor = 'bg-rose-50 border-rose-100';
              
              if (remaining <= 0 && totalFee > 0) {
                statusLabel = 'Đã đóng đủ';
                statusColor = 'text-emerald-600';
                bgColor = 'bg-emerald-50 border-emerald-100';
              } else if (paid > 0) {
                statusLabel = 'Còn thiếu';
                statusColor = 'text-amber-600';
                bgColor = 'bg-amber-50 border-amber-100';
              }

              return (
                <div className={cn("p-3 rounded-xl text-left border shadow-sm", bgColor)}>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Trạng thái hiện tại</p>
                  <p className={cn("text-xs font-black mt-1", statusColor)}>
                    {statusLabel}
                  </p>
                </div>
              );
            })()}
            <button className="w-full py-3 bg-cyan-600 text-white rounded-xl text-xs font-bold hover:bg-cyan-700 transition-all active:scale-95 shadow-lg shadow-cyan-100 mt-2">
              Nhắc nhở đóng phí
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FeeCardProps {
  label: string;
  amount: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  isPaid?: boolean;
  isWarning?: boolean;
}

function FeeCard({ label, amount, icon: Icon, color, isPaid, isWarning }: FeeCardProps) {
  return (
    <div className={cn(
      "bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden",
      isPaid && "bg-emerald-50/20 border-emerald-100",
      isWarning && "bg-rose-50/20 border-rose-100"
    )}>
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm",
          color
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{label}</p>
      </div>
      <p className={cn("text-2xl font-black tracking-tight whitespace-nowrap", color)}>
        {formatVND(amount)}đ
      </p>
    </div>
  );
}
