import React from 'react';
import { Student } from '../../../types';
import { formatDisplayDate } from '../../../lib/utils';
import { useAuth } from '../../../hooks/useAuth';

import { useCourses } from '../../../hooks/useCourses';

interface ProfileTabProps {
  student: Student;
}

export function ProfileTab({ student }: ProfileTabProps) {
  const { user } = useAuth();
  const businessType = user?.businessType || 'driving';
  const { courses } = useCourses(student.centerId || student.ownerId || undefined);
  const course = courses.find(c => c.id === student.courseId);
  const displayTitle = course ? course.title : student.rank;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm shadow-slate-200/50">
        <FormField label="HỌ VÀ TÊN*" value={student.fullName} />
        <FormField label="NGÀY SINH" value={formatDisplayDate(student.birthday)} />
        <FormField label="SỐ ĐIỆN THOẠI" value={student.phone} />
        <FormField label="EMAIL" value={student.email || 'Chưa cập nhật'} />
        <FormField label="NGƯỜI GIỚI THIỆU" value={student.referral || 'Trực tiếp'} />
        <FormField label="CCCD / CMND" value={student.idCard || 'Chưa cập nhật'} />
        
        {businessType === 'driving' ? (
          <FormField label="HẠNG BẰNG*" value={student.rank} />
        ) : (
          <FormField label="KHÓA HỌC ĐĂNG KÝ*" value={displayTitle || 'Chưa đăng ký'} />
        )}

        <FormField label="NGÀY ĐĂNG KÝ" value={formatDisplayDate(student.registrationDate)} />
        <FormField label="NGÀY NHẬP HỌC" value={formatDisplayDate(student.enrollmentDate || '') || 'Chưa cập nhật'} />
        <div className="md:col-span-2">
          <FormField label="ĐỊA CHỈ" value={student.address || 'Chưa cập nhật'} />
        </div>
        <div className="md:col-span-2">
          <FormField label="TRẠNG THÁI" value={Array.isArray(student.status) ? student.status.join(', ') : student.status} />
        </div>
      </div>

      {businessType === 'driving' && (
        <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm shadow-slate-200/50">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Giấy tờ & Ảnh hồ sơ</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <DocumentCard label="CCCD mặt trước" file={student.idCardFrontFile} />
            <DocumentCard label="CCCD mặt sau" file={student.idCardBackFile} />
            <DocumentCard label="CCCD trên VNeID" file={student.vneidIdCardFile} />
            <DocumentCard label="Ảnh chân dung" file={student.portraitFile} />
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{label}</label>
      <input type="text" value={value} readOnly className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 cursor-default" />
    </div>
  );
}

function DocumentCard({ label, file }: { label: string; file?: Student['idCardFrontFile'] }) {
  return (
    <div className="border border-slate-200 rounded-2xl p-4">
      <p className="text-xs font-bold text-slate-700 mb-3">{label}</p>
      {file ? (
        <a href={file.url} target="_blank" rel="noreferrer" className="block">
          <div className="h-36 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
            {file.type.includes('image') ? (
              <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-semibold text-slate-500">Mở tệp</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 truncate">{file.name}</p>
        </a>
      ) : (
        <div className="h-36 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-400">
          Chưa cập nhật
        </div>
      )}
    </div>
  );
}
