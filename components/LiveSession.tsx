
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createLiveClient } from '../services/geminiService';
import { LiveServerMessage, Modality } from '@google/genai';
import { CloseIcon, MicIcon, WaveformIcon } from './icons';

interface LiveSessionProps {
    onClose: () => void;
}

const LiveSession: React.FC<LiveSessionProps> = ({ onClose }) => {
    const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
    const [volume, setVolume] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [activeSpeaker, setActiveSpeaker] = useState<'user' | 'model' | 'none'>('none');

    // Refs for audio handling to avoid stale closures
    const audioContextRef = useRef<AudioContext | null>(null);
    const inputContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const sessionPromiseRef = useRef<Promise<any> | null>(null);

    // Helper functions for audio processing
    const decodeAudioData = async (data: Uint8Array, ctx: AudioContext) => {
        const dataInt16 = new Int16Array(data.buffer);
        const frameCount = dataInt16.length;
        const buffer = ctx.createBuffer(1, frameCount, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i] / 32768.0;
        }
        return buffer;
    };

    const base64ToUint8Array = (base64: string) => {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    };

    const createPcmBlob = (data: Float32Array) => {
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
            int16[i] = data[i] * 32768;
        }
        const bytes = new Uint8Array(int16.buffer);
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return {
            data: btoa(binary),
            mimeType: 'audio/pcm;rate=16000',
        };
    };

    useEffect(() => {
        let mounted = true;

        const startSession = async () => {
            try {
                const ai = createLiveClient();
                
                // Audio Context Setup
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                const outputCtx = new AudioContextClass({ sampleRate: 24000 });
                const inputCtx = new AudioContextClass({ sampleRate: 16000 });
                
                audioContextRef.current = outputCtx;
                inputContextRef.current = inputCtx;

                // Microphone Stream
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const source = inputCtx.createMediaStreamSource(stream);
                const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                
                // Volume meter
                const analyser = inputCtx.createAnalyser();
                source.connect(analyser);
                const dataArray = new Uint8Array(analyser.frequencyBinCount);

                processor.onaudioprocess = (e) => {
                    if (!mounted) return;
                    
                    // Calculate volume for UI
                    analyser.getByteFrequencyData(dataArray);
                    const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
                    setVolume(avg);
                    if (avg > 10) setActiveSpeaker('user');
                    else if (activeSpeaker === 'user') setActiveSpeaker('none');

                    const inputData = e.inputBuffer.getChannelData(0);
                    const pcmBlob = createPcmBlob(inputData);
                    
                    if (sessionPromiseRef.current) {
                        sessionPromiseRef.current.then(session => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    }
                };

                source.connect(processor);
                processor.connect(inputCtx.destination);

                // Connect to Gemini Live
                const sessionPromise = ai.live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                    callbacks: {
                        onopen: () => {
                            if (mounted) setStatus('connected');
                        },
                        onmessage: async (msg: LiveServerMessage) => {
                            if (!mounted) return;
                            
                            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                            if (audioData) {
                                setActiveSpeaker('model');
                                const bytes = base64ToUint8Array(audioData);
                                const buffer = await decodeAudioData(bytes, outputCtx);
                                
                                const source = outputCtx.createBufferSource();
                                source.buffer = buffer;
                                source.connect(outputCtx.destination);
                                
                                const currentTime = outputCtx.currentTime;
                                const startTime = Math.max(nextStartTimeRef.current, currentTime);
                                source.start(startTime);
                                nextStartTimeRef.current = startTime + buffer.duration;
                                
                                sourcesRef.current.add(source);
                                source.onended = () => {
                                    sourcesRef.current.delete(source);
                                    if (sourcesRef.current.size === 0) setActiveSpeaker('none');
                                };
                            }

                            if (msg.serverContent?.interrupted) {
                                sourcesRef.current.forEach(s => s.stop());
                                sourcesRef.current.clear();
                                nextStartTimeRef.current = 0;
                                setActiveSpeaker('none');
                            }
                        },
                        onclose: () => {
                            if (mounted) setStatus('error');
                        },
                        onerror: (e) => {
                            console.error(e);
                            if (mounted) setStatus('error');
                        }
                    },
                    config: {
                        responseModalities: [Modality.AUDIO],
                        speechConfig: {
                            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
                        }
                    }
                });
                
                sessionPromiseRef.current = sessionPromise;

            } catch (err) {
                console.error("Failed to start live session", err);
                if (mounted) setStatus('error');
            }
        };

        startSession();

        return () => {
            mounted = false;
            if (audioContextRef.current) audioContextRef.current.close();
            if (inputContextRef.current) inputContextRef.current.close();
            // Note: Currently no direct 'close' method exposed on sessionPromise result in SDK types easily, 
            // but closing the context and stopping the loop effectively kills the client side.
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center p-4">
            <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                <CloseIcon className="w-8 h-8" />
            </button>

            <div className="flex flex-col items-center gap-8">
                <div className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-300 ${activeSpeaker === 'model' ? 'bg-cyan-500/20 shadow-[0_0_50px_rgba(6,182,212,0.5)]' : 'bg-slate-800'}`}>
                     {/* Visualizer Ring */}
                     {activeSpeaker === 'user' && (
                         <div className="absolute inset-0 rounded-full border-4 border-purple-500 animate-pulse" style={{ transform: `scale(${1 + volume / 100})` }}></div>
                     )}
                     
                     <div className="w-32 h-32 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-full flex items-center justify-center z-10 shadow-lg">
                        <WaveformIcon className="w-16 h-16 text-white" />
                     </div>
                </div>

                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {status === 'connecting' ? 'Connecting...' : status === 'error' ? 'Connection Failed' : 'Live Conversation'}
                    </h2>
                    <p className="text-slate-400">
                        {activeSpeaker === 'model' ? 'Lumina is speaking...' : activeSpeaker === 'user' ? 'Listening...' : 'Start speaking...'}
                    </p>
                </div>

                <div className="flex gap-4">
                     <div className="px-4 py-2 bg-slate-800 rounded-lg text-xs text-slate-400 font-mono">
                        Model: gemini-2.5-flash-native-audio
                     </div>
                </div>
            </div>
        </div>
    );
};

export default LiveSession;
