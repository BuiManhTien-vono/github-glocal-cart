'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  Plus, Edit2, Trash2, Loader2, 
  FolderTree, Search, X, Check,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '@/lib/store';

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', description: '', parentCategoryId: null });
  const [saving, setSaving] = useState(false);
  const addNotification = useNotificationStore(state => state.addNotification);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await api.categories.getAll();
      setCategories(data);
    } catch (err) {
      addNotification('Không thể tải danh mục', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (cat: any = null) => {
    if (cat) {
      setEditingCategory(cat);
      setFormData({ name: cat.name, description: cat.description || '', parentCategoryId: cat.parentCategoryId });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '', parentCategoryId: null });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingCategory) {
        await api.admin.updateCategory(editingCategory.id, formData);
        addNotification('Cập nhật danh mục thành công', 'success');
      } else {
        await api.admin.createCategory(formData);
        addNotification('Thêm danh mục thành công', 'success');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      addNotification(err.message || 'Lỗi xử lý', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    try {
      const res = await api.admin.deleteCategory(id);
      if (res.success) {
        addNotification('Xóa danh mục thành công', 'success');
        fetchCategories();
      } else {
        addNotification(res.message || 'Không thể xóa', 'error');
      }
    } catch (err: any) {
      addNotification('Lỗi khi xóa danh mục', 'error');
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm danh mục..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-2xl pl-12 pr-6 py-3 outline-none focus:border-primary transition-all font-medium"
          />
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="w-full md:w-auto px-6 py-3 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus size={20} /> THÊM DANH MỤC
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((cat, i) => (
            <motion.div 
              key={cat.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card p-6 rounded-[32px] border border-border shadow-sm flex items-center justify-between group hover:border-primary/50 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <FolderTree size={24} />
                </div>
                <div>
                  <h4 className="font-black text-foreground">{cat.name}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-1">{cat.description || 'Không có mô tả'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleOpenModal(cat)} className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg transition-colors"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(cat.id)} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"><Trash2 size={16} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-card w-full max-w-lg rounded-[40px] border border-border shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-border flex items-center justify-between">
                <h3 className="text-2xl font-black uppercase tracking-tight">
                  {editingCategory ? 'Sửa Danh Mục' : 'Thêm Danh Mục Mới'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleSave} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Tên danh mục</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-bg-main border border-border rounded-2xl px-6 py-4 outline-none focus:border-primary font-bold transition-all"
                    placeholder="VD: Điện thoại, Máy tính..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Mô tả</label>
                  <textarea 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-bg-main border border-border rounded-2xl px-6 py-4 outline-none focus:border-primary font-medium min-h-[100px]"
                    placeholder="Mô tả ngắn về danh mục..."
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-70 shadow-xl shadow-primary/20"
                >
                  {saving ? <Loader2 size={24} className="animate-spin" /> : <Check size={24} />}
                  {saving ? 'ĐANG LƯU...' : 'LƯU DANH MỤC'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
