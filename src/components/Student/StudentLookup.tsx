import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Search, Loader2, AlertCircle, BarChart3,
  BookOpen, Award, CreditCard
} from 'lucide-react';
import { parseVND } from '../../lib/utils';

interface ExamResult {
  theory?: number | string;
  practice?: number | string;
  simulation?: number | string;
  overall?: string;
}

interface Exam {
  name: string;
  date: string;
  type: string;
  result?: ExamResult;
}

interface Installment {
  installmentNo: number;
  percent: number;
  amountDue: number;
  status: string;
  paidAt?: string;
}

interface LookupResult {
  fullName: string;
  idCard: string;
  birthday?: string;
  rank?: string;
  status?: string | string[];
  progress?: {
    dat?: { kmDone: number; totalKm: number };
    cabin?: { hoursDone: number; totalHours: number };
    practice?: { hoursDone: number; totalHours: number };
    theory?: { completed: boolean; lastDate?: string };
    sim?: { completed: boolean; lastDate?: string };
  };
  exams?: Exam[];
  fee?: string | number;
  paidAmount?: number;
  installmentStatus?: Installment[];
}

export function StudentLookup() {
  const [lookupIdCard, setLookupIdCard] = useState('');
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');

  const totalFee = lookupResult ? parseInt(parseVND(String(lookupResult.fee || '0')), 10) || 0 : 0;
  const paidAmount = lookupResult?.paidAmount || 0;
  const remainingFee = Math.max(0, totalFee - paidAmount);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupIdCard.trim()) {
      setLookupError('Vui lòng nhập số CCCD.');
      return;
    }
    setLookupLoading(true);
    setLookupError('');
    setLookupResult(null);

    try {
      const response = await fetch(`/api/v1/students/public-lookup?idCard=${encodeURIComponent(lookupIdCard.trim())}`);
      const resData = await response.json();
      if (!response.ok || !resData.success) {
        setLookupError(resData.error || 'Không tìm thấy thông tin học viên với số CCCD này.');
      } else {
        setLookupResult(resData.data);
      }
    } catch (err) {
      console.error(err);
      setLookupError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm">
      <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Nhập số CCCD (12 số) để tra cứu..."
            value={lookupIdCard}
            onChange={(e) => setLookupIdCard(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-inner"
          />
        </div>
        <button
          type="submit"
          disabled={lookupLoading}
          className="px-8 py-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl font-bold shadow-md shadow-cyan-100 hover:shadow-cyan-200/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
        >
          {lookupLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          {lookupLoading ? 'Đang tìm...' : 'Tra cứu'}
        </button>
      </form>

      {lookupError && (
        <div className="mt-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {lookupError}
        </div>
      )}

      {lookupResult && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 border-t border-slate-200 pt-8 space-y-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm animate-fade-in">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Học viên</p>
              <h4 className="text-xl font-black text-slate-900 tracking-tight">{lookupResult.fullName}</h4>
              <p className="text-xs text-slate-500 font-semibold mt-1">CCCD: {lookupResult.idCard} | Ngày sinh: {lookupResult.birthday || 'Chưa cập nhật'}</p>
            </div>
            <div className="flex flex-wrap gap-2 md:text-right">
              <span className="px-3 py-1.5 rounded-xl bg-cyan-50 text-cyan-600 font-bold border border-cyan-100 text-xs uppercase tracking-wider h-fit">
                Hạng/Lớp: {lookupResult.rank}
              </span>
              {lookupResult.status && (Array.isArray(lookupResult.status) ? lookupResult.status : [lookupResult.status]).map((st: string, idx: number) => (
                <span key={idx} className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 font-bold border border-emerald-100 text-xs uppercase tracking-wider h-fit">
                  {st}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
              <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                <BarChart3 className="w-4 h-4 text-cyan-600" /> Tiến độ thực hành & DAT
              </h5>

              {lookupResult.progress?.dat && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Quãng đường DAT (đã đi)</span>
                    <span>{lookupResult.progress.dat.kmDone} / {lookupResult.progress.dat.totalKm} km</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (lookupResult.progress.dat.kmDone / lookupResult.progress.dat.totalKm) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {lookupResult.progress?.cabin && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Thời gian học Cabin</span>
                    <span>{lookupResult.progress.cabin.hoursDone} / {lookupResult.progress.cabin.totalHours} giờ</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (lookupResult.progress.cabin.hoursDone / lookupResult.progress.cabin.totalHours) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {lookupResult.progress?.practice && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Giờ học Thực hành</span>
                    <span>{lookupResult.progress.practice.hoursDone} / {lookupResult.progress.practice.totalHours} giờ</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (lookupResult.progress.practice.hoursDone / lookupResult.progress.practice.totalHours) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
              <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                <BookOpen className="w-4 h-4 text-cyan-600" /> Lý thuyết & Mô phỏng
              </h5>

              {lookupResult.progress?.theory && (
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div>
                    <p className="text-xs font-bold text-slate-700">Đào tạo Lý thuyết</p>
                    <p className="text-[10px] text-slate-400 font-semibold">Cập nhật: {lookupResult.progress.theory.lastDate || 'Chưa thi thử'}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    lookupResult.progress.theory.completed
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {lookupResult.progress.theory.completed ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
                  </span>
                </div>
              )}

              {lookupResult.progress?.sim && (
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div>
                    <p className="text-xs font-bold text-slate-700">Học Cabin Mô phỏng (Sim)</p>
                    <p className="text-[10px] text-slate-400 font-semibold">Cập nhật: {lookupResult.progress.sim.lastDate || 'Chưa học xong'}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    lookupResult.progress.sim.completed
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {lookupResult.progress.sim.completed ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {lookupResult.exams && lookupResult.exams.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                <Award className="w-4 h-4 text-cyan-600" /> Kết quả thi tốt nghiệp / sát hạch
              </h5>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <th className="py-2.5">Kỳ thi</th>
                      <th className="py-2.5">Ngày thi</th>
                      <th className="py-2.5">Loại hình</th>
                      <th className="py-2.5 text-center">Lý thuyết</th>
                      <th className="py-2.5 text-center">Thực hành</th>
                      <th className="py-2.5 text-center">Mô phỏng</th>
                      <th className="py-2.5 text-right">Kết quả</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-600">
                    {lookupResult.exams.map((ex: Exam, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 font-bold text-slate-800">{ex.name}</td>
                        <td className="py-3 text-slate-500">{ex.date}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ex.type === 'Sát hạch' ? 'bg-cyan-50 text-cyan-600 border border-cyan-100' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {ex.type}
                          </span>
                        </td>
                        <td className="py-3 text-center font-mono">{ex.result?.theory ?? '-'}</td>
                        <td className="py-3 text-center font-mono">{ex.result?.practice ?? '-'}</td>
                        <td className="py-3 text-center font-mono">{ex.result?.simulation ?? '-'}</td>
                        <td className="py-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ex.result?.overall === 'Đậu'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              : ex.result?.overall === 'Trượt'
                                ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                : 'bg-slate-100 text-slate-500'
                          }`}>
                            {ex.result?.overall || 'Chưa có'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
            <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
              <CreditCard className="w-4 h-4 text-cyan-600" /> Tình hình đóng học phí
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Học phí trọn gói</span>
                <span className="text-base font-black text-slate-800 font-mono">
                  {totalFee.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Đã nộp</span>
                <span className="text-base font-black text-emerald-600 font-mono">
                  {paidAmount.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Còn nợ</span>
                <span className="text-base font-black text-rose-600 font-mono">
                  {remainingFee.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            {lookupResult.installmentStatus && lookupResult.installmentStatus.length > 0 && (
              <div className="space-y-3 pt-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kế hoạch thu học phí</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {lookupResult.installmentStatus.map((inst: Installment, idx: number) => (
                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-850">Đợt {inst.installmentNo} ({inst.percent}%)</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          inst.status === 'Đã thu'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : inst.status === 'Đã gửi'
                              ? 'bg-cyan-50 text-cyan-600 border border-cyan-100'
                              : 'bg-slate-150 text-slate-550'
                        }`}>
                          {inst.status}
                        </span>
                      </div>
                      <p className="text-sm font-black text-slate-700 font-mono">{(inst.amountDue || 0).toLocaleString('vi-VN')} đ</p>
                      {inst.paidAt && (
                        <p className="text-[9px] text-slate-400 font-semibold mt-1">Nộp ngày: {new Date(inst.paidAt).toLocaleDateString('vi-VN')}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
