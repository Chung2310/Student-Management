import React from 'react';
import { Student } from '../../../types';
import { formatDisplayDate } from '../../../lib/utils';

interface ProfileTabProps {
  student: Student;
}

export function ProfileTab({ student }: ProfileTabProps) {
  return (
    <div className="space-y-6">
      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm shadow-slate-200/50">
        <FormField label="HỌ VÀ TÊN*" value={student.fullName} required />
        <FormField label="NGÀY SINH" value={formatDisplayDate(student.birthday)} />
        <FormField label="GIỚI TÍNH" value="Nam" type="select" />
        <FormField label="SỐ ĐIỆN THOẠI" value={student.phone} />
        <FormField label="EMAIL" value={student.email || 'Chưa cập nhật'} />
        <FormField label="NGƯỜI GIỚI THIỆU" value={student.referral || 'Trực tiếp'} />
        <FormField label="CCCD / CMND" value={student.idCard || 'Chưa cập nhật'} />
        <FormField label="HANG BẰNG*" value={student.rank} required type="select" />
        <FormField label="KHU VỰC*" value={student.area} required type="select" />
        <div className="md:col-span-2">
          <FormField label="NGÀY ĐĂNG KÝ" value={formatDisplayDate(student.registrationDate)} />
        </div>
        <div className="md:col-span-2">
          <FormField label=" ĐỊA CHỈ" value={student.address || 'Chưa cập nhật'} />
        </div>
        <div className="md:col-span-2">
          <FormField label=" TRẠNG THÁI" value={student.status} type="select" />
        </div>
        <div className="md:col-span-2">
          <FormField label=" GHI CHÚ" value="" isTextArea />
        </div>
      </div>
    </div>
  );
}

function FormField({ label, value, required = false, type = 'text', isTextArea = false }: { 
  label: string, 
  value: string, 
  required?: boolean, 
  type?: 'text' | 'select',
  isTextArea?: boolean
}) {
  return (
    <div className="space-y-1.5 sm:space-y-2 group">
      <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1 group-focus-within:text-cyan-600 transition-colors">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {isTextArea ? (
        <textarea 
          placeholder="Nhập ghi chú..."
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-cyan-600/5 focus:border-cyan-600 transition-all resize-none min-h-[100px]"
          readOnly
        />
      ) : (
        <div className="relative">
          <input
            type="text"
            value={value}
            readOnly
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-cyan-600/5 focus:border-cyan-600 transition-all cursor-default"
          />
          {type === 'select' && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronDownIcon />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 1L5 5L9 1" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
