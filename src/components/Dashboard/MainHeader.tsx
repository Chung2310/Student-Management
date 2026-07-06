import React, { useState } from 'react';
import { Home, ChevronRight, Menu, QrCode, X, Copy, Check, Download, Building } from 'lucide-react';
import { ViewType } from '../../App';
import { useAuth } from '../../hooks/useAuth';
import { useAdminCenters } from '../../hooks/useAdminCenters';

interface MainHeaderProps {
  currentView: ViewType;
  onMenuClick: () => void;
  selectedCenter?: string;
  onCenterChange?: (center: string) => void;
}

export function MainHeader({ currentView, onMenuClick, selectedCenter = 'all', onCenterChange }: MainHeaderProps) {
  const { user } = useAuth();
  const { centers } = useAdminCenters();
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const getViewName = (view: ViewType) => {
    const names: Record<ViewType, string> = {
      Dashboard: 'Tổng quan',
      Students: 'Học viên',
      Exams: 'Lịch thi',
      Fees: 'Học phí',
      Bot: 'BOT Thông báo',
      Courses: 'Khóa học',
      Batches: 'Lớp & Khai giảng',
      Resources: 'Thiết bị',
      UserManagement: user?.role === 'superadmin' ? 'Quản lý người dùng' : 'Quản lý giảng viên',
      SettingsAdmin: 'Cài đặt & Quản trị',
      Partners: 'Đối tác & CTV',
    };
    return names[view];
  };

  const registrationUrl = user ? `${window.location.origin}/register?teacherId=${user.uid}` : '';
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(registrationUrl)}`;

  const handleCopy = () => {
    if (!registrationUrl) return;
    navigator.clipboard.writeText(registrationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQrCode = async () => {
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `ma_qr_dang_ky_${user?.displayName?.replace(/\s+/g, '_') || 'giao_vien'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(qrImageUrl, '_blank');
    }
  };

  return (
    <>
      <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <nav className="flex items-center gap-2 text-sm font-medium text-slate-400">
            <Home className="w-4 h-4" />
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 font-semibold">{getViewName(currentView)}</span>
          </nav>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            {user.role === 'superadmin' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm">
                <Building className="w-4 h-4 text-slate-500" />
                <select
                  value={selectedCenter}
                  onChange={(e) => onCenterChange?.(e.target.value)}
                  className="bg-transparent text-slate-700 font-semibold text-xs md:text-sm focus:outline-none cursor-pointer pr-2"
                >
                  <option value="all">Tất cả trung tâm</option>
                  {centers.map((c) => (
                    <option key={c.uid} value={c.uid}>
                      {c.displayName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => setIsQrModalOpen(true)}
              title="Mã QR đăng ký học viên"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-cyan-600 hover:border-cyan-200 hover:bg-cyan-50/30 transition-all cursor-pointer text-xs font-bold shadow-sm"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Mã QR đăng ký</span>
            </button>
          </div>
        )}
      </header>

      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsQrModalOpen(false)}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2.5xl border border-slate-200 bg-white p-6 shadow-2xl z-10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Mã QR Đăng ký học viên</h2>
                  <p className="text-[10px] text-slate-500 font-medium">Dành cho học viên của {user?.displayName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="py-6 flex flex-col items-center justify-center gap-4">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl shadow-inner">
                <img
                  src={qrImageUrl}
                  alt="Mã QR đăng ký"
                  className="w-48 h-48 object-contain rounded-xl bg-white"
                />
              </div>

              <p className="text-center text-xs text-slate-400 leading-normal px-2">
                Học viên quét mã này để tự động đăng ký và liên kết thông tin vào tài khoản của bạn.
              </p>

              <div className="w-full flex items-center gap-2 bg-slate-50 border border-slate-100 p-1.5 rounded-xl">
                <input
                  type="text"
                  value={registrationUrl}
                  readOnly
                  className="flex-1 bg-transparent px-3 py-1 text-xs text-slate-600 font-mono select-all outline-none border-none"
                />
                <button
                  onClick={handleCopy}
                  className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-cyan-600 active:scale-95 transition-all cursor-pointer shadow-sm"
                  title="Sao chép liên kết"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <button
                onClick={downloadQrCode}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-100 cursor-pointer active:scale-98"
              >
                <Download className="w-4 h-4" /> Tải mã QR về máy
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
