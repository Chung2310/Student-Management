import React from 'react';
import { Activity, ShieldCheck } from 'lucide-react';
import { AdminToggle, SettingsPanel, SysStat } from './SettingsShared';

export function AdminSettingsPanel() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <SettingsPanel title="Thông tin vận hành" icon={Activity}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <SysStat label="Dung lượng DB" value="12.4 MB" />
            <SysStat label="Uptime" value="99.9%" />
            <SysStat label="Lần backup cuối" value="2 giờ trước" />
            <SysStat label="Phiên bản" value="v2.4.0-pro" />
            <SysStat label="Yêu cầu API" value="1.2k / ngày" />
            <SysStat label="Server Region" value="Asia-SE1" />
          </div>
        </SettingsPanel>

        <SettingsPanel title="Kiểm soát cấu hình chung" icon={ShieldCheck}>
          <div className="space-y-4">
            <AdminToggle label="Chế độ bảo trì hệ thống" disabled />
            <AdminToggle label="Cho phép đăng ký tài khoản mới" enabled />
            <AdminToggle label="Tự động backup hằng ngày" enabled />
            <AdminToggle label="Bật nhật ký hoạt động (Logs)" enabled />
          </div>
        </SettingsPanel>
      </div>

      <div className="space-y-6">
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <ShieldCheck size={120} />
          </div>
          <div className="relative z-10">
            <h4 className="text-lg font-black mb-4">Quyền hạn quản trị</h4>
            <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6">
              Mọi thay đổi trong module này có thể ảnh hưởng trực tiếp đến sự ổn định của hệ thống. Hãy kiểm tra kỹ trước khi thực hiện.
            </p>
            <button type="button" className="w-full py-4 bg-cyan-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-900/40 hover:bg-cyan-700 transition-all">
              Xác thực quyền Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
