export interface NaskahDocument {
  id?: string;
  title: string;
  sekolah: string;
  tahunPelajaran: string;
  jenisSumatif: string;
  mataPelajaran: string;
  kelas: string;
  tanggal?: string;
  contentJson: string; // The generated content
  createdAt?: any;
  updatedAt?: any;
  ownerId: string;
}

export interface GeneratorConfig {
  sekolah: string;
  tahunPelajaran: string;
  jenisSumatif: string; // 'SAS', 'SAT'
  mataPelajaran: string;
  kelas: string;
  tanggal: string;
  proporsiHOTS: number;
  proporsiMOTS: number;
  proporsiLOTS: number;
  jmlPG: number;
  jmlPGK: number; // PG Kompleks / Menjodohkan
  jmlUraianSingkat: number;
  jmlEssay: number;
}

export interface GeneratedContent {
  cpTpAtp: {
    elemen: string;
    capaianPembelajaran: string;
    tujuanPembelajaran: string[];
    alurTujuanPembelajaran: string;
  };
  kisiKisi: {
    tujuanPembelajaran: string;
    materiPokok: string;
    levelKognitif: 'L1' | 'L2' | 'L3';
    bentukSoal: string;
    nomorButir: string;
  }[];
  soalPG: BaseSoal[];
  soalPGK: BaseSoal[]; // Menjodohkan/Kompleks
  soalUraianSingkat: BaseSoal[];
  soalEssay: BaseSoal[];
  rubrikPenilaian: {
    nomor: string;
    kriteria: string;
    skorMaksimal: number;
    pedoman: { skor: number; deskripsi: string }[];
  }[];
}

export interface BaseSoal {
  nomor: number;
  stimulus?: string;
  gambarPrompt?: string;
  pertanyaan: string;
  opsi?: string[]; // for PG
  kunci: string;
}
