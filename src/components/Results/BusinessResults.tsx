import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Download, RefreshCcw, Users, 
  Wallet, PiggyBank, AlertTriangle, ChevronDown
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStudents } from '../../hooks/useStudents';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { FeePayment } from '../../types';
import { useLicenseRanks } from '../../hooks/useLicenseRanks';

export function BusinessResults() {
  const { students } = useStudents();
  const { user } = useAuth();
  const { ranks: licenseRanks } = useLicenseRanks();
  const [payments, setPayments] = useState<FeePayment[]>([]);
  
  const [reportPeriod, setReportPeriod] = useState('Tháng này');
  const [sourceFilter, setSourceFilter] = useState('Mọi nguồn');
  const [rankFilter, setRankFilter] = useState('Mọi hạng');

  // Fetch all payments for this owner
  useEffect(() => {
    if (!user) return;
    
    const fetchPayments = async () => {
      try {
        const res = await apiFetch("/payments");
        if (res.success && res.payments) {
          const pData = res.payments.map((p: Record<string, unknown>) => ({
            id: p._id,
            ...p,
          })) as FeePayment[];
          setPayments(pData);
        }
      } catch (error) {
        console.error("Error fetching payments:", error);
      }
    };

    fetchPayments();

    window.addEventListener("payment-mutation", fetchPayments);
    return () => {
      window.removeEventListener("payment-mutation", fetchPayments);
    };
  }, [user]);

  // Calculations
  const stats = useMemo(() => {
    const parseCurrency = (val: string | number) => {
      if (typeof val === 'number') return val;
      if (!val) return 0;
      return parseInt(val.toString().replace(/[^\d]/g, '') || '0');
    };

    const parseDate = (dStr: string) => {
      if (!dStr) return null;
      // Handle DD/MM/YYYY
      const parts = dStr.split('/');
      if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
      return new Date(dStr);
    };

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    let filteredStudents = students;
    if (sourceFilter !== 'Mọi nguồn') filteredStudents = filteredStudents.filter(s => s.referral === sourceFilter);
    if (rankFilter !== 'Mọi hạng') filteredStudents = filteredStudents.filter(s => s.rank === rankFilter);

    if (reportPeriod === 'Tháng này') {
      filteredStudents = filteredStudents.filter(s => {
        const regDate = s.registrationDate ? parseDate(s.registrationDate) : (s.createdAt ? new Date(s.createdAt) : null);
        return regDate && regDate >= startOfThisMonth;
      });
    } else if (reportPeriod === 'Tháng trước') {
      filteredStudents = filteredStudents.filter(s => {
        const regDate = s.registrationDate ? parseDate(s.registrationDate) : (s.createdAt ? new Date(s.createdAt) : null);
        return regDate && regDate >= startOfLastMonth && regDate <= endOfLastMonth;
      });
    }
    // If 'Tất cả thời gian', no time-based filtering is applied

    const totalCount = filteredStudents.length;
    const totalRegistrationFee = filteredStudents.reduce((sum, s) => sum + parseCurrency(s.fee), 0);
    
    // NEW: Calculate debt based on these filtered students' total unpaid balance
    const totalDebtFromScope = filteredStudents.reduce((sum, s) => {
      const fee = parseCurrency(s.fee);
      const paidCovered = s.paidAmount || 0;
      return sum + (fee - paidCovered);
    }, 0);

    // 2. Filter Payments (for Cash Flow KPI)
    let filteredPayments = payments;
    if (reportPeriod === 'Tháng này') {
      filteredPayments = filteredPayments.filter(p => {
        const pDate = parseDate(p.date) || (p.createdAt ? new Date(p.createdAt) : null);
        return pDate && pDate >= startOfThisMonth;
      });
    } else if (reportPeriod === 'Tháng trước') {
      filteredPayments = filteredPayments.filter(p => {
        const pDate = parseDate(p.date) || (p.createdAt ? new Date(p.createdAt) : null);
        return pDate && pDate >= startOfLastMonth && pDate <= endOfLastMonth;
      });
    }

    const totalPaidInPeriod = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const collectionRate = totalRegistrationFee > 0 ? Math.round((totalPaidInPeriod / totalRegistrationFee) * 100) : 0;
    const avgFee = totalCount > 0 ? Math.round(totalRegistrationFee / totalCount) : 0;
    const debtRate = totalRegistrationFee > 0 ? Math.round((totalDebtFromScope / totalRegistrationFee) * 100) : 0;

    return {
      totalCount,
      totalFee: totalRegistrationFee,
      totalPaid: totalPaidInPeriod,
      totalDebt: totalDebtFromScope,
      collectionRate,
      avgFee,
      debtRate
    };
  }, [students, payments, reportPeriod, sourceFilter, rankFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black text-cyan-600 uppercase tracking-[0.2em] mb-1">Phân tích tuyển sinh & dòng tiền</p>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Kết quả kinh doanh</h1>
          <p className="text-slate-400 text-sm font-medium mt-1 leading-relaxed max-w-2xl">
            Đo lường theo học viên có một trong kỳ (ngày đăng ký hồ sơ, hoặc ngày tạo nếu chưa có đăng ký).
          </p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 text-white rounded-xl text-sm font-black shadow-lg shadow-cyan-100 hover:bg-cyan-700 transition-all self-start md:self-auto">
          <Download className="w-4 h-4" /> Xuất CSV
        </button>
      </div>

      {/* Guide Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GuideCard 
          step="1" 
          title="Kỳ" 
          desc="Chỉ tính học viên có ngày đăng ký (hoặc ngày tạo hồ sơ) nằm trong khoảng thời gian bạn chọn." 
        />
        <GuideCard 
          step="2" 
          title="Phạm vi" 
          desc="Lọc thêm theo nguồn giới thiệu, khu vực và hạng bằng để tập trung vào một phân khúc." 
        />
        <GuideCard 
          step="3" 
          title="Chỉ số" 
          desc="KPI tổng và ma trận theo từng tổ hợp; bấm tiêu đề cột để sắp xếp nhiều lớp (số trên = thứ tự ưu tiên)." 
        />
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <FilterSelect 
            label="Kỳ báo cáo" 
            value={reportPeriod} 
            onChange={setReportPeriod}
            options={['Tất cả thời gian', 'Tháng này', 'Tháng trước', 'Quý này', 'Năm nay']}
          />
          <FilterSelect 
            label="Nguồn giới thiệu" 
            value={sourceFilter} 
            onChange={setSourceFilter}
            options={['Mọi nguồn', 'Facebook', 'Website', 'Zalo', 'Giới thiệu']}
          />
          <FilterSelect 
            label="Hạng bằng" 
            value={rankFilter} 
            onChange={setRankFilter}
            options={['Mọi hạng', ...licenseRanks.map(r => r.name)]}
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-2 px-4 py-2 bg-cyan-50 text-cyan-600 rounded-full text-xs font-black">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {reportPeriod === 'Tháng này' ? `Tháng ${(new Date()).getMonth() + 1}/${(new Date()).getFullYear()}` : 
               reportPeriod === 'Tháng trước' ? `Tháng ${(new Date()).getMonth() || 12}/${(new Date()).getMonth() === 0 ? (new Date()).getFullYear() - 1 : (new Date()).getFullYear()}` : 
               reportPeriod} - {stats.totalCount} học viên
            </span>
          </div>
          <button 
            onClick={() => {
              setReportPeriod('Tháng này');
              setSourceFilter('Mọi nguồn');
              setRankFilter('Mọi hạng');
            }}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            <RefreshCcw className="w-3 h-3" /> Đặt lại
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        <KPICard 
          value={stats.totalCount.toString()} 
          label="Học viên trong phạm vi" 
          icon={Users} 
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <KPICard 
          value={formatCurrency(stats.totalFee)} 
          label="Học phí đăng ký (hồ sơ)" 
          icon={Wallet} 
          iconBg="bg-cyan-50"
          iconColor="text-cyan-600"
        />
        <KPICard 
          value={formatCurrency(stats.totalPaid)} 
          label="Đã thu" 
          icon={PiggyBank} 
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <KPICard 
          value={formatCurrency(stats.totalDebt)} 
          label="Còn nợ" 
          icon={AlertTriangle} 
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
        />
      </div>

      {/* Progress Bar Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black text-slate-800 tracking-tight">Thu hồi so với học phí đăng ký</h3>
        </div>
        <div className="space-y-4">
          <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${stats.collectionRate}%` }}
              className="h-full bg-gradient-to-r from-cyan-500 via-cyan-600 to-emerald-500 rounded-full"
            />
          </div>
          <p className="text-xs font-bold text-slate-500">
            Đã thu được <span className="text-cyan-600 font-black">{stats.collectionRate}%</span> học phí ghi trên hồ sơ trong phạm vi đang xem.
          </p>
        </div>
      </div>

      {/* Secondary Stats Footer */}
      <div className="bg-slate-50/50 rounded-[2.5rem] border border-slate-100 p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">Trung bình học phí / học viên</span>
          <span className="text-sm font-black text-slate-800">{formatCurrency(stats.avgFee)} / HV</span>
        </div>
        <div className="flex items-center justify-between md:border-l md:border-slate-200 md:pl-8">
          <span className="text-xs font-bold text-slate-500">Nợ so với học phí đăng ký</span>
          <span className="text-sm font-black text-slate-800">{stats.debtRate}% học phí</span>
        </div>
      </div>
    </div>
  );
}

function GuideCard({ step, title, desc }: { step: string, title: string, desc: string }) {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-50 p-6 relative group hover:border-cyan-100 transition-all cursor-default">
      <div className="flex items-center gap-4 mb-3">
        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-xs font-black text-slate-400 group-hover:bg-cyan-50 group-hover:text-cyan-600 transition-all">
          {step}
        </div>
        <h4 className="text-sm font-black text-slate-800 tracking-tight">{title}</h4>
      </div>
      <p className="text-[11px] leading-relaxed text-slate-400 font-medium">{desc}</p>
      <div className="absolute top-6 right-6 text-slate-200 group-hover:text-cyan-100 transition-colors">
        <ChevronDown size={16} />
      </div>
    </div>
  );
}

interface KPICardProps {
  value: string;
  label: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

function KPICard({ value, label, icon: Icon, iconBg, iconColor }: KPICardProps) {
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/30 p-5 lg:p-6 flex flex-row items-center gap-4 group hover:shadow-2xl hover:shadow-cyan-100 transition-all min-w-0">
      <div className={cn("w-12 h-12 lg:w-16 lg:h-16 rounded-[1.2rem] lg:rounded-[1.5rem] flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-inner", iconBg)}>
        <Icon className={cn("w-6 h-6 lg:w-8 lg:h-8", iconColor)} />
      </div>
      <div className="min-w-0">
        <h4 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-black text-slate-900 tracking-tighter mb-0.5 whitespace-nowrap overflow-visible">
          {value}
        </h4>
        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight whitespace-normal">
          {label}
        </p>
      </div>
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}

function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</label>
      <div className="relative group">
        <select 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-5 pr-12 text-sm font-bold text-slate-700 outline-none appearance-none focus:border-cyan-600 focus:bg-white transition-all cursor-pointer"
        >
          {options.map((opt: string) => (
            <option key={opt}>{opt}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-hover:text-cyan-600 pointer-events-none transition-all" />
      </div>
    </div>
  );
}
