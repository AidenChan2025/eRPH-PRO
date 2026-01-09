import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser, Upload, Pen, Check } from 'lucide-react';

interface SignaturePadProps {
    onSave: (dataUrl: string) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onCancel, isSubmitting = false }) => {
    const sigCanvas = useRef<SignatureCanvas>(null);
    const [mode, setMode] = useState<'draw' | 'upload'>('draw');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);

    const clear = () => sigCanvas.current?.clear();

    const processUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Resize and Process White Background
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                // Max dimensions
                const MAX_W = 400;
                const MAX_H = 200;
                let w = img.width;
                let h = img.height;

                if (w > MAX_W) { h *= MAX_W / w; w = MAX_W; }
                if (h > MAX_H) { w *= MAX_H / h; h = MAX_H; }

                canvas.width = w;
                canvas.height = h;
                ctx.drawImage(img, 0, 0, w, h);

                // Pixel Manipulation: White -> Transparent
                const imgData = ctx.getImageData(0, 0, w, h);
                const data = imgData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    // Threshold for "White"
                    if (r > 200 && g > 200 && b > 200) {
                        data[i + 3] = 0; // Alpha 0
                    }
                }
                ctx.putImageData(imgData, 0, 0);
                setUploadedImage(canvas.toDataURL('image/png'));
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleSave = () => {
        if (mode === 'draw') {
            if (sigCanvas.current?.isEmpty()) {
                alert("Please sign first");
                return;
            }
            try {
                // Use standard toDataURL to avoid trim-canvas dependency issues
                const dataUrl = sigCanvas.current?.toDataURL('image/png');
                if (dataUrl) onSave(dataUrl);
            } catch (e) {
                console.error("SignaturePad: Error generating signature:", e);
            }
        } else {
            if (uploadedImage) onSave(uploadedImage);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md w-full border border-slate-200">
            <div className="bg-slate-50 p-4 border-b border-slate-100 flex gap-2">
                <button
                    onClick={() => setMode('draw')}
                    disabled={isSubmitting}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${mode === 'draw' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'} disabled:opacity-50 disabled:pointer-events-none`}
                >
                    <Pen className="w-4 h-4" /> Draw Signature
                </button>
                <button
                    onClick={() => setMode('upload')}
                    disabled={isSubmitting}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${mode === 'upload' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'} disabled:opacity-50 disabled:pointer-events-none`}
                >
                    <Upload className="w-4 h-4" /> Upload Scan
                </button>
            </div>

            <div className="p-6">
                {mode === 'draw' ? (
                    <div className="border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-slate-50/50 relative">
                        <SignatureCanvas
                            ref={sigCanvas}
                            penColor="black"
                            canvasProps={{ width: 400, height: 200, className: 'sigCanvas cursor-crosshair' }}
                        />
                        <button onClick={clear} disabled={isSubmitting} className="absolute top-2 right-2 p-2 bg-white/80 rounded-lg shadow-sm hover:text-red-500 disabled:opacity-50">
                            <Eraser className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
                            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.3em]">Sign Above</span>
                        </div>
                    </div>
                ) : (
                    <div className="border-2 border-dashed border-slate-300 rounded-xl h-[200px] flex flex-col items-center justify-center bg-slate-50/50 p-4 text-center">
                        {!uploadedImage ? (
                            <>
                                <input type="file" accept="image/*" onChange={processUpload} className="hidden" id="sig-upload" disabled={isSubmitting} />
                                <label htmlFor="sig-upload" className={`cursor-pointer flex flex-col items-center gap-2 ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}>
                                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-blue-500">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-600">Click to Upload Image</span>
                                    <span className="text-xs text-slate-400">White background will be removed automatically</span>
                                </label>
                            </>
                        ) : (
                            <div className="relative w-full h-full flex items-center justify-center">
                                <img src={uploadedImage} alt="Preview" className="max-h-full object-contain" />
                                <button onClick={() => setUploadedImage(null)} disabled={isSubmitting} className="absolute top-0 right-0 p-1 bg-red-100 text-red-600 rounded-full disabled:opacity-50">
                                    <Eraser className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-6 flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSubmitting}
                        className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Signing...
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4" /> Confirm Signature
                            </>
                        )}
                    </button>
                </div>

                <p className="mt-4 text-[10px] text-center text-slate-400 leading-tight">
                    By clicking confirm, you agree that this digital signature is legally binding and represents your approval of the submission. IP Address and Timestamp will be recorded.
                </p>
            </div>
        </div>
    );
};

export default SignaturePad;
