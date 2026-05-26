import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType, convertInchesToTwip, ImageRun } from 'docx';
import { saveAs } from 'file-saver';
import { GeneratedContent, NaskahDocument } from '../types';

export const exportToDocx = async (docData: NaskahDocument, layout: 'A4' | 'F4', activeTab: 'NASKAH' | 'KISIKISI' | 'RUBRIK') => {
  if (!docData.contentJson) return;
  const content = JSON.parse(docData.contentJson) as GeneratedContent;

  const A4_SIZE = { width: convertInchesToTwip(8.27), height: convertInchesToTwip(11.69) };
  const F4_SIZE = { width: convertInchesToTwip(8.5), height: convertInchesToTwip(13) };
  
  const size = layout === 'A4' ? A4_SIZE : F4_SIZE;

  // Helper to check valid image prompt
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

  const fetchImageBuffer = async (prompt: string): Promise<ArrayBuffer | null> => {
    try {
      const seed = Array.from(prompt).reduce((acc, char) => acc + char.charCodeAt(0), 0) + 123;
      const enhancedPrompt = `${prompt} clear simple illustration for kids`;
      const docxImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=400&height=300&nologo=true&seed=${seed}`;
      const url = `/api/proxy-image?url=${encodeURIComponent(docxImageUrl)}`;
      const response = await fetch(url);
      if (!response.ok) return null;
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) return null;
      return await response.arrayBuffer();
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const docChildren: any[] = [];

  const createMixedRuns = (text: string, isItalics: boolean = false, prefix?: string) => {
    const runs: any[] = [];
    if (prefix) {
      runs.push(new TextRun({ text: prefix }));
    }
    
    if (!text) return runs;

    const lines = text.split('\n');
    lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) {
        runs.push(new TextRun({ break: 1 }));
      }
      if (/[\u0600-\u06FF]/.test(line)) {
        const parts = line.split(/([\u0600-\u06FF][\u0600-\u06FF\s\u0660-\u06690-9,.;:!?()"'’-]*[\u0600-\u06FF]|[\u0600-\u06FF])/);
        parts.forEach(part => {
          if (!part) return;
          const isArabicPart = /[\u0600-\u06FF]/.test(part);
          runs.push(new TextRun({
            text: part,
            italics: isArabicPart ? false : isItalics,
            size: isArabicPart ? 32 : undefined, // 16pt for readable Arabic
            font: isArabicPart ? { cs: "Arial", ascii: "Arial", hAnsi: "Arial" } : undefined,
            rightToLeft: isArabicPart
          }));
        });
      } else {
        runs.push(new TextRun({ text: line, italics: isItalics }));
      }
    });

    return runs;
  };

  if (activeTab === 'NASKAH') {
    docChildren.push(
      // KOP SURAT
      new Paragraph({
        text: docData.sekolah.toUpperCase(),
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        text: `NASKAH ${docData.jenisSumatif === 'SAS' ? 'SUMATIF AKHIR SEMESTER (SAS)' : 'SUMATIF AKHIR TAHUN (SAT)'}`,
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        text: `Tahun Pelajaran: ${docData.tahunPelajaran}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      
      // IDENTITAS
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NIL, size: 0, color: "FFFFFF" },
          bottom: { style: BorderStyle.NIL, size: 0, color: "FFFFFF" },
          left: { style: BorderStyle.NIL, size: 0, color: "FFFFFF" },
          right: { style: BorderStyle.NIL, size: 0, color: "FFFFFF" },
          insideHorizontal: { style: BorderStyle.NIL, size: 0, color: "FFFFFF" },
          insideVertical: { style: BorderStyle.NIL, size: 0, color: "FFFFFF" },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ text: "Mata Pelajaran" })], width: { size: 20, type: WidthType.PERCENTAGE } }),
              new TableCell({ children: [new Paragraph({ text: `: ${docData.mataPelajaran}` })] }),
              new TableCell({ children: [new Paragraph({ text: "Nama" })], width: { size: 15, type: WidthType.PERCENTAGE } }),
              new TableCell({ children: [new Paragraph({ text: ": ................................" })] }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ text: "Kelas" })] }),
              new TableCell({ children: [new Paragraph({ text: `: ${docData.kelas}` })] }),
              new TableCell({ children: [new Paragraph({ text: "No. Absen" })] }),
              new TableCell({ children: [new Paragraph({ text: ": ..........." })] }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ text: "Tanggal" })] }),
              new TableCell({ children: [new Paragraph({ text: `: ${docData.tanggal || '................................'}` })] }),
              new TableCell({ children: [new Paragraph({ text: "" })] }),
              new TableCell({ children: [new Paragraph({ text: "" })] }),
            ],
          }),
        ]
      }),
      
      new Paragraph({ text: "", spacing: { after: 400 } }), // SPACING

      // PETUNJUK
      new Paragraph({ children: [new TextRun({ text: "Petunjuk Pengerjaan:", bold: true })] }),
      new Paragraph({ text: "1. Berdoalah sebelum mengerjakan soal." }),
      new Paragraph({ text: "2. Tulis nama dan nomor absen pada tempat yang tersedia." }),
      new Paragraph({ text: "3. Bacalah soal dengan teliti sebelum menjawab." }),
      new Paragraph({ text: "", spacing: { after: 400 } })
    );

    // Helper to process questions with images
    const processQuestions = async (questions: any[], formatFunc: (soal: any) => any[]) => {
      for (const soal of questions) {
        if (soal.stimulus) {
          docChildren.push(new Paragraph({ children: createMixedRuns(soal.stimulus, true), spacing: { before: 100, after: 100 } }));
        }
        
        if (isValidImagePrompt(soal.gambarPrompt)) {
          const imgBuffer = await fetchImageBuffer(soal.gambarPrompt);
          if (imgBuffer) {
            docChildren.push(new Paragraph({
              children: [new ImageRun({
                data: new Uint8Array(imgBuffer) as any,
                transformation: { width: 300, height: 225 }
              })],
              spacing: { after: 100 }
            }));
          }
        }
        
        docChildren.push(...formatFunc(soal));
      }
    };

    if (content.soalPG && content.soalPG.length > 0) {
      docChildren.push(new Paragraph({ children: [new TextRun({ text: "A. BERILAH TANDA SILANG (X) PADA HURUF A, B, C, ATAU D PADA JAWABAN YANG BENAR!", bold: true })], spacing: { before: 200, after: 200 } }));
      await processQuestions(content.soalPG, (soal) => [
        new Paragraph({ children: createMixedRuns(soal.pertanyaan, false, `${soal.nomor}. `), spacing: { before: 100 } }),
        ...(soal.opsi ? soal.opsi.map((o: string, idx: number) => new Paragraph({ children: createMixedRuns(o, false, `   ${String.fromCharCode(65 + idx)}. `) })) : []),
        new Paragraph({ text: "", spacing: { after: 200 } })
      ]);
    }

    if (content.soalPGK && content.soalPGK.length > 0) {
      docChildren.push(new Paragraph({ children: [new TextRun({ text: "B. PILIHAN GANDA KOMPLEKS / MENJODOHKAN", bold: true })], spacing: { before: 200, after: 200 } }));
      await processQuestions(content.soalPGK, (soal) => [
         new Paragraph({ children: createMixedRuns(soal.pertanyaan, false, `${soal.nomor}. `), spacing: { before: 100, after: 200 } })
      ]);
    }

    if (content.soalUraianSingkat && content.soalUraianSingkat.length > 0) {
      docChildren.push(new Paragraph({ children: [new TextRun({ text: "C. ISILAH TITIK-TITIK DI BAWAH INI DENGAN JAWABAN YANG TEPAT!", bold: true })], spacing: { before: 200, after: 200 } }));
      await processQuestions(content.soalUraianSingkat, (soal) => [
         new Paragraph({ children: createMixedRuns(soal.pertanyaan, false, `${soal.nomor}. `) }),
         new Paragraph({ text: "", spacing: { after: 400 } })
      ]);
    }

    if (content.soalEssay && content.soalEssay.length > 0) {
      docChildren.push(new Paragraph({ children: [new TextRun({ text: "D. JAWABLAH PERTANYAAN-PERTANYAAN DI BAWAH INI DENGAN JELAS DAN BENAR!", bold: true })], spacing: { before: 200, after: 200 } }));
      await processQuestions(content.soalEssay, (soal) => [
         new Paragraph({ children: createMixedRuns(soal.pertanyaan, false, `${soal.nomor}. `) }),
         new Paragraph({ text: "Jawaban: ...................................................................................................................................................................................................", spacing: { before: 100, after: 400 } })
      ]);
    }
  } else if (activeTab === 'KISIKISI') {
    docChildren.push(
      new Paragraph({
        text: `KISI-KISI PENULISAN SOAL ${docData.jenisSumatif === 'SAS' ? 'SAS' : 'SAT'}`,
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({ text: `Mata Pelajaran: ${docData.mataPelajaran}`, alignment: AlignmentType.CENTER }),
      new Paragraph({ text: `Kelas: ${docData.kelas}`, alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
    );

    if (content.kisiKisi && content.kisiKisi.length > 0) {
      docChildren.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "No", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tujuan Pembelajaran", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Materi Pokok", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Level Kognitif", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Bentuk Soal", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "No Soal", bold: true })] })] })
              ]
            }),
            ...content.kisiKisi.map((kisi, idx) => 
               new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: `${idx + 1}` })] }),
                    new TableCell({ children: [new Paragraph({ children: createMixedRuns(kisi.tujuanPembelajaran || '') })] }),
                    new TableCell({ children: [new Paragraph({ children: createMixedRuns(kisi.materiPokok || '') })] }),
                    new TableCell({ children: [new Paragraph({ text: kisi.levelKognitif || '', alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: kisi.bentukSoal || '', alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: kisi.nomorButir || '', alignment: AlignmentType.CENTER })] })
                  ]
               })
            )
          ]
        })
      );
    }
  } else if (activeTab === 'RUBRIK') {
    docChildren.push(
      new Paragraph({
        text: `KUNCI JAWABAN DAN RUBRIK PENILAIAN`,
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({ text: `Mata Pelajaran: ${docData.mataPelajaran}`, alignment: AlignmentType.CENTER }),
      new Paragraph({ text: `Kelas: ${docData.kelas}`, alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
    );

    if (content.soalPG && content.soalPG.length > 0) {
      docChildren.push(new Paragraph({ children: [new TextRun({ text: "PILIHAN GANDA", bold: true })], spacing: { after: 100 } }));
      content.soalPG.forEach(soal => {
        docChildren.push(new Paragraph({ children: createMixedRuns(soal.kunci || '', false, `${soal.nomor}. `) }));
      });
      docChildren.push(new Paragraph({ text: "", spacing: { after: 200 } }));
    }

    if (content.soalUraianSingkat && content.soalUraianSingkat.length > 0) {
      docChildren.push(new Paragraph({ children: [new TextRun({ text: "URAIAN SINGKAT", bold: true })], spacing: { after: 100 } }));
      content.soalUraianSingkat.forEach(soal => {
        docChildren.push(new Paragraph({ children: createMixedRuns(soal.kunci || '', false, `${soal.nomor}. `) }));
      });
      docChildren.push(new Paragraph({ text: "", spacing: { after: 200 } }));
    }

    if (content.rubrikPenilaian && content.rubrikPenilaian.length > 0) {
      docChildren.push(new Paragraph({ children: [new TextRun({ text: "RUBRIK PENILAIAN ESSAY / PERFORMA", bold: true })], spacing: { after: 200 } }));
      
      content.rubrikPenilaian.forEach(rubrik => {
        docChildren.push(
          new Paragraph({ children: [new TextRun({ text: `Soal No. ${rubrik.nomor} (Skor Maksimal: ${rubrik.skorMaksimal})`, bold: true })], spacing: { before: 200 } }),
          new Paragraph({ children: createMixedRuns(rubrik.kriteria || '', false, 'Kriteria: '), spacing: { after: 100 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Skor", bold: true })], alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Deskripsi", bold: true })] })] })
                ]
              }),
              ...(rubrik.pedoman?.map((p: any) => 
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: `${p.skor}`, alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ children: createMixedRuns(p.deskripsi || '') })] })
                  ]
                })
              ) || [])
            ]
          })
        );
      });
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: size,
            margin: { top: convertInchesToTwip(1), right: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1) },
          },
        },
        children: docChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${activeTab}_${docData.jenisSumatif}_${docData.mataPelajaran}_Kelas${docData.kelas}.docx`);
};
