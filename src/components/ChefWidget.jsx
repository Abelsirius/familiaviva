import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { ChefHat, X, Utensils, Carrot, Flame, Loader } from 'lucide-react';

export default function ChefWidget({ isOpen, onClose, onGenerateRecipe }) {
    const [ingredients, setIngredients] = useState('');
    const [recipeType, setRecipeType] = useState('Papilla'); // Papilla vs BLW
    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!ingredients.trim()) return;
        setLoading(true);
        const result = await onGenerateRecipe(ingredients, recipeType);
        setRecipe(result);
        setLoading(false);
    };

    const reset = () => {
        setRecipe(null);
        setIngredients('');
    };

    if (!isOpen) return null;

    return (
        <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-emerald-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
            <Motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
            >
                <div className="bg-emerald-500 p-6 flex items-center justify-between text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl">
                            <ChefHat size={24} />
                        </div>
                        <div>
                            <h2 className="font-bold text-xl">Chef Bebé</h2>
                            <p className="text-emerald-100 text-xs opacity-90">Nutrición inteligente</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 bg-emerald-50/30">
                    {!recipe ? (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">tengo en la nevera...</label>
                                <input
                                    value={ingredients}
                                    onChange={(e) => setIngredients(e.target.value)}
                                    placeholder="Ej: Zanahoria, Huevo, Arroz"
                                    className="w-full p-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-slate-800"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Estilo de comida</label>
                                <div className="flex gap-2">
                                    {['Papilla/Puré', 'BLW (Trozos)'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setRecipeType(type)}
                                            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold border transition-all ${recipeType === type
                                                ? 'bg-emerald-100 text-emerald-700 border-emerald-500'
                                                : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-200'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={!ingredients.trim() || loading}
                                className="w-full bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <><Loader className="animate-spin" /> Cocinando...</> : <><Flame size={18} /> Crear Receta</>}
                            </button>
                        </div>
                    ) : (
                        <Motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="prose prose-sm prose-emerald max-w-none text-slate-700"
                        >
                            <div dangerouslySetInnerHTML={{ __html: parseMarkdown(recipe) }} />

                            <div className="mt-8 pt-4 border-t border-slate-100">
                                <button
                                    onClick={reset}
                                    className="w-full py-3 text-slate-400 font-bold hover:text-emerald-600 transition-colors"
                                >
                                    Crear otra receta
                                </button>
                            </div>
                        </Motion.div>
                    )}
                </div>
            </Motion.div>
        </Motion.div>
    );
}

function parseMarkdown(text) {
    if (!text) return "";
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/# (.*?)\n/g, '<h3 class="text-lg font-bold text-emerald-800 mb-2">$1</h3>')
        .replace(/- (.*?)\n/g, '<li class="ml-4 list-disc mb-1">$1</li>')
        .replace(/\n/g, '<br/>');
}
