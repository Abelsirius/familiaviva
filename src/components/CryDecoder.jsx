import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Mic, Activity, AlertCircle, Check, Loader, X } from 'lucide-react';

export default function CryDecoder({ isOpen, onClose, onAnalyze }) {
    const [symptoms, setSymptoms] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState(null);

    const toggleSymptom = (s) => {
        setSymptoms(prev => prev.includes(s) ? prev.filter(i => i !== s) : [...prev, s]);
    };

    const handleAnalyze = async () => {
        if (symptoms.length === 0) return;
        setIsAnalyzing(true);
        const analysis = await onAnalyze(symptoms);
        setResult(analysis);
        setIsAnalyzing(false);
    };

    const reset = () => {
        setResult(null);
        setSymptoms([]);
    };

    if (!isOpen) return null;

    return (
        <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
            <Motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden h-[90vh] sm:h-auto flex flex-col relative"
            >
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 z-10">
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="bg-rose-500 p-6 text-white pb-10">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="animate-pulse" />
                        <h2 className="text-xl font-bold">Decodificador de Llanto</h2>
                    </div>
                    <p className="text-rose-100 text-sm opacity-90">Selecciona lo que observas para identificar la causa.</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 -mt-6 bg-white rounded-t-3xl relative z-0">
                    {!result ? (
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-bold text-slate-700 mb-3">Sonido del llanto:</h3>
                                <div className="flex flex-wrap gap-2">
                                    <SymptomTag label="Agudo / Chillido" value="agudo" selected={symptoms} onToggle={toggleSymptom} />
                                    <SymptomTag label="Rítmico" value="ritmico" selected={symptoms} onToggle={toggleSymptom} />
                                    <SymptomTag label="Quejumbroso" value="quejido" selected={symptoms} onToggle={toggleSymptom} />
                                    <SymptomTag label="Repentino" value="repentino" selected={symptoms} onToggle={toggleSymptom} />
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-700 mb-3">Lenguaje Corporal:</h3>
                                <div className="flex flex-wrap gap-2">
                                    <SymptomTag label="Arquea la espalda" value="arquea" selected={symptoms} onToggle={toggleSymptom} />
                                    <SymptomTag label="Frota sus ojos" value="ojos" selected={symptoms} onToggle={toggleSymptom} />
                                    <SymptomTag label="Puños cerrados" value="puños" selected={symptoms} onToggle={toggleSymptom} />
                                    <SymptomTag label="Patalea fuerte" value="patalea" selected={symptoms} onToggle={toggleSymptom} />
                                    <SymptomTag label="Se chupa la mano" value="manos" selected={symptoms} onToggle={toggleSymptom} />
                                </div>
                            </div>

                            <div className="pt-4">
                                <Motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleAnalyze}
                                    disabled={symptoms.length === 0 || isAnalyzing}
                                    className="w-full bg-rose-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-rose-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                                >
                                    {isAnalyzing ? <><Loader className="animate-spin" /> Analizando...</> : "Analizar Causa"}
                                </Motion.button>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center mb-6">
                                <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600">
                                    <AlertCircle size={40} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-1">{result.cause}</h3>
                                <p className="text-slate-500 font-medium">Probabilidad Alta</p>
                            </div>

                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-6">
                                <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <Check size={18} className="text-green-500" /> Solución Inmediata
                                </h4>
                                <p className="text-slate-600 leading-relaxed text-sm">{result.solution}</p>
                            </div>

                            <button onClick={reset} className="w-full py-3 text-slate-400 font-bold hover:text-slate-600">
                                Analizar otro llanto
                            </button>
                        </div>
                    )}
                </div>
            </Motion.div>
        </Motion.div>
    );
}

function SymptomTag({ label, value, selected, onToggle }) {
    const isSelected = selected.includes(value);
    return (
        <button
            onClick={() => onToggle(value)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border
                ${isSelected
                    ? 'bg-rose-500 text-white border-rose-500 shadow-md'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-rose-200'
                }`}
        >
            {label}
        </button>
    )
}
