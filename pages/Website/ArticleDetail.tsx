import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft, Calendar, Clock, Share2,
    Sparkles, Bookmark, ThumbsUp, ChevronRight,
    MessageSquare, AlertCircle, TrendingUp
} from 'lucide-react';
import Button from '../../components/Button';
import PublicNavbar from '../../components/PublicNavbar';

import { articles_data } from '../../utils/articles_data';
import { useTranslation } from 'react-i18next';

const ArticleReader = () => {
    const { t } = useTranslation();
    const { slug } = useParams();
    const navigate = useNavigate();
    const article = articles_data[slug || "integrating-ai-math"];

    // Technical SEO: Schema Markup
    useEffect(() => {
        if (!article) return;
        const schema = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": article.title,
            "image": [article.heroImage],
            "datePublished": article.date,
            "author": [{
                "@type": "Person",
                "name": article.author,
                "url": "https://erphpro.com/about"
            }]
        };
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(schema);
        document.head.appendChild(script);
        return () => { document.head.removeChild(script); };
    }, [article]);

    if (!article) return <div className="p-20 text-center">{t('articleNotFound')}</div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-20 selection:bg-blue-100 selection:text-blue-900">
            <PublicNavbar />

            {/* Back Button Sub-Nav Bar */}
            <div className="h-14 bg-white/80 backdrop-blur-md border-b fixed top-16 w-full z-40">
                <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
                    <button onClick={() => navigate('/blog')} className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-black text-xs transition-all uppercase tracking-widest">
                        <ArrowLeft className="w-4 h-4" /> {t('backToArticleHub')}</button>
                    <div className="flex gap-4">
                        <button className="flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-xs uppercase transition-colors"><Bookmark className="w-4 h-4" /> {t('save')}</button>
                        <button className="flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-xs uppercase transition-colors"><Share2 className="w-4 h-4" /> {t('share')}</button>
                    </div>
                </div>
            </div>

            <div className="pt-40 px-6">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16">
                    {/* Main Content */}
                    <main className="lg:col-span-8 space-y-12">
                        <header className="space-y-8">
                            <div className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-[0.2em] text-[10px]">
                                <Sparkles className="w-4 h-4" /> {t('aiSummary')}{article.category}
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                                {article.title}
                            </h1>
                            <p className="text-xl text-slate-500 font-semibold leading-relaxed italic border-l-4 border-blue-600 pl-6 py-2 bg-blue-50/30 rounded-r-2xl">
                                {article.summary}
                            </p>
                            <div className="flex flex-wrap items-center gap-8 py-6 border-y border-slate-100">
                                <Link to="/about" className="flex items-center gap-3 group">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg group-hover:scale-110 transition-transform">{t('ac')}</div>
                                    <div className="text-xs">
                                        <p className="font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-widest">{article.author}</p>
                                        <p className="text-slate-400 font-bold uppercase mt-0.5">{t('chiefEditor')}</p>
                                    </div>
                                </Link>
                                <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-widest">
                                    <Calendar className="w-4 h-4 text-slate-300" /> {article.date}
                                </div>
                                <div className="flex items-center gap-2 text-blue-600 text-xs font-black uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-full">
                                    <Clock className="w-4 h-4" /> {article.readTime}
                                </div>
                            </div>
                        </header>

                        {/* Article Text */}
                        <article className="prose prose-slate max-w-none">
                            {article.sections.map((section: any, i: number) => {
                                switch (section.type) {
                                    case 'text':
                                        return <p key={i} className="text-lg text-slate-600 leading-relaxed font-medium mb-8">{section.content}</p>;
                                    case 'h2':
                                        return <h2 key={i} className="text-3xl font-black text-slate-900 mt-16 mb-8 tracking-tight">{section.content}</h2>;
                                    case 'tip':
                                        return (
                                            <div key={i} className="my-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-10 text-white space-y-4 shadow-2xl relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                                                    <TrendingUp className="w-32 h-32" />
                                                </div>
                                                <h3 className="text-xl font-black flex items-center gap-3 uppercase tracking-widest">
                                                    <Sparkles className="w-6 h-6 text-blue-200" /> {t('professionalInsight')}</h3>
                                                <p className="text-lg font-bold text-blue-50 opacity-90 leading-relaxed relative z-10">
                                                    {section.content}
                                                </p>
                                            </div>
                                        );
                                    case 'table':
                                        return (
                                            <div key={i} className="my-12 overflow-hidden border border-slate-200 rounded-[2rem] shadow-sm">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-slate-50">
                                                            {section.headers.map((h: string, idx: number) => (
                                                                <th key={idx} className="p-5 text-xs font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">{h}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {section.rows.map((row: any, idx: number) => (
                                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                                {row.map((cell: string, cIdx: number) => (
                                                                    <td key={cIdx} className="p-5 text-sm font-bold text-slate-700 border-b border-slate-100">{cell}</td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        );
                                    default:
                                        return null;
                                }
                            })}
                        </article>

                        {/* FAQ Section */}
                        <div className="mt-20 p-10 bg-slate-900 rounded-[3rem] space-y-8 text-white">
                            <h3 className="text-2xl font-black flex items-center gap-3">
                                <MessageSquare className="w-6 h-6 text-blue-400" /> {t('frequentlyAskedQuestions')}</h3>
                            <div className="space-y-6">
                                {article.faqs.map((f: any, i: number) => (
                                    <div key={i} className="space-y-3 p-6 bg-white/5 rounded-2xl border border-white/10">
                                        <p className="font-black text-blue-400 flex items-center gap-2">
                                            <ChevronRight className="w-4 h-4" /> {f.q}
                                        </p>
                                        <p className="text-slate-400 font-medium text-sm leading-relaxed">{f.a}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-16 border-t border-slate-100">
                            <div className="flex gap-4">
                                <Button variant="secondary" size="md" className="rounded-2xl bg-white shadow-sm border-slate-200"><ThumbsUp className="w-4 h-4 mr-2" /> {t('helpful12k')}</Button>
                                <Button variant="secondary" size="md" className="rounded-2xl bg-white shadow-sm border-slate-200"><Share2 className="w-4 h-4 mr-2" /> {t('shareArticle')}</Button>
                            </div>
                            <div className="flex gap-2">
                                <span className="px-4 py-2 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">{t('educationArchitecture')}</span>
                                <span className="px-4 py-2 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">{t('dskpApi')}</span>
                            </div>
                        </div>
                    </main>

                    {/* Sidebar */}
                    <aside className="lg:col-span-4 space-y-8">
                        <div className="sticky top-40 space-y-8">
                            <div className="p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-200">{t('ac')}</div>
                                    <div>
                                        <p className="font-black text-slate-900 text-lg">{t('aidenChan')}</p>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mt-0.5">{t('masterArchitect')}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-500 font-semibold leading-relaxed">
                                    {t('aidenLeadsTheErphPro')}</p>
                                <Button className="w-full rounded-2xl h-14 font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20">{t('followInsights')}</Button>
                            </div>

                            <div className="p-8 bg-blue-600 rounded-[2.5rem] text-white shadow-2xl space-y-6 relative overflow-hidden group">
                                <div className="absolute -bottom-10 -right-10 opacity-20 group-hover:rotate-12 transition-transform duration-700">
                                    <Sparkles className="w-48 h-48" />
                                </div>
                                <div className="relative z-10 space-y-4">
                                    <h4 className="text-2xl font-black leading-tight">{t('syncYourRphWithGemini')}</h4>
                                    <p className="text-blue-100 text-sm font-semibold opacity-90">{t('unlockTheWorldsMostAdvanced')}</p>
                                    <Link to="/portal/login" className="block">
                                        <Button className="w-full rounded-2xl h-14 font-black text-xs uppercase tracking-widest bg-white text-blue-600 border-none shadow-lg">{t('startFreeTrial')}</Button>
                                    </Link>
                                </div>
                            </div>

                            <div className="p-8 bg-white border border-slate-200 rounded-[2.5rem] space-y-6">
                                <h4 className="font-black uppercase text-[10px] tracking-widest text-slate-400 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> {t('recentPublications')}</h4>
                                <div className="space-y-5">
                                    {[
                                        "Automating DSKP Mapping for SJKC",
                                        "The Economics of Digital Schooling",
                                        "KSSM Standard 4 Physics: AI Insights"
                                    ].map((title, i) => (
                                        <Link key={i} to={`/blog`} className="block group">
                                            <p className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors leading-snug">{title}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{t('april20254MinRead')}</p>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default ArticleReader;
