
import { Language } from '../types';
import { translations } from './translations';

export const PAK21_ACTIVITIES = ["思考-讨论-分享 (Think-Pair-Share)", "漫步画廊 (Gallery Walk)", "圆桌会议 (Round Table)", "热椅子 (Hot Seat)", "角色扮演 (Role Play)", "三走一留 (Three Stray, One Stay)", "交通灯 (Traffic Lights)", "巴士站 (Bus Stop)", "脑力激荡 (Brainstorming)"];
export const TEACHING_AIDS = ["课本 (Buku Teks)", "演示文稿 (PowerPoint)", "投影仪 (LCD Projector)", "白板/马克笔 (Papan Putih)", "闪示卡 (Kad Imbasan)", "活动卷 (Lembaran Kerja)", "视频/音频 (Video/Audio)", "电脑 (Komputer)", "模组 (Modul)", "智能一体机 (Smartboard)"];
export const ASSESSMENTS = ["口述 (Lisan)", "书写 (Bertulis)", "观察 (Pemerhatian)", "随堂测验 (Kuiz)", "呈堂 (Pembentangan)", "课业/作品 (Projek)", "表演 (Drama)"];
export const EMK_ELEMENTS = ["语言 (Bahasa)", "爱护环境 (Kelestarian Alam Sekitar)", "道德价值 (Nilai Murni)", "科学与工艺 (Sains & Teknologi)", "爱国精神 (Patriotisme)", "创意与革新 (Kreativiti & Inovasi)", "企业以家元素 (Keusahawanan)", "信息通信技术 (TMK)", "全球永续发展 (Kelestarian Global)", "理财教育 (Pendidikan Kewangan)"];
export const KBAT_OPTIONS = ["应用 (Mengaplikasi)", "分析 (Menganalisis)", "评价 (Menilai)", "创造 (Mencipta)"];
export const ITHINK_MAPS = ["圆圈图 (Peta Bulatan)", "气泡图 (Peta Buih)", "双气泡图 (Peta Buih Berganda)", "树型图 (Peta Pokok)", "括号图 (Peta Dakap)", "流程图 (Peta Alir)", "复流程图 (Peta Pelbagai Alir)", "桥型图 (Peta Titi)", "无 (Tiada)"];
export const STRATEGIES = ["探究式学习 (Inkuiri)", "情境学习 (Kontekstual)", "建构主义 (Konstruktivisme)", "掌握学习 (Masteri)", "寓教于乐 (Didik Hibur)", "主题教学 (Bertema)"];

export const getRPHLanguage = (subject: string): Language => {
    const sub = (subject || '').toLowerCase();
    if (sub.includes('bahasa melayu') || sub.includes('malay') || sub.includes('国文') || sub === 'bm') return Language.MS;
    if (sub.includes('bahasa cina') || sub.includes('chinese') || sub.includes('华文') || sub.includes('bc')) return Language.ZH;
    if (sub.includes('bahasa tamil') || sub.includes('tamil') || sub.includes('bt')) return Language.TA;
    if (sub.includes('jawi') || sub.includes('pendidikan islam') || sub.includes('pi')) return Language.JV;
    if (sub.includes('english') || sub.includes('bi') || sub.includes('英文')) return Language.EN;
    
    // Default to ZH if using Chinese UI
    return Language.ZH; 
};
