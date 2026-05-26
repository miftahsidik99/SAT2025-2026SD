import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirestore } from '../hooks/useFirestore';
import { useAuth } from '../hooks/useAuth';
import { GeneratorConfig } from '../types';
import { Loader2 } from 'lucide-react';

const MATA_PELAJARAN = [
  'Pendidikan Agama dan Budi Pekerti',
  'Pendidikan Pancasila',
  'Bahasa Indonesia',
  'Matematika',
  'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
  'Pendidikan Jasmani, Olahraga, dan Kesehatan',
  'Seni Budaya',
  'Bahasa Inggris',
  'Muatan Lokal',
];

export default function Home() {
  const navigate = useNavigate();
  const { saveNaskah } = useFirestore();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [errorPrompt, setErrorPrompt] = useState<string | null>(null);

  const [form, setForm] = useState<GeneratorConfig>({
    sekolah: '',
    tahunPelajaran: '2025/2026',
    jenisSumatif: 'SAS',
    mataPelajaran: MATA_PELAJARAN[0],
    kelas: '1',
    tanggal: '',
    proporsiHOTS: 20,
    proporsiMOTS: 50,
    proporsiLOTS: 30,
    jmlPG: 15,
    jmlPGK: 5,
    jmlUraianSingkat: 5,
    jmlEssay: 5,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.proporsiHOTS + form.proporsiMOTS + form.proporsiLOTS !== 100) {
      setErrorPrompt('Total proporsi kognitif (HOTS+MOTS+LOTS) harus 100%.');
      return;
    }
    setErrorPrompt(null);
    setLoading(true);

    try {
      const prompt = `Anda adalah ahli kurikulum SD merujuk pada Permendikdasmen nomor 13 tahun 2026.
Tugas: Buat Naskah Sumatif dengan identitas:
- Mata Pelajaran: ${form.mataPelajaran}
- Kelas: ${form.kelas} (SD)
- Periode/Jenis: ${form.jenisSumatif}
- Proporsi Soal: HOTS ${form.proporsiHOTS}%, MOTS ${form.proporsiMOTS}%, LOTS ${form.proporsiLOTS}%
- Jumlah Soal: Pilihan Ganda (PG) ${form.jmlPG}, Pilihan Ganda Kompleks/Menjodohkan (PGK) ${form.jmlPGK}, Uraian Singkat ${form.jmlUraianSingkat}, Essay ${form.jmlEssay}

Buat output JSON dengan struktur berikut (jangan gunakan markdown, langsung valid JSON):
{
  "cpTpAtp": {
    "elemen": "String", "capaianPembelajaran": "String", "tujuanPembelajaran": ["String"], "alurTujuanPembelajaran": "String"
  },
  "kisiKisi": [ { "tujuanPembelajaran": "String", "materiPokok": "String", "levelKognitif": "L1|L2|L3", "bentukSoal": "String", "nomorButir": "String" } ],
  "soalPG": [ { "nomor": Number, "stimulus": "Teks/Kasus kontekstual relevan dengan keseharian siswa SD", "gambarPrompt": "Kosongkan jika tidak perlu. Jika butuh visual, tulis sangat singkat dlm Bhs Inggris maks 3 kata (contoh: 'student studying', 'solar system', 'water cycle')", "pertanyaan": "String", "opsi": ["A","B","C","D"], "kunci": "String" } ],
  "soalPGK": [ { "nomor": Number, "stimulus": "String", "gambarPrompt": "String / Kosongkan", "pertanyaan": "String", "kunci": "String" } ],
  "soalUraianSingkat": [ { "nomor": Number, "stimulus": "String", "gambarPrompt": "String / Kosongkan", "pertanyaan": "String", "kunci": "String" } ],
  "soalEssay": [ { "nomor": Number, "stimulus": "String", "gambarPrompt": "String / Kosongkan", "pertanyaan": "String", "kunci": "String" } ],
  "rubrikPenilaian": [ { "nomor": "String", "kriteria": "String", "skorMaksimal": Number, "pedoman": [{"skor": Number, "deskripsi": "String"}] } ]
}
Selalu gunakan konteks yang bermakna bagi SD.`;

      const res = await fetch('/api/generate-naskah', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        throw new Error('Gagal men-generate naskah. Silakan coba lagi.');
      }

      const data = await res.json();
      const contentJson = JSON.stringify(data.result);

      // Simpan ke Firestore
      if (!user?.uid) throw new Error("Unauthenticated");
      
      const docId = await saveNaskah({
        title: `Naskah ${form.jenisSumatif} ${form.mataPelajaran} Kls ${form.kelas}`,
        sekolah: form.sekolah,
        tahunPelajaran: form.tahunPelajaran,
        jenisSumatif: form.jenisSumatif,
        mataPelajaran: form.mataPelajaran,
        kelas: form.kelas,
        tanggal: form.tanggal || '-',
        contentJson,
        ownerId: user.uid,
      });

      navigate(`/dokumen/${docId}`);
    } catch (err: any) {
      console.error(err);
      setErrorPrompt(err.message || 'Terjadi kesalahan sistem.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Generator Naskah Soal</h1>
          <p className="text-slate-500 text-sm">Buat naskah Sumatif yang terstruktur berdasarkan Permendikdasmen 13/2026.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50"
            onClick={() => {
              setForm({
                sekolah: '',
                tahunPelajaran: '2025/2026',
                jenisSumatif: 'SAS',
                mataPelajaran: MATA_PELAJARAN[0],
                kelas: '1',
                tanggal: '',
                proporsiHOTS: 20,
                proporsiMOTS: 50,
                proporsiLOTS: 30,
                jmlPG: 15,
                jmlPGK: 5,
                jmlUraianSingkat: 5,
                jmlEssay: 5,
              });
            }}
          >
            Reset Atur Ulang
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 pb-10">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Formulir Identitas & Struktur</span>
        </div>
        
        <form onSubmit={handleGenerate} className="p-6 md:p-8 space-y-8 overflow-auto">
          {/* Identitas Section */}
          <div>
            <h3 className="text-sm uppercase tracking-widest text-slate-400 font-bold mb-4 flex items-center gap-2">
              Langkah 1: Identitas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-2">Nama Sekolah</label>
                <input required type="text" name="sekolah" value={form.sekolah} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-slate-800" placeholder="SDN 1 Contoh" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-2">Tahun Pelajaran</label>
                <input required type="text" name="tahunPelajaran" value={form.tahunPelajaran} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-slate-800" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-2">Jenis Sumatif</label>
                <select name="jenisSumatif" value={form.jenisSumatif} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 bg-white outline-none text-slate-800">
                  <option value="SAS">SAS (Sumatif Akhir Semester Ganjil)</option>
                  <option value="SAT">SAT (Sumatif Akhir Tahun Genap)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-2">Mata Pelajaran</label>
                <select name="mataPelajaran" value={form.mataPelajaran} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 bg-white outline-none text-slate-800">
                  {MATA_PELAJARAN.map(mp => <option key={mp} value={mp}>{mp}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-2">Kelas</label>
                <select name="kelas" value={form.kelas} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 bg-white outline-none text-slate-800">
                  {[1, 2, 3, 4, 5, 6].map(k => <option key={k} value={k}>Kelas {k}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-2">Tanggal Pelaksanaan (opsional)</label>
                <input type="date" name="tanggal" value={form.tanggal} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 max-h-11 bg-white outline-none text-slate-800" />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 mt-8 mb-8"></div>

          {/* Struktur Soal Section */}
          <div>
            <h3 className="text-sm uppercase tracking-widest text-slate-400 font-bold mb-4 flex items-center gap-2">
              Langkah 2: Proporsi & Jumlah Soal
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100">
                <label className="block text-xs font-bold text-orange-600 uppercase tracking-tight mb-2">HOTS (%) - Penalaran</label>
                <input type="number" name="proporsiHOTS" value={form.proporsiHOTS} onChange={handleChange} className="w-full border border-orange-200 bg-white rounded-lg px-4 py-2 font-bold text-orange-700 outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                <label className="block text-xs font-bold text-blue-600 uppercase tracking-tight mb-2">MOTS (%) - Aplikasi</label>
                <input type="number" name="proporsiMOTS" value={form.proporsiMOTS} onChange={handleChange} className="w-full border border-blue-200 bg-white rounded-lg px-4 py-2 font-bold text-blue-700 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-tight mb-2">LOTS (%) - Ingatan</label>
                <input type="number" name="proporsiLOTS" value={form.proporsiLOTS} onChange={handleChange} className="w-full border border-slate-300 bg-white rounded-lg px-4 py-2 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-slate-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-2">Pilihan Ganda</label>
                <input type="number" name="jmlPG" value={form.jmlPG} onChange={handleChange} className="w-full border border-slate-300 bg-white rounded-lg px-4 py-2 text-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-2">PG Kompleks</label>
                <input type="number" name="jmlPGK" value={form.jmlPGK} onChange={handleChange} className="w-full border border-slate-300 bg-white rounded-lg px-4 py-2 text-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-2">Uraian Singkat</label>
                <input type="number" name="jmlUraianSingkat" value={form.jmlUraianSingkat} onChange={handleChange} className="w-full border border-slate-300 bg-white rounded-lg px-4 py-2 text-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-2">Essay / Performa</label>
                <input type="number" name="jmlEssay" value={form.jmlEssay} onChange={handleChange} className="w-full border border-slate-300 bg-white rounded-lg px-4 py-2 text-xl font-bold text-blue-600 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {errorPrompt && <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-bold mt-4">{errorPrompt}</div>}

          <div className="flex mt-8 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto ml-auto px-8 py-4 bg-blue-600 text-white rounded-xl text-md font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Mulai Generator AI →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
