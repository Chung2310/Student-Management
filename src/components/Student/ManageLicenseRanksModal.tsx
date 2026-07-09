import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, Loader2 } from 'lucide-react';
import { useLicenseRanks } from '../../hooks/useLicenseRanks';
import { useToast } from '../../hooks/useToast';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

interface ManageLicenseRanksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ManageLicenseRanksModal({ isOpen, onClose }: ManageLicenseRanksModalProps) {
  const { user } = useAuth();
  const { ranks, loading, refetch } = useLicenseRanks();
  const [newRank, setNewRank] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const handleAdd = async () => {
    if (!newRank.trim()) {
      toast.error('Vui lòng nhập tên hạng bằng.');
      return;
    }
    setIsAdding(true);
    try {
      const res = await apiFetch<{ success: boolean; error?: string }>('/license-ranks', {
        method: 'POST',
        body: JSON.stringify({ name: newRank }),
      });
      if (res.success) {
        toast.success(`Đã thêm hạng bằng "${newRank.toUpperCase()}" thành công!`);
        setNewRank('');
        await refetch();
        window.dispatchEvent(new Event('license-rank-mutation'));
      } else {
        toast.error(res.error || 'Lỗi thêm hạng bằng.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi thêm hạng bằng.';
      toast.error(msg);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa hạng bằng "${name}"?`)) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await apiFetch<{ success: boolean; error?: string }>(`/license-ranks/${id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        toast.success(`Đã xóa hạng bằng "${name}" thành công!`);
        await refetch();
        window.dispatchEvent(new Event('license-rank-mutation'));
      } else {
        toast.error(res.error || 'Lỗi xóa hạng bằng.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi xóa hạng bằng.';
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider">Quản lý hạng bằng lái xe</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Thêm hoặc xóa các hạng bằng đào tạo trong hệ thống</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto">
              {isAdmin && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    disabled={isAdding}
                    placeholder="Nhập hạng bằng mới (ví dụ: A3)..."
                    value={newRank}
                    onChange={(e) => setNewRank(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    className="flex-1 h-11 bg-slate-50 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 outline-none focus:border-cyan-600 focus:bg-white transition-all disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={isAdding || !newRank.trim()}
                    className="h-11 px-5 rounded-xl bg-slate-900 hover:bg-black text-xs font-bold text-white transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
                  >
                    {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Thêm
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                {loading ? (
                  <div className="col-span-full py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-1.5 font-medium">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-600" /> Đang tải danh sách...
                  </div>
                ) : ranks.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-slate-400 text-xs italic">
                    Chưa có hạng bằng nào được cấu hình.
                  </div>
                ) : (
                  ranks.map((rank) => (
                    <div
                      key={rank.id}
                      className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-cyan-200 transition-all group"
                    >
                      <span className="text-sm font-black text-slate-800 tracking-tight">{rank.name}</span>
                      {isAdmin && (
                        <button
                          type="button"
                          disabled={deletingId === rank.id}
                          onClick={() => handleDelete(rank.id, rank.name)}
                          className="text-slate-400 hover:text-rose-500 p-1 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50 cursor-pointer"
                          title="Xóa"
                        >
                          {deletingId === rank.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-600 hover:text-slate-800 transition-all cursor-pointer bg-white"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
