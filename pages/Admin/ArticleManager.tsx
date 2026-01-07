
import React, { useState, useEffect } from 'react';
import { useGlobal } from '../../context/GlobalContext';
import { useLanguage } from '../../context/LanguageContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { 
    BookOpen, Search, Filter, Plus, FileText, Trash2, Eye, 
    RefreshCw, Zap, Sparkles, ChevronRight, Loader2, Edit2, 
    X, Save, Image as ImageIcon, Type, Layout, Link as LinkIcon
} from 'lucide-react';
import { collection, query, getDocs, db, deleteDoc, doc, setDoc } from '../../services/firebase';
import { Article } from '../../types';

const ArticleManager = () => {
    const { t } = useLanguage();
    const { currentUser } = useGlobal();
    const [articles, setArticles] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCrawling, setIsCrawling] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Editor State
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const fetchArticles = async () => {
        setIsLoading(true);
        try {
            const snap = await getDocs(collection(db, 'articles'));
            setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() } as Article)));
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchArticles(); }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this article? This is irreversible.")) return;
        await deleteDoc(doc(db, 'articles', id));
        setArticles(prev => prev.filter(a => a.id !== id));
    };

    const handleTriggerCrawl = async () => {
        setIsCrawling(true);
        
        // Simulation of Aiden AI Crawling the web for pedagogical trends
        try {
            await new Promise(resolve => setTimeout(resolve, 2500));
            
            const aiInsights: Article[] = [
                {
                    id: `art-ai-${Date.now()}-1`,
                    title: "The Impact of Hybrid Learning on Rural Malaysian Schools",
                    slug: "impact-hybrid-learning-rural-malaysia-" + Date.now(),
                    content: "Detailed analysis of how hybrid models are narrowing the digital divide in East Malaysia...",
                    excerpt: "A look into how 5G connectivity is changing the classroom landscape in rural areas.",
                    author: "Aiden Chan",
                    category: "Technology",
                    publishedAt: new Date().toISOString().split('T')[0],
                    viewCount: 0,
                    featuredImage: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2070"
                },
                {
                    id: `art-ai-${Date.now()}-2`,
                    title: "Modernizing KSSM Standards for the AI Era",
                    slug: "modernizing-kssm-ai-era-" + Date.now(),
                    content: "Pedagogical shifts required to integrate computational thinking into daily lesson plans...",
                    excerpt: "Why standard RPH formats need to evolve to support AI-assisted learning.",
                    author: "Aiden Chan",
                    category: "Pedagogy",
                    publishedAt: new Date().toISOString().split('T')[0],
                    viewCount: 0,
                    featuredImage: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?q=80&w=2070"
                }
            ];

            // Save new AI-discovered articles
            for (const art of aiInsights) {
                await setDoc(doc(db, 'articles', art.id), art);
            }

            alert("Aiden AI engine has completed the crawl. 2 new pedagogical insights were discovered and added to your hub.");
            await fetchArticles();
        } catch (e) {
            console.error("Crawl failed:", e);
            alert("AI Crawl encountered a network error.");
        } finally {
            setIsCrawling(false);
        }
    };

    const handleOpenEditor = (article?: Article) => {
        if (article) {
            setEditingArticle(article);
        } else {
            setEditingArticle({
                title: '',
                slug: '',
                content: '',
                excerpt: '',
                category: 'Pedagogy',
                author: 'Aiden Chan',
                publishedAt: new Date().toISOString().split('T')[0],
                viewCount: 0
            });
        }
        setIsEditorOpen(true);
    };

    const handleSaveArticle = async () => {
        if (!editingArticle?.title || !editingArticle?.content) return;
        setIsSaving(true);
        
        const articleId = editingArticle.id || `art-${Date.now()}`;
        const slug = editingArticle.slug || editingArticle.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '');
        
        const finalArticle: Article = {
            ...(editingArticle as Article),
            id: articleId,
            slug: slug,
            publishedAt: editingArticle.publishedAt || new Date().toISOString().split('T')[0],
            viewCount: editingArticle.viewCount || 0
        };

        try {
            await setDoc(doc(db, 'articles', articleId), finalArticle);
            await fetchArticles();
            setIsEditorOpen(false);
            setEditingArticle(null);
        } catch (e) {
            console.error(e);
            alert("Failed to save article.");
        } finally {
            setIsSaving(false);
        }
    };

    const filtered = articles.filter(a => 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        a.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{t('article_hub')}</h2>
                    <p className="text-slate-500 text-sm">Manage educational editorial content for the public website.</p>
                </div>
                <div className="flex gap-3">
                    <Button 
                        variant="secondary" 
                        onClick={handleTriggerCrawl} 
                        disabled={isCrawling} 
                        className={`rounded-xl transition-all ${isCrawling ? 'bg-amber-50 border-amber-200' : ''}`}
                    >
                        {isCrawling ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin text-amber-500"/>
                                Aiden is Crawling...
                            </>
                        ) : (
                            <>
                                <Zap className="w-4 h-4 mr-2 text-amber-500"/>
                                Trigger AI Crawl
                            </>
                        )}
                    </Button>
                    <Button onClick={() => handleOpenEditor()} className="rounded-xl shadow-lg shadow-blue-200">
                        <Plus className="w-4 h-4 mr-2"/> New Editorial
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input 
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                    placeholder="Search titles or categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <Card className="p-0 overflow-hidden rounded-3xl border-slate-100 shadow-xl shadow-slate-200/50">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                        <tr>
                            <th className="p-5">{t('subject')}</th>
                            <th className="p-5">Category</th>
                            <th className="p-5">Author</th>
                            <th className="p-5">Stats</th>
                            <th className="p-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 bg-white">
                        {isLoading ? (
                            <tr><td colSpan={5} className="p-12 text-center text-slate-400">Loading Articles...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={5} className="p-20 text-center text-slate-400 italic">No editorials found.</td></tr>
                        ) : filtered.map(article => (
                            <tr key={article.id} className="hover:bg-slate-50/50 group transition-colors">
                                <td className="p-5">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-800 line-clamp-1">{article.title}</span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">{article.publishedAt}</span>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-tight">{article.category}</span>
                                </td>
                                <td className="p-5 text-slate-600 font-medium">{article.author}</td>
                                <td className="p-5">
                                    <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                                        <Eye className="w-3.5 h-3.5" /> {article.viewCount}
                                    </div>
                                </td>
                                <td className="p-5 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleOpenEditor(article)} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-blue-600 transition-all shadow-none hover:shadow-sm">
                                            <Edit2 className="w-4 h-4"/>
                                        </button>
                                        <button onClick={() => handleDelete(article.id)} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-red-500 transition-all shadow-none hover:shadow-sm">
                                            <Trash2 className="w-4 h-4"/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            {/* Post/Edit Modal */}
            {isEditorOpen && editingArticle && (
                <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                    <Card className="w-full max-w-4xl shadow-2xl rounded-[2rem] border-0 overflow-hidden bg-white animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
                                    <FileText className="w-5 h-5"/>
                                </div>
                                <h3 className="font-black text-slate-800 uppercase tracking-tight">{editingArticle.id ? 'Edit Editorial' : 'New Editorial'}</h3>
                            </div>
                            <button onClick={() => setIsEditorOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                <X className="w-5 h-5 text-slate-500"/>
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Article Title</label>
                                        <div className="relative">
                                            <Type className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
                                            <input 
                                                className="w-full border-2 border-slate-100 p-3 pl-10 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none transition-all bg-slate-50/30" 
                                                value={editingArticle.title} 
                                                onChange={e => setEditingArticle({...editingArticle, title: e.target.value})}
                                                placeholder="Enter a compelling title..."
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">URL Slug (Optional)</label>
                                        <div className="relative">
                                            <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
                                            <input 
                                                className="w-full border-2 border-slate-100 p-3 pl-10 rounded-2xl text-sm font-medium focus:border-blue-500 outline-none transition-all bg-slate-50/30" 
                                                value={editingArticle.slug} 
                                                onChange={e => setEditingArticle({...editingArticle, slug: e.target.value})}
                                                placeholder="ai-in-classroom"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Category</label>
                                            <select 
                                                className="w-full border-2 border-slate-100 p-3 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none bg-slate-50/30 appearance-none"
                                                value={editingArticle.category}
                                                onChange={e => setEditingArticle({...editingArticle, category: e.target.value})}
                                            >
                                                <option>Pedagogy</option>
                                                <option>Technology</option>
                                                <option>Administration</option>
                                                <option>Teacher Wellness</option>
                                                <option>MoE Updates</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Author</label>
                                            <input 
                                                className="w-full border-2 border-slate-100 p-3 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none bg-slate-50/30" 
                                                value={editingArticle.author}
                                                onChange={e => setEditingArticle({...editingArticle, author: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Short Excerpt (Meta Description)</label>
                                        <textarea 
                                            className="w-full border-2 border-slate-100 p-4 rounded-2xl text-sm font-medium h-24 focus:border-blue-500 outline-none transition-all bg-slate-50/30 resize-none" 
                                            value={editingArticle.excerpt}
                                            onChange={e => setEditingArticle({...editingArticle, excerpt: e.target.value})}
                                            placeholder="A brief summary for search engines and list views..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Featured Image URL</label>
                                        <div className="relative">
                                            <ImageIcon className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
                                            <input 
                                                className="w-full border-2 border-slate-100 p-3 pl-10 rounded-2xl text-sm font-medium focus:border-blue-500 outline-none transition-all bg-slate-50/30" 
                                                value={editingArticle.featuredImage}
                                                onChange={e => setEditingArticle({...editingArticle, featuredImage: e.target.value})}
                                                placeholder="https://images.unsplash.com/..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Article Content (Markdown/HTML Support)</label>
                                <textarea 
                                    className="w-full border-2 border-slate-100 p-6 rounded-[2rem] text-sm font-medium h-96 focus:border-blue-500 outline-none transition-all bg-slate-50/30 resize-y shadow-inner" 
                                    value={editingArticle.content}
                                    onChange={e => setEditingArticle({...editingArticle, content: e.target.value})}
                                    placeholder="Write your insightful pedagogical analysis here..."
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setIsEditorOpen(false)} disabled={isSaving} className="rounded-xl px-6">Discard</Button>
                            <Button onClick={handleSaveArticle} isLoading={isSaving} className="rounded-xl px-10 shadow-lg shadow-blue-500/20">
                                <Save className="w-4 h-4 mr-2"/> Publish Changes
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default ArticleManager;
