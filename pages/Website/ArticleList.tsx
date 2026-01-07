import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, BookOpen, Search, Filter, Sparkles } from 'lucide-react';
import Card from '../../components/Card';
import PublicNavbar from '../../components/PublicNavbar';
import Button from '../../components/Button';
import { articles_data } from '../../utils/articles_data';

const ArticleList = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const allArticles = useMemo(() => Object.values(articles_data), []);
    const categories = useMemo(() => ['All', ...new Set(allArticles.map(a => a.category))], [allArticles]);

    const filteredArticles = useMemo(() => {
        return allArticles.filter(article => {
            const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                article.summary.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [allArticles, searchQuery, selectedCategory]);

    return (
        <div className="min-h-screen bg-slate-50 selection:bg-blue-100 selection:text-blue-900">
            <PublicNavbar />

            <div className="pt-24 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* CMS Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 border-b pb-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-[0.2em] text-[10px]">
                                <Sparkles className="w-4 h-4" /> Ultimate Education Resource Hub
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">The Digital Library <span className="text-slate-400 font-black italic">for Modern Educators</span></h1>
                            <p className="text-slate-500 font-medium max-w-xl italic">
                                Over 100+ precision-engineered articles covering Malaysian pedagogy, AI integration, and school leadership excellence.
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden md:block">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Chief Editor</p>
                                <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Aiden Chan</p>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-200 uppercase">AC</div>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col lg:flex-row gap-6 mb-12">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search the library (e.g., DSKP, AI, Leadership)..."
                                className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 custom-scrollbar">
                            <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl text-slate-500 shrink-0">
                                <Filter className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Filter</span>
                            </div>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-sm ${selectedCategory === cat ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        <div className="lg:col-span-8 space-y-8">
                            {filteredArticles.length > 0 ? (
                                filteredArticles.map(article => (
                                    <Link to={`/blog/${article.slug}`} key={article.slug} className="block group">
                                        <Card className="overflow-hidden border-slate-200 group-hover:border-blue-400 transition-all p-0 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1">
                                            <div className="flex flex-col md:flex-row h-full">
                                                <div className="w-full md:w-64 h-56 md:h-auto bg-slate-200 shrink-0 overflow-hidden">
                                                    <img src={article.heroImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={article.title} />
                                                </div>
                                                <div className="p-8 flex flex-col justify-between">
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                                            <span className="text-blue-600">{article.category}</span>
                                                            <span>•</span>
                                                            <span>{article.date}</span>
                                                        </div>
                                                        <h2 className="text-2xl font-black text-slate-800 group-hover:text-blue-600 transition-colors leading-tight tracking-tight">{article.title}</h2>
                                                        <p className="text-slate-500 line-clamp-2 leading-relaxed font-medium text-sm">{article.summary}</p>
                                                    </div>
                                                    <div className="pt-6 flex items-center justify-between">
                                                        <span className="inline-flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest">
                                                            View Full Analysis <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{article.readTime}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </Link>
                                ))
                            ) : (
                                <div className="p-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                                    <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                    <p className="text-slate-400 font-bold uppercase tracking-widest">No articles found matching your criteria</p>
                                </div>
                            )}
                        </div>

                        {/* Sidebar / Professional Insight */}
                        <aside className="lg:col-span-4 space-y-8">
                            <div className="p-8 bg-slate-900 rounded-[2.5rem] space-y-6 text-white shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 transition-transform duration-700">
                                    <Sparkles className="w-32 h-32" />
                                </div>
                                <h3 className="text-xl font-black uppercase tracking-tight text-blue-400">Editorial Mandate</h3>
                                <p className="text-sm font-semibold text-slate-400 leading-relaxed italic">"Every article in our hub is cross-referenced with the latest MoE circulars and DSKP mappings to ensure teacher accuracy."</p>
                                <div className="pt-4 border-t border-white/10 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black">AC</div>
                                    <div className="text-xs">
                                        <p className="font-black text-white uppercase tracking-widest transition-colors mb-0.5">Aiden's Editorial Team</p>
                                        <p className="text-slate-500 font-bold uppercase">Malaysia HQ</p>
                                    </div>
                                </div>
                            </div>

                            <div className="sticky top-40 space-y-8">
                                <Card className="p-8 rounded-[2.5rem] shadow-sm bg-white border-slate-100 flex flex-col items-center justify-center text-[10px] uppercase font-black text-slate-300 gap-2 h-96 border-dashed text-center">
                                    <p>Google AdSense</p>
                                    <p className="opacity-50">High Intent Educational Traffic</p>
                                </Card>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArticleList;
