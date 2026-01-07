
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search, ShieldAlert } from 'lucide-react';
import Button from './Button';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
        {/* Visual Element */}
        <div className="relative">
          <div className="absolute inset-0 bg-blue-100 rounded-full scale-150 blur-3xl opacity-20 -z-10"></div>
          <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto border border-slate-100 rotate-12 transition-transform hover:rotate-0 duration-300">
            <ShieldAlert className="w-12 h-12 text-blue-600" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center border border-amber-200 shadow-sm animate-bounce">
            <span className="text-amber-700 font-bold text-xs">404</span>
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-3">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Resource Not Found</h1>
          <p className="text-slate-500 leading-relaxed">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
        </div>

        {/* Quick Search / Helpful Links */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input 
              readOnly
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-400 cursor-not-allowed" 
              placeholder="Internal registry search..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="secondary" 
              size="sm" 
              className="w-full"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              className="w-full"
              onClick={() => navigate('/')}
            >
              <Home className="w-4 h-4 mr-2" /> Dashboard
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            eRPH Pro &bull; Security & Registry Subsystem
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
