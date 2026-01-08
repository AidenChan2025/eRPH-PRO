export enum SchoolType {
    SK = 'SK',
    SJKC = 'SJKC',
    SJKT = 'SJKT',
    PEMULIHAN = 'PEMULIHAN',
    PRASEKOLAH = 'PRASEKOLAH',
    KELAS_BERCANTUM = 'KELAS_BERCANTUM'
}

export interface DSKPStandard {
    id: string;
    schoolType: string;
    grade: string;
    subject: string;
    contentStandard: string;
    learningStandard: string;
    temaBidang: string;
    tema: string;
    tajukKemahiran: string;
    tajuk: string;
}

export const classifySchoolType = (subject: string): SchoolType => {
    const s = subject.toUpperCase();
    if (s.includes('PEMULIHAN')) return SchoolType.PEMULIHAN;
    if (s.includes('PRASEKOLAH') || s.includes('PRA SEKOLAH')) return SchoolType.PRASEKOLAH;
    if (s.includes('SJKT') || s.includes('TAMIL')) return SchoolType.SJKT;
    if (s.includes('SJKC')) return SchoolType.SJKC;
    if (s.includes('BERCANTUM')) return SchoolType.KELAS_BERCANTUM;
    return SchoolType.SK;
};
