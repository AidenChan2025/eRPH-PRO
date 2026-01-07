
import { SupportedLanguage } from './smartConstants';

export const detectSubjectLanguage = (subject: string): SupportedLanguage => {
    const s = subject.toLowerCase();
    if (s.includes('english') || s.includes('bi') || s.includes('inggeris')) return 'en';
    if (s.includes('cina') || s.includes('hk') || s.includes('bc') || s.includes('chinese') || s.includes('sjkc')) return 'zh';
    if (s.includes('tamil') || s.includes('bt') || s.includes('sjkt')) return 'ta'; // Tamil
    return 'ms'; // Default to Malay
};

// Heuristics for objectives
export const generateObjectives = (sp: string, lang: SupportedLanguage): string[] => {
    const objectives: string[] = [];

    // Simple extraction logic (can be refined)
    // Clean string by removing codes 1.2.3 etc
    const cleanSp = sp.replace(/^\d+(\.\d+)*\s*/, '').trim();

    if (lang === 'en') {
        objectives.push(`Students will be able to ${cleanSp.toLowerCase()}.`);
        objectives.push(`Students can identify the key components of ${cleanSp.split(' ').slice(-3).join(' ')}.`);
        objectives.push(`Students can demonstrate understanding of ${cleanSp.toLowerCase()} through practice.`);
    } else if (lang === 'zh') {
        objectives.push(`学生能够${cleanSp}。`);
        objectives.push(`学生能够正确地运用${cleanSp}的概念。`);
        objectives.push(`学生能够通过练习掌握${cleanSp}。`);
    } else if (lang === 'ta') {
        objectives.push(`மாணவர்கள் ${cleanSp} செய்ய முடியும்.`);
        objectives.push(`மாணவர்கள் ${cleanSp} பற்றிய கருத்துகளை புரிந்து கொள்வர்.`);
        objectives.push(`மாணவர்கள் பயிற்சியின் மூலம் ${cleanSp} திறனை அடைவர்.`);
    } else {
        // Malay (Default)
        // Convert "Menambah..." to "murid dapat menambah..."
        const verb = cleanSp.split(' ')[0];
        objectives.push(`Murid dapat ${cleanSp.toLowerCase()} dengan betul.`);
        objectives.push(`Murid dapat menguasai kemahiran ${cleanSp.toLowerCase()} melalui latihan.`);
        objectives.push(`Murid dapat menerangkan konsep ${cleanSp.toLowerCase()}.`);
    }

    return objectives;
};

export const generateSuccessCriteria = (sp: string, lang: SupportedLanguage): string[] => {
    const criteria: string[] = [];
    const cleanSp = sp.replace(/^\d+(\.\d+)*\s*/, '').trim();

    if (lang === 'en') {
        criteria.push(`I can ${cleanSp.toLowerCase()} correctly.`);
        criteria.push(`I can list at least 3 facts about ${cleanSp.split(' ').slice(-2).join(' ')}.`);
        criteria.push(`I can complete the assigned exercises with 80% accuracy.`);
    } else if (lang === 'zh') {
        criteria.push(`我能够正确地${cleanSp}。`);
        criteria.push(`我能够列出关于本课的3个重点。`);
        criteria.push(`我能够完成练习并答对至少80%的问题。`);
    } else if (lang === 'ta') {
        criteria.push(`என்னால் ${cleanSp} சரியாக செய்ய முடியும்.`);
        criteria.push(`என்னால் பாடத்தின் முக்கிய கருத்துகளை பட்டியலிட முடியும்.`);
        criteria.push(`என்னால் பயிற்சிகளை 80% சரியாக செய்ய முடியும்.`);
    } else {
        criteria.push(`Saya dapat ${cleanSp.toLowerCase()} dengan tepat.`);
        criteria.push(`Saya dapat menyenaraikan 3 isi penting tentang pelajaran hari ini.`);
        criteria.push(`Saya dapat menjawab soalan latihan dengan betul.`);
    }
    return criteria;
};

export const generateActivities = (sp: string, lang: SupportedLanguage): string[] => {
    const activities: string[] = [];
    const cleanSp = sp.replace(/^\d+(\.\d+)*\s*/, '').trim();

    if (lang === 'en') {
        activities.push(`1. Induction: Teacher introduces the topic "${cleanSp}" using flashcards/video.`);
        activities.push(`2. Explanation: Teacher explains the core concepts and demonstrates examples.`);
        activities.push(`3. Group Work: Students work in pairs to discuss and solve simple problems related to ${cleanSp}.`);
        activities.push(`4. Enrichment: Teacher gives worksheets for individual practice.`);
        activities.push(`5. Closure: Students summarize what they have learned and teacher conducts a quick quiz.`);
    } else if (lang === 'zh') {
        activities.push(`1. 导入：教师播放视频/展示图片，介绍课题"${cleanSp}"。`);
        activities.push(`2. 讲解：教师讲解核心概念，并示范例子。`);
        activities.push(`3. 分组活动：学生分组讨论，尝试解决与课题相关的问题。`);
        activities.push(`4. 巩固练习：教师分发作业，学生独立完成。`);
        activities.push(`5. 总结：师生共同总结今天的课题，并进行简短的问答环节。`);
    } else if (lang === 'ta') {
        activities.push(`1. முன்னுரை: ஆசிரியர் "${cleanSp}" தலைப்பை அறிமுகப்படுத்துதல்.`);
        activities.push(`2. விளக்கம்: ஆசிரியர் பாடம் தொடர்பான கருத்துகளை விளக்குதல்.`);
        activities.push(`3. குழு நடவடிக்கை: மாணவர்கள் குழுவாக விவாதித்தல்.`);
        activities.push(`4. பயிற்சி: ஆசிரியர் மாணவர்களுக்குப் பயிற்சி அளித்தல்.`);
        activities.push(`5. முடிவுரை: ஆசிரியர் பாடத்தை நிறைவு செய்தல்.`);
    } else {
        activities.push(`1. Induksi: Guru memperkenalkan tajuk "${cleanSp}" menggunakan kad imbas/video.`);
        activities.push(`2. Penerangan: Guru menerangkan konsep utama dan memberikan contoh yang relevan.`);
        activities.push(`3. Aktiviti Berkumpulan: Murid berbincang dalam pasangan untuk menyelesaikan tugasan mudah.`);
        activities.push(`4. Pengukuhan: Guru memberikan lembaran kerja untuk latihan individu.`);
        activities.push(`5. Penutup: Murid merumuskan isi pelajaran dan guru mengadakan sesi soal jawab ringkas.`);
    }

    return activities;
};
