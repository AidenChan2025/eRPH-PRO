
export interface SmartOption {
    id: string;
    ms: string;
    en: string;
    zh: string;
}

export type SupportedLanguage = 'ms' | 'en' | 'zh' | 'ta';

export const TEACHING_AIDS: SmartOption[] = [
    { id: 'textbook', ms: 'Buku Teks', en: 'Textbook', zh: '课本' },
    { id: 'reference_book', ms: 'Buku Rujukan', en: 'Reference Book', zh: '参考书' },
    { id: 'module', ms: 'Modul / Lembaran Kerja', en: 'Module / Worksheets', zh: '模组 / 作业' },
    { id: 'powerpoint', ms: 'PowerPoint / Slide', en: 'PowerPoint / Slides', zh: '演示文稿' },
    { id: 'internet', ms: 'Internet / Youtube', en: 'Internet / Youtube', zh: '网络 / 视频' },
    { id: 'model', ms: 'Model / Bahan Maujud', en: 'Model / Realia', zh: '模型 / 实物' },
    { id: 'chart', ms: 'Carta / Peta', en: 'Chart / Map', zh: '图表 / 地图' },
    { id: 'projector', ms: 'LCD Projektor', en: 'LCD Projector', zh: '投影仪' },
    { id: 'tablet', ms: 'Tablet / Komputer', en: 'Tablet / Computer', zh: '平板 / 电脑' },
    { id: 'game', ms: 'Permainan', en: 'Game Sets', zh: '游戏用具' }
];

export const PAK21: SmartOption[] = [
    { id: 'round_table', ms: 'Round Table', en: 'Round Table', zh: '圆桌会议' },
    { id: 'think_pair_share', ms: 'Think-Pair-Share', en: 'Think-Pair-Share', zh: '思考-配对-分享' },
    { id: 'hot_seat', ms: 'Hot Seat', en: 'Hot Seat', zh: '热评座' },
    { id: 'gallery_walk', ms: 'Gallery Walk', en: 'Gallery Walk', zh: '画廊漫步' },
    { id: 'role_play', ms: 'Main Peranan', en: 'Role Play', zh: '角色扮演' },
    { id: 'presentation', ms: 'Pembentangan', en: 'Presentation', zh: '呈堂' },
    { id: 'brainstorming', ms: 'Sumbangsaran', en: 'Brainstorming', zh: '头脑风暴' },
    { id: 'games', ms: 'Permainan', en: 'Games', zh: '游戏' },
    { id: 'mind_map', ms: 'Peta Minda (i-Think)', en: 'Mind Map (i-Think)', zh: '思维导图' }
];

export const ASSESSMENTS: SmartOption[] = [
    { id: 'written', ms: 'Latihan Bertulis', en: 'Written Exercise', zh: '书写练习' },
    { id: 'oral', ms: 'Lisan / Soal Jawab', en: 'Oral / Q&A', zh: '口头回答' },
    { id: 'observation', ms: 'Pemerhatian', en: 'Observation', zh: '观察' },
    { id: 'quiz', ms: 'Kuiz', en: 'Quiz', zh: '测验' },
    { id: 'project', ms: 'Projek / Hasil Kerja', en: 'Project / Work Product', zh: '项目 / 作品' },
    { id: 'presentation', ms: 'Pembentangan', en: 'Presentation', zh: '呈堂' },
    { id: 'checklist', ms: 'Senarai Semak', en: 'Checklist', zh: '核对表' }
];

export const getLocalizedOptions = (options: SmartOption[], lang: SupportedLanguage) => {
    return options.map(opt => ({
        id: opt.id,
        label: opt[lang] || opt.ms
    }));
};
