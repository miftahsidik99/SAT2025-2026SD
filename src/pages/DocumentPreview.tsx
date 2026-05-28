import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFirestore } from '../hooks/useFirestore';
import { useAuth } from '../hooks/useAuth';
import { NaskahDocument, GeneratedContent } from '../types';
import { ArrowLeft, Download, FileText, Loader2, Image as ImageIcon } from 'lucide-react';
import { exportToDocx } from '../lib/docx-export';

// Helper function to validate if a prompt is a legitimate image request
const isValidImagePrompt = (prompt?: string) => {
  if (!prompt) return false;
  const p = prompt.toLowerCase().trim();
  return p !== '' && 
         p !== 'kosongkan' && 
         p !== '-' && 
         p !== 'none' && 
         p !== 'null' && 
         p !== 'string / kosongkan' &&
         !p.includes('tidak ada') && 
         !p.includes('tidak perlu') && 
         !p.includes('tanpa gambar');
};

const ImageRenderer = ({ prompt }: { prompt: string }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  
  if (error) {
    return null; // Return null to smoothly omit failed images
  }

  // Derive a stable seed from the prompt text so it doesn't cache a broken 42 seed and varies per prompt
  const seed = Array.from(prompt).reduce((acc, char) => acc + char.charCodeAt(0), 0) + 123;
  const enhancedPrompt = `${prompt} clear simple illustration for kids`;
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=400&height=300&nologo=true&seed=${seed}`;

  return (
    <div className="mb-4 flex flex-col items-start space-y-2">
      {loading && (
         <div className="w-[300px] h-[225px] bg-slate-100 animate-pulse rounded-xl flex flex-col items-center justify-center border border-slate-200">
           <ImageIcon className="w-8 h-8 text-slate-300 mb-2" />
           <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Memuat Visual...</span>
         </div>
      )}
      <img 
        src={imageUrl} 
        alt="Visualisasi Soal" 
        className={`max-w-xs md:max-w-sm object-cover rounded-xl border border-slate-200 shadow-sm print:max-w-[200px] ${loading ? 'hidden' : 'block'}`}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
    </div>
  );
};

export default function DocumentPreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getDocument, loading } = useFirestore();
  const { user } = useAuth();

  const [docData, setDocData] = useState<NaskahDocument | null>(null);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [layout, setLayout] = useState<'A4' | 'F4'>('A4');
  const [activeTab, setActiveTab] = useState<'NASKAH' | 'KISIKISI' | 'RUBRIK'>('NASKAH');

  useEffect(() => {
    if (user?.uid && id) {
      getDocument(id, user?.uid).then((data) => {
        if (data) {
          setDocData(data);
          setContent(JSON.parse(data.contentJson));
        }
      });
    }
  }, [user?.uid, id, getDocument]);

  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const handleExport = async () => {
    if (docData) {
      try {
        setExporting(true);
        setExportProgress(0);
        await exportToDocx(docData, layout, activeTab, (progress) => {
          setExportProgress(progress);
        });
      } catch (error: any) {
        console.error('Export failed:', error);
        alert('Gagal mengunduh dokumen. Silakan coba lagi.');
      } finally {
        setExporting(false);
        setExportProgress(0);
      }
    }
  };

  if (loading || !docData || !content) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full flex-1 max-w-5xl w-full mx-auto space-y-6">
      <div className="flex justify-between items-end mb-2">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 bg-white border border-slate-200 shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{docData.title}</h1>
            <p className="text-slate-500 text-sm">Preview naskah soal dan kisi-kisi untuk {docData.mataPelajaran}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6 print:hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
             <button onClick={() => setActiveTab('NASKAH')} className={`px-5 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'NASKAH' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-900'}`}>Naskah Soal</button>
             <button onClick={() => setActiveTab('KISIKISI')} className={`px-5 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'KISIKISI' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-900'}`}>Kisi-Kisi</button>
             <button onClick={() => setActiveTab('RUBRIK')} className={`px-5 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'RUBRIK' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-900'}`}>Kunci & Rubrik</button>
           </div>
           
           <div className="flex items-center gap-3 w-full md:w-auto">
              <select value={layout} onChange={(e) => setLayout(e.target.value as 'A4' | 'F4')} className="border border-slate-300 rounded-xl px-4 py-2 font-medium text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                <option value="A4">A4 Portrait</option>
                <option value="F4">F4 / Folio Portrait</option>
              </select>
              <button 
                onClick={handleExport} 
                disabled={exporting} 
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 ${exporting ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200'} text-white px-5 py-2 rounded-xl font-bold transition-colors w-[180px]`}
              >
                {exporting ? <><Loader2 className="w-4 h-4 animate-spin" /> {exportProgress}% Memproses</> : <><Download className="w-4 h-4" /> Unduh Word</>}
              </button>
           </div>
        </div>
      </div>

      {/* Preview Container */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-8 md:p-12 print:shadow-none print:border-none print:p-0 min-h-[800px] text-slate-800 text-sm md:text-base print:text-black font-serif leading-relaxed overflow-x-auto flex-1">
        
        {activeTab === 'NASKAH' && (
          <>
            {/* KOP SD */}
            <div className="text-center border-b-[3px] border-black pb-4 mb-6">
              <h1 className="font-bold text-xl uppercase tracking-wider">{docData.sekolah}</h1>
              <h2 className="font-bold text-lg uppercase tracking-wide">NASKAH {docData.jenisSumatif === 'SAS' ? 'SUMATIF AKHIR SEMESTER (SAS)' : 'SUMATIF AKHIR TAHUN (SAT)'}</h2>
              <p className="font-semibold text-md">TAHUN PELAJARAN {docData.tahunPelajaran}</p>
            </div>

            {/* Identitas Peserta */}
            <div className="grid grid-cols-2 gap-4 mb-8 font-semibold">
               <div>
                  <div className="flex mb-1"><span className="w-32">Mata Pelajaran</span><span>: {docData.mataPelajaran}</span></div>
                  <div className="flex mb-1"><span className="w-32">Kelas</span><span>: {docData.kelas}</span></div>
                  <div className="flex mb-1"><span className="w-32">Tanggal</span><span>: {docData.tanggal || '...........................'}</span></div>
               </div>
               <div>
                  <div className="flex mb-1"><span className="w-24">Nama</span><span>: .......................................</span></div>
                  <div className="flex mb-1"><span className="w-24">No. Absen</span><span>: .......................................</span></div>
               </div>
            </div>

            {/* Petunjuk */}
            <div className="mb-8 border border-black p-4">
              <p className="font-bold mb-2">Petunjuk Pengerjaan:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Berdoalah sebelum mengerjakan soal.</li>
                <li>Tulis nama dan nomor absen pada tempat yang tersedia.</li>
                <li>Bacalah soal dengan teliti sebelum menjawab.</li>
              </ol>
            </div>

            {/* Render Pilihan Ganda */}
            {content.soalPG && content.soalPG.length > 0 && (
              <div className="mb-8">
                <h3 className="font-bold mb-4 uppercase">A. Pilihlah jawaban yang paling tepat dengan memberi tanda silang (x) pada huruf a, b, c, atau d!</h3>
                <div className="space-y-6">
                  {content.soalPG.map((soal, index) => (
                    <div key={`pg-${index}-${soal.nomor}`} className="avoid-page-break">
                      {soal.stimulus && <p className="mb-2 italic text-slate-700 bg-slate-50 p-3 border-l-4 border-slate-300 print:bg-transparent print:border-none" dir="auto">{soal.stimulus}</p>}
                      {isValidImagePrompt(soal.gambarPrompt) && (
                        <ImageRenderer prompt={soal.gambarPrompt!} />
                      )}
                      <div className="flex gap-2">
                        <span className="font-bold">{soal.nomor}.</span>
                        <div>
                          <p className="mb-2 whitespace-pre-wrap" dir="auto">{soal.pertanyaan}</p>
                          <ol className="list-[lower-alpha] list-inside space-y-1 ml-2">
                            {soal.opsi?.map((opt, i) => (
                              <li key={`opt-${i}`} dir="auto">
                                {opt.replace(/^([a-eA-E][.)]\s*)+/i, '')}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Render PG Kompleks */}
            {content.soalPGK && content.soalPGK.length > 0 && (
              <div className="mb-8">
                <h3 className="font-bold mb-4 uppercase">B. Pilihan Ganda Kompleks / Menjodohkan</h3>
                <div className="space-y-6">
                  {content.soalPGK.map((soal, index) => (
                    <div key={`pgk-${index}-${soal.nomor}`} className="avoid-page-break">
                      {soal.stimulus && <p className="mb-2 italic text-slate-700 bg-slate-50 p-3 border-l-4 border-slate-300 print:bg-transparent print:border-none" dir="auto">{soal.stimulus}</p>}
                      {isValidImagePrompt(soal.gambarPrompt) && (
                        <ImageRenderer prompt={soal.gambarPrompt!} />
                      )}
                      <div className="flex gap-2">
                        <span className="font-bold">{soal.nomor}.</span>
                        <div>
                          <p className="mb-2 whitespace-pre-wrap" dir="auto">{soal.pertanyaan}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Render Uraian Singkat */}
            {content.soalUraianSingkat && content.soalUraianSingkat.length > 0 && (
              <div className="mb-8">
                <h3 className="font-bold mb-4 uppercase">C. Isilah titik-titik di bawah ini dengan jawaban yang benar!</h3>
                <div className="space-y-6">
                  {content.soalUraianSingkat.map((soal, index) => (
                    <div key={`us-${index}-${soal.nomor}`} className="avoid-page-break">
                      {soal.stimulus && <p className="mb-2 italic text-slate-700 bg-slate-50 p-3 border-l-4 border-slate-300 print:bg-transparent print:border-none" dir="auto">{soal.stimulus}</p>}
                      {isValidImagePrompt(soal.gambarPrompt) && (
                        <ImageRenderer prompt={soal.gambarPrompt!} />
                      )}
                      <div className="flex gap-2">
                        <span className="font-bold">{soal.nomor}.</span>
                        <p className="whitespace-pre-wrap" dir="auto">{soal.pertanyaan}</p>
                      </div>
                      <div className="mt-4 border-b-2 border-dotted border-slate-400 w-full h-6"></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

             {/* Render Essay */}
             {content.soalEssay && content.soalEssay.length > 0 && (
              <div className="mb-8">
                <h3 className="font-bold mb-4 uppercase">D. Jawablah pertanyaan-pertanyaan di bawah ini dengan jelas dan tepat!</h3>
                <div className="space-y-8">
                  {content.soalEssay.map((soal, index) => (
                    <div key={`essay-${index}-${soal.nomor}`} className="avoid-page-break">
                      {soal.stimulus && <p className="mb-2 italic text-slate-700 bg-slate-50 p-3 border-l-4 border-slate-300 print:bg-transparent print:border-none" dir="auto">{soal.stimulus}</p>}
                      {isValidImagePrompt(soal.gambarPrompt) && (
                        <ImageRenderer prompt={soal.gambarPrompt!} />
                      )}
                      <div className="flex gap-2">
                        <span className="font-bold">{soal.nomor}.</span>
                        <p className="whitespace-pre-wrap" dir="auto">{soal.pertanyaan}</p>
                      </div>
                      <div className="mt-6 space-y-6">
                        <div className="border-b-2 border-dotted border-slate-400 w-full h-6"></div>
                        <div className="border-b-2 border-dotted border-slate-400 w-full h-6"></div>
                        <div className="border-b-2 border-dotted border-slate-400 w-full h-6"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Tab Kisi-Kisi */}
        {activeTab === 'KISIKISI' && (
          <div>
             <h2 className="text-xl font-bold mb-6 text-center">KISI-KISI PENULISAN SOAL {docData.jenisSumatif}</h2>
             <div className="overflow-x-auto">
               <table className="w-full border-collapse border border-slate-800 text-sm">
                 <thead>
                   <tr className="bg-slate-100">
                     <th className="border border-slate-800 p-2 text-left">No</th>
                     <th className="border border-slate-800 p-2 text-left">Tujuan Pembelajaran</th>
                     <th className="border border-slate-800 p-2 text-left">Materi Pokok</th>
                     <th className="border border-slate-800 p-2 text-center">Level Kognitif</th>
                     <th className="border border-slate-800 p-2 text-center">Bentuk Soal</th>
                     <th className="border border-slate-800 p-2 text-center">No Soal</th>
                   </tr>
                 </thead>
                 <tbody>
                   {content.kisiKisi?.map((kisi, idx) => (
                     <tr key={`kisi-${idx}`}>
                       <td className="border border-slate-800 p-2 text-center">{idx + 1}</td>
                       <td className="border border-slate-800 p-2">{kisi.tujuanPembelajaran}</td>
                       <td className="border border-slate-800 p-2">{kisi.materiPokok}</td>
                       <td className="border border-slate-800 p-2 text-center">{kisi.levelKognitif}</td>
                       <td className="border border-slate-800 p-2 text-center">{kisi.bentukSoal}</td>
                       <td className="border border-slate-800 p-2 text-center font-bold">{kisi.nomorButir}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {/* Tab Rubrik */}
        {activeTab === 'RUBRIK' && (
          <div className="space-y-8">
             <div>
                <h2 className="text-xl font-bold mb-4">KUNCI JAWABAN OBJEKTIF</h2>
                {content.soalPG && content.soalPG.length > 0 && (
                  <div className="mb-4">
                     <h3 className="font-semibold mb-2">Pilihan Ganda:</h3>
                     <div className="grid grid-cols-5 gap-2">
                        {content.soalPG.map((soal, index) => (
                          <div key={`rpg-${index}-${soal.nomor}`}><span className="font-mono bg-slate-100 px-2 rounded">{soal.nomor}. {soal.kunci}</span></div>
                        ))}
                     </div>
                  </div>
                )}
                {content.soalUraianSingkat && content.soalUraianSingkat.length > 0 && (
                  <div className="mb-4">
                     <h3 className="font-semibold mb-2">Uraian Singkat:</h3>
                     <ul className="list-disc list-inside space-y-1">
                        {content.soalUraianSingkat.map((soal, index) => (
                          <li key={`rus-${index}-${soal.nomor}`}><span className="font-bold">{soal.nomor}.</span> {soal.kunci}</li>
                        ))}
                     </ul>
                  </div>
                )}
             </div>

             <div>
                <h2 className="text-xl font-bold mb-4">RUBRIK PENILAIAN ESSAY / PERFORMA</h2>
                <div className="space-y-6">
                  {content.rubrikPenilaian?.map((rubrik, idx) => (
                    <div key={`rubrik-${idx}`} className="border border-slate-300 rounded-lg overflow-hidden">
                      <div className="bg-slate-100 p-3 border-b border-slate-300 font-semibold">
                        Soal No. {rubrik.nomor} (Skor Maksimal: {rubrik.skorMaksimal})
                      </div>
                      <div className="p-4">
                        <p className="mb-3 font-medium text-slate-700">Kriteria: {rubrik.kriteria}</p>
                        <table className="w-full border-collapse border border-slate-200 text-sm">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="border border-slate-200 p-2 w-20 text-center">Skor</th>
                              <th className="border border-slate-200 p-2 text-left">Deskripsi Jawaban</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rubrik.pedoman?.map((pedoman, j) => (
                              <tr key={`pedoman-${j}`}>
                                <td className="border border-slate-200 p-2 text-center font-bold">{pedoman.skor}</td>
                                <td className="border border-slate-200 p-2 whitespace-pre-wrap">{pedoman.deskripsi}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
