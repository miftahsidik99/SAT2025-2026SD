import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirestore } from '../hooks/useFirestore';
import { useAuth } from '../hooks/useAuth';
import { NaskahDocument } from '../types';
import { FileText, Loader2, Trash2 } from 'lucide-react';

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getHistory, deleteNaskah, loading } = useFirestore();
  const [history, setHistory] = useState<NaskahDocument[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHistory = () => {
    if (user?.uid) {
      getHistory(user?.uid).then((data) => setHistory(data));
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user?.uid, getHistory]);

  const handleDelete = async (e: React.MouseEvent, docId: string) => {
    e.preventDefault(); 
    e.stopPropagation();

    if (window.confirm('Apakah Anda yakin ingin menghapus naskah ini?')) {
      setDeletingId(docId);
      const result = await deleteNaskah(docId);
      if (result && result.success) {
        setHistory(prev => prev.filter(doc => doc.id !== docId));
      } else {
        alert('Gagal menghapus naskah: ' + (result?.error || 'Unknown error'));
      }
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Riwayat Naskah</h1>
          <p className="text-slate-500 text-sm">Daftar naskah soal dan kisi-kisi yang telah Anda hasilkan.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 pb-4">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Koleksi Dokumen</span>
        </div>

        <div className="p-6 md:p-8 overflow-auto flex-1">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <p className="font-semibold text-lg text-slate-700">Belum ada naskah</p>
              <p className="text-sm">Buat naskah sumatif pertama Anda di halaman Generator.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => navigate(`/dokumen/${doc.id}`)}
                  className="group cursor-pointer bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-50 transition-all flex flex-col gap-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full uppercase tracking-wider">{doc.jenisSumatif}</span>
                       <button 
                         onClick={(e) => handleDelete(e, doc.id!)}
                         disabled={deletingId === doc.id}
                         className="p-1.5 z-10 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 border border-transparent rounded-md transition-all"
                         title="Hapus naskah"
                       >
                         {deletingId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                       </button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">{doc.title}</h3>
                    <div className="text-xs text-slate-500 flex flex-col gap-1 mt-2">
                      <span className="flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        {doc.sekolah}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        Kelas {doc.kelas} • {doc.mataPelajaran}
                      </span>
                      <span className="flex items-center gap-1 font-mono mt-1 text-slate-400">
                        {doc.tanggal !== '-' ? doc.tanggal : doc.tahunPelajaran}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
