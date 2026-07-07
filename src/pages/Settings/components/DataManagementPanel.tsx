import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Database, Download, FileJson, Info, RotateCcw, Upload } from 'lucide-react';
import { DataActionCard } from './SettingsShared';

interface ProgressState {
  current: number;
  total: number;
  message: string;
}

interface ShowResultState {
  show: boolean;
  count: number;
  type: 'Restore' | 'Import';
}

interface DataManagementPanelProps {
  isProcessing: boolean;
  progress: ProgressState;
  showResult: ShowResultState;
  setShowResult: React.Dispatch<React.SetStateAction<ShowResultState>>;
  restoreFileToConfirm: File | null;
  setRestoreFileToConfirm: React.Dispatch<React.SetStateAction<File | null>>;
  restoreInputRef: React.RefObject<HTMLInputElement | null>;
  restoreFileName: string;
  setRestoreFileName: React.Dispatch<React.SetStateAction<string>>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onBackup: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTriggerRestore: () => void;
  onRestoreFileSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExecuteRestore: (file: File) => void;
}

export function DataManagementPanel(props: DataManagementPanelProps) {
  const {
    isProcessing,
    progress,
    showResult,
    setShowResult,
    restoreFileToConfirm,
    setRestoreFileToConfirm,
    restoreInputRef,
    restoreFileName,
    setRestoreFileName,
    fileInputRef,
    onBackup,
    onImport,
    onTriggerRestore,
    onRestoreFileSelected,
    onExecuteRestore,
  } = props;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
      {isProcessing && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 px-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl flex flex-col items-center text-center space-y-6"
          >
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-slate-100 border-t-cyan-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Database className="w-8 h-8 text-cyan-600 animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-black text-slate-800">Cơ sở dữ liệu</h4>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{progress.message}</p>
            </div>
            {progress.total > 0 && (
              <div className="w-full space-y-2">
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-cyan-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-[10px] font-black text-cyan-600">{Math.round((progress.current / progress.total) * 100)}% HOÀN TẤT</p>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {showResult.show && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white rounded-[3rem] p-12 max-w-sm w-full shadow-2xl flex flex-col items-center text-center space-y-8"
          >
            <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center text-emerald-500 shadow-inner">
              <CheckCircle2 size={56} />
            </div>
            <div className="space-y-4">
              <h4 className="text-3xl font-black text-slate-900 leading-tight">
                {showResult.type === 'Restore' ? 'Khôi phục thành công!' : 'Nhập liệu thành công!'}
              </h4>
              <p className="text-slate-500 font-medium text-sm leading-relaxed px-4">
                {showResult.type === 'Restore'
                  ? `Hệ thống đã được làm mới hoàn toàn với ${showResult.count} học viên từ bản sao.`
                  : `Đã thêm thành công ${showResult.count} học viên vào danh sách hiện tại.`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowResult((current) => ({ ...current, show: false }))}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl text-sm font-black shadow-xl shadow-slate-200 hover:bg-black transition-all active:scale-95"
            >
              Đóng
            </button>
          </motion.div>
        </div>
      )}

      {restoreFileToConfirm && (
        <div className="fixed inset-0 z-[9990] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white rounded-[3rem] p-8 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col space-y-6"
          >
            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest text-left">Xác nhận khôi phục</h3>
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider text-left">Hành động nguy hiểm</p>
              </div>
            </div>

            <div className="space-y-4 text-left">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2.5">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tên tệp backup</span>
                  <p className="text-xs font-bold text-slate-800 break-all">{restoreFileToConfirm.name}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dung lượng</span>
                  <p className="text-xs font-bold text-slate-800">{(restoreFileToConfirm.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>

              <div className="p-4 bg-rose-50 border border-rose-100/50 rounded-2xl space-y-1.5 text-xs text-left">
                <p className="font-extrabold text-rose-700 leading-snug">QUY TRÌNH KHÔI PHỤC HỆ THỐNG:</p>
                <p className="font-medium text-rose-600/90 leading-relaxed">
                  1. Xóa sạch toàn bộ giao dịch, kỳ thi và học viên hiện có.
                  <br />
                  2. Nạp lại cấu hình và dữ liệu từ tệp backup này.
                </p>
                <p className="font-bold text-rose-700 mt-2 leading-snug">Hành động này không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục?</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setRestoreFileToConfirm(null);
                  if (restoreInputRef.current) restoreInputRef.current.value = '';
                }}
                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-black transition-all active:scale-95"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => onExecuteRestore(restoreFileToConfirm)}
                className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-rose-100 transition-all active:scale-95"
              >
                Xác nhận khôi phục
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <DataActionCard
        title="Backup (Xuất JSON)"
        description="Tải toàn bộ dữ liệu hiện tại về máy dưới dạng file .json để lưu trữ."
        icon={Download}
        actionLabel="Tải bản sao"
        color="indigo"
        onClick={onBackup}
      />

      <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={onImport} />
      <DataActionCard
        title="Import (Nhập dữ liệu)"
        description="Tải lên file JSON để thêm mới học viên hoặc dữ liệu hàng loạt."
        icon={Upload}
        actionLabel="Chọn file để nhập"
        color="blue"
        onClick={() => fileInputRef.current?.click()}
      />

      <input type="file" ref={restoreInputRef} className="hidden" accept=".json" onChange={onRestoreFileSelected} />
      <div className="flex flex-col space-y-3">
        <DataActionCard
          title="Restore (Khôi phục)"
          description="Khôi phục hệ thống về trạng thái của một bản backup cũ. Lưu ý: thao tác này sẽ ghi đè dữ liệu hiện tại."
          icon={RotateCcw}
          actionLabel="Tiến hành khôi phục"
          color="rose"
          onClick={onTriggerRestore}
        />
        {restoreFileName && (
          <div className="bg-rose-50 border border-rose-100 px-4 py-2 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-600">
              <FileJson size={14} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase truncate max-w-[150px]">{restoreFileName}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setRestoreFileName('');
                if (restoreInputRef.current) restoreInputRef.current.value = '';
              }}
              className="text-rose-400 hover:text-rose-600"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        )}
      </div>

      <div className="md:col-span-3 bg-cyan-50/50 rounded-[2rem] border border-cyan-100 p-6 flex items-start gap-4">
        <div className="p-3 bg-white rounded-xl shadow-sm text-cyan-600">
          <Info size={20} />
        </div>
        <div>
          <h4 className="text-sm font-black text-indigo-900 mb-1">An toàn dữ liệu</h4>
          <p className="text-xs font-medium text-cyan-600/80 leading-relaxed">
            Nên backup dữ liệu ít nhất mỗi tuần một lần. File backup có thể dùng để khôi phục hoặc chuyển dữ liệu sang hệ thống khác.
          </p>
        </div>
      </div>
    </div>
  );
}
