import React, { useEffect, useState, useCallback } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, X } from 'lucide-react';
import useVoiceRecognition from '../hooks/useVoiceRecognition';

export default function VoiceAssistant({
    onCommand,
    isOpen,
    onClose
}) {
    const { isListening, transcript, isSupported, startListening, stopListening } = useVoiceRecognition();
    const [feedback, setFeedback] = useState('');
    const [commandProcessed, setCommandProcessed] = useState(false);

    useEffect(() => {
        if (transcript && !commandProcessed) {
            processCommand(transcript);
            setCommandProcessed(true);
        }
    }, [transcript, commandProcessed]);

    const processCommand = useCallback((text) => {
        const lowerText = text.toLowerCase();

        // Comandos de ánimo
        if (lowerText.includes('verde') || lowerText.includes('calma')) {
            setFeedback('Registrando ánimo verde...');
            onCommand({ type: 'mood', value: 'verde' });
            setTimeout(onClose, 2000);
        }
        else if (lowerText.includes('ámbar') || lowerText.includes('estrés')) {
            setFeedback('Registrando ánimo ámbar...');
            onCommand({ type: 'mood', value: 'ambar' });
            setTimeout(onClose, 2000);
        }
        else if (lowerText.includes('rojo') || lowerText.includes('sos') || lowerText.includes('ayuda')) {
            setFeedback('Registrando SOS...');
            onCommand({ type: 'mood', value: 'rojo' });
            setTimeout(onClose, 2000);
        }
        // Comandos de herramientas
        else if (lowerText.includes('respirar') || lowerText.includes('respiro')) {
            setFeedback('Abriendo ejercicio de respiración...');
            onCommand({ type: 'tool', value: 'breathing' });
            setTimeout(onClose, 1500);
        }
        else if (lowerText.includes('llanto') || lowerText.includes('llorar')) {
            setFeedback('Abriendo decodificador de llanto...');
            onCommand({ type: 'tool', value: 'cry_decoder' });
            setTimeout(onClose, 1500);
        }
        else if (lowerText.includes('sueño') || lowerText.includes('dormir')) {
            setFeedback('Abriendo gurú del sueño...');
            onCommand({ type: 'tool', value: 'sleep_guru' });
            setTimeout(onClose, 1500);
        }
        else if (lowerText.includes('receta') || lowerText.includes('cocinar')) {
            setFeedback('Abriendo Chef Bebé...');
            onCommand({ type: 'tool', value: 'chef' });
            setTimeout(onClose, 1500);
        }
        else if (lowerText.includes('cuento') || lowerText.includes('historia')) {
            setFeedback('Abriendo cuentacuentos...');
            onCommand({ type: 'tool', value: 'storyteller' });
            setTimeout(onClose, 1500);
        }
        else {
            setFeedback(`No entendí: "${text}". Intenta: "registrar verde", "abrir respiración", etc.`);
        }
    }, [onCommand, onClose]);

    useEffect(() => {
        if (transcript && !commandProcessed) {
            processCommand(transcript);
            setCommandProcessed(true);
        }
    }, [transcript, commandProcessed, processCommand]);

    const handleMicClick = () => {
        if (isListening) {
            stopListening();
        } else {
            setFeedback('Escuchando...');
            setCommandProcessed(false);
            startListening();
        }
    };

    if (!isOpen) return null;

    if (!isSupported) {
        return (
            <AnimatePresence>
                <Motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                >
                    <Motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="bg-white rounded-3xl p-8 max-w-sm text-center"
                    >
                        <MicOff size={48} className="mx-auto mb-4 text-slate-400" />
                        <h3 className="font-bold text-xl mb-2">Voz no disponible</h3>
                        <p className="text-slate-600 mb-4">Tu navegador no soporta reconocimiento de voz.</p>
                        <button onClick={onClose} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold">
                            Cerrar
                        </button>
                    </Motion.div>
                </Motion.div>
            </AnimatePresence>
        );
    }

    return (
        <AnimatePresence>
            <Motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-gradient-to-br from-indigo-900/90 to-purple-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
            >
                <Motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 p-2 rounded-full transition-colors z-10"
                    >
                        <X size={20} className="text-white" />
                    </button>

                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-white text-center">
                        <Motion.div
                            animate={{ scale: isListening ? [1, 1.1, 1] : 1 }}
                            transition={{ repeat: isListening ? Infinity : 0, duration: 1.5 }}
                            className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
                        >
                            <Volume2 size={48} className={isListening ? 'animate-pulse' : ''} />
                        </Motion.div>
                        <h2 className="text-2xl font-bold mb-2">Asistente de Voz</h2>
                        <p className="text-indigo-100 text-sm">Di un comando para controlar la app</p>
                    </div>

                    {/* Body */}
                    <div className="p-8">
                        {/* Mic Button */}
                        <Motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleMicClick}
                            className={`w-full py-6 rounded-2xl font-bold text-lg shadow-lg transition-all mb-6 flex items-center justify-center gap-3 ${isListening
                                ? 'bg-red-500 text-white shadow-red-200'
                                : 'bg-indigo-500 text-white shadow-indigo-200'
                                }`}
                        >
                            {isListening ? (
                                <>
                                    <MicOff size={24} />
                                    Detener
                                </>
                            ) : (
                                <>
                                    <Mic size={24} />
                                    Presiona para hablar
                                </>
                            )}
                        </Motion.button>

                        {/* Feedback */}
                        {feedback && (
                            <Motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-6"
                            >
                                <p className="text-sm text-indigo-900 text-center font-medium">{feedback}</p>
                            </Motion.div>
                        )}

                        {/* Transcript */}
                        {transcript && (
                            <Motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6"
                            >
                                <p className="text-xs text-slate-500 mb-1">Escuché:</p>
                                <p className="text-slate-800 font-medium">"{transcript}"</p>
                            </Motion.div>
                        )}

                        {/* Examples */}
                        <div className="bg-slate-50 p-4 rounded-xl">
                            <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Ejemplos de comandos:</p>
                            <ul className="text-sm text-slate-600 space-y-1">
                                <li>• "Registrar ánimo verde"</li>
                                <li>• "Abrir respiración"</li>
                                <li>• "Ayuda con el llanto"</li>
                                <li>• "Abrir recetas"</li>
                            </ul>
                        </div>
                    </div>
                </Motion.div>
            </Motion.div>
        </AnimatePresence>
    );
}
