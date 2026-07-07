import React from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { StudentLookup } from '../../components/Student/StudentLookup';

interface LookupPageProps {
  onBack: () => void;
}

export function LookupPage({ onBack }: LookupPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-850 font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-cyan-600 font-semibold text-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại Trang chủ
          </button>
          <div className="flex items-center gap-2">
            <img
              src="/logo-igen.png"
              alt="Logo"
              className="w-6 h-6 rounded object-contain"
            />
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">iGen Portal</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto shadow-sm">
            <Search className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tra cứu Tiến độ & Kết quả Học tập</h1>
          <p className="text-slate-500 text-sm font-semibold max-w-xl mx-auto">
            Nhập số Căn cước công dân (CCCD) của bạn để kiểm tra tức thời thông tin hồ sơ học viên, công nợ học phí và tiến trình đào tạo.
          </p>
        </div>

        {/* Render Lookup Card */}
        <div className="shadow-sm">
          <StudentLookup />
        </div>
      </main>
    </div>
  );
}
