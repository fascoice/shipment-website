import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  Globe, 
  Package, 
  Truck, 
  Clock, 
  Mail, 
  Minus,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Headphones
} from 'lucide-react';
import { sendChatMessage } from '../services/api';
import { ChatMessage } from '../types';

interface AiChatAssistantProps {
  onNavigateToBooking: () => void;
  onNavigateToTracking: (trackingNumber?: string) => void;
  onNavigateToRates: () => void;
}

export const AiChatAssistant: React.FC<AiChatAssistantProps> = ({
  onNavigateToBooking,
  onNavigateToTracking,
  onNavigateToRates,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [mode, setMode] = useState<'TEXT' | 'LIVE_VOICE'>('TEXT');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

  // Live Voice State (gemini-3.8-live)
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string>('Ready to talk');
  const [liveTranscript, setLiveTranscript] = useState<Array<{ sender: 'user' | 'model'; text: string }>>([
    { sender: 'model', text: 'Live Voice Mode ready. Tap "Start Voice Session" to speak with WTO Assistant using Gemini 3.8 Live.' },
  ]);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const initialWelcome: ChatMessage = {
    id: 'msg_welcome',
    sender: 'assistant',
    text: "Hello! 👋 Welcome to World Transport Overseas (WTO). I am your 24/7 international shipping assistant. You can chat with me or use the Live Voice Assistant (powered by Gemini 3.8 Live). How can I assist you?",
    timestamp: 'Just now',
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialWelcome]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceTranscriptEndRef = useRef<HTMLDivElement>(null);

  const quickActions = [
    { label: '📦 Track My Shipment', prompt: 'Where is my package? Please provide my consignment tracking status.' },
    { label: '⏱️ Shipping Transit & Modes', prompt: 'What are your international shipping transit times and transportation modes?' },
    { label: '🌍 Worldwide Hubs', prompt: 'What international locations do you cover?' },
    { label: '💳 Payment Info', prompt: 'How do I pay for my shipment and receive a verified invoice?' },
    { label: '📋 Book a Shipment', action: 'BOOK' },
    { label: '👤 Contact Support', prompt: 'I want to speak with a human support agent' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    voiceTranscriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, liveTranscript, isOpen, mode]);

  // Clean up live session on unmount or mode switch
  useEffect(() => {
    return () => {
      stopLiveSession();
    };
  }, []);

  // Helper functions for PCM audio encoding & decoding
  const floatTo16BitPCM = (input: Float32Array): ArrayBuffer => {
    const output = new DataView(new ArrayBuffer(input.length * 2));
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return output.buffer;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const playAudioChunk = (base64Audio: string) => {
    try {
      if (!outputAudioCtxRef.current) {
        outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000,
        });
      }
      const audioCtx = outputAudioCtxRef.current;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const binary = window.atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      const audioBuffer = audioCtx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.start();

      setVoiceStatus('WTO Assistant Speaking...');
      source.onended = () => {
        setVoiceStatus('Listening to you...');
      };
    } catch (err) {
      console.error('Audio chunk playback error:', err);
    }
  };

  // Start Live Audio Session (Gemini 3.8 Live API)
  const startLiveSession = async () => {
    try {
      setVoiceStatus('Initializing voice session with Gemini 3.8 Live...');
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        console.log('WebSocket connection established to WTO Live API');
        setIsLiveConnected(true);
        setVoiceStatus('Requesting microphone access...');

        try {
          if (!navigator?.mediaDevices?.getUserMedia) {
            setVoiceStatus('Microphone input is not supported in this environment. Please use text chat.');
            return;
          }

          // Initialize AudioContexts
          inputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
            sampleRate: 16000,
          });
          outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
            sampleRate: 24000,
          });

          // Request user microphone
          let stream: MediaStream;
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: {
                channelCount: 1,
                sampleRate: 16000,
                echoCancellation: true,
                noiseSuppression: true,
              },
            });
          } catch (micErr: any) {
            console.warn('Microphone access notice (voice fallback to text):', micErr?.message || micErr);
            const isNotFound = micErr?.name === 'NotFoundError' || micErr?.message?.toLowerCase().includes('not found');
            const isDenied = micErr?.name === 'NotAllowedError' || micErr?.name === 'PermissionDeniedError';
            setVoiceStatus(
              isNotFound
                ? 'No microphone detected on this device. Please use text chat.'
                : isDenied
                ? 'Microphone access denied. You can continue via text chat.'
                : 'Microphone unavailable. Please continue via text chat.'
            );
            return;
          }

          micStreamRef.current = stream;

          const source = inputAudioCtxRef.current.createMediaStreamSource(stream);
          const processor = inputAudioCtxRef.current.createScriptProcessor(4096, 1, 1);
          scriptProcessorRef.current = processor;

          processor.onaudioprocess = (e) => {
            if (ws.readyState === WebSocket.OPEN) {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBuffer = floatTo16BitPCM(inputData);
              const base64Audio = arrayBufferToBase64(pcmBuffer);
              ws.send(JSON.stringify({ audio: base64Audio }));
            }
          };

          source.connect(processor);
          processor.connect(inputAudioCtxRef.current.destination);

          setIsMicActive(true);
          setVoiceStatus('Listening... Speak now into your mic');
          setLiveTranscript((prev) => [
            ...prev,
            { sender: 'model', text: 'Connected to WTO Live Voice Assistant. How can I assist you with your freight today?' },
          ]);
        } catch (setupErr: any) {
          console.warn('Voice session initialization notice:', setupErr?.message || setupErr);
          setVoiceStatus('Voice mode unavailable. Please use text chat.');
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.audio) {
            playAudioChunk(data.audio);
          }
          if (data.text) {
            setLiveTranscript((prev) => [...prev, { sender: 'model', text: data.text }]);
          }
          if (data.interrupted) {
            setVoiceStatus('Interrupted. Listening...');
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('Live WebSocket error:', err);
        setVoiceStatus('Voice connection interrupted. Please try again.');
      };

      ws.onclose = () => {
        console.log('Live WebSocket closed');
        setIsLiveConnected(false);
        setIsMicActive(false);
        setVoiceStatus('Voice session ended.');
      };
    } catch (err: any) {
      console.error('Live session initialization error:', err);
      setVoiceStatus('Failed to start voice session: ' + err.message);
    }
  };

  const stopLiveSession = () => {
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsLiveConnected(false);
    setIsMicActive(false);
    setVoiceStatus('Voice session ended.');
  };

  // Text message handling
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setLoading(true);

    try {
      const res = await sendChatMessage(text, sessionId);
      const assistantMsg: ChatMessage = {
        id: `asst_${Date.now()}`,
        sender: 'assistant',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        trackingData: res.trackingQueried,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: "I am having a brief connection delay. Please feel free to email our customer desk directly at overseasworldtransport@gmail.com.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (qa: typeof quickActions[0]) => {
    if (qa.action === 'BOOK') {
      onNavigateToBooking();
      setIsOpen(false);
      return;
    }
    if (qa.prompt) {
      handleSendMessage(qa.prompt);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="group relative flex items-center space-x-2.5 bg-gradient-to-r from-[#0F2942] to-[#1E3A8A] hover:from-orange-500 hover:to-amber-600 text-white font-bold text-sm px-5 py-3.5 rounded-full shadow-2xl shadow-blue-950/40 border-2 border-white/20 transition-all duration-300 hover:scale-105 active:scale-95"
          aria-label="Open AI Shipping Assistant"
        >
          <div className="relative">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 ring-2 ring-white animate-pulse"></span>
            <MessageSquare className="w-5 h-5 text-orange-400 group-hover:text-white transition-colors" />
          </div>
          <span>💬 WTO Assistant (Text & Live Voice)</span>
        </button>
      )}

      {/* Modern Assistant Window */}
      {isOpen && (
        <div
          className={`bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-300 ${
            isMinimized ? 'h-16 w-80' : 'h-[620px] max-h-[85vh] w-[370px] sm:w-[430px]'
          }`}
        >
          {/* Header */}
          <div className="bg-[#0F2942] text-white p-4 flex items-center justify-between shadow-sm shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center font-bold text-white shadow-sm">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm font-heading flex items-center space-x-1.5">
                  <span>WTO AI Assistant</span>
                </h4>
                <div className="flex items-center space-x-1 text-[10px] text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Grounded • Live Voice Ready</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1 text-slate-300">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  stopLiveSession();
                  setIsOpen(false);
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Mode Switcher Tabs: Text Chat vs Gemini 3.8 Live Voice */}
              <div className="bg-slate-100 p-1.5 border-b border-slate-200 flex space-x-1 text-xs font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    stopLiveSession();
                    setMode('TEXT');
                  }}
                  className={`flex-1 py-1.5 rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
                    mode === 'TEXT'
                      ? 'bg-white text-[#0F2942] shadow-sm font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
                  <span>Text Assistant</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('LIVE_VOICE')}
                  className={`flex-1 py-1.5 rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
                    mode === 'LIVE_VOICE'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-sm font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Headphones className="w-3.5 h-3.5" />
                  <span>Live Voice (Gemini 3.8 Live)</span>
                </button>
              </div>

              {/* MODE 1: TEXT CHAT */}
              {mode === 'TEXT' && (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50 text-xs">
                    <div className="text-center my-1">
                      <span className="text-[10px] text-slate-500 bg-white/80 border border-slate-200 px-3 py-1 rounded-full font-medium shadow-2xs">
                        🔒 Grounded with official WTO Worldwide Database
                      </span>
                    </div>

                    {messages.map((msg) => {
                      const isAssistant = msg.sender === 'assistant';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm text-xs leading-relaxed whitespace-pre-line ${
                              isAssistant
                                ? 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs'
                                : 'bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-tr-xs font-medium'
                            }`}
                          >
                            {msg.text}
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 px-1">
                            {msg.timestamp}
                          </span>
                        </div>
                      );
                    })}

                    {loading && (
                      <div className="flex items-center space-x-2 text-slate-500 bg-white border border-slate-200 px-3.5 py-2 rounded-2xl rounded-tl-xs w-28">
                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce"></span>
                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce [animation-delay:0.4s]"></span>
                        <span className="text-[11px] font-semibold text-slate-400">Typing</span>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-slate-100/90 px-3 py-2 border-t border-slate-200/80 overflow-x-auto shrink-0 flex items-center space-x-1.5">
                    {quickActions.map((qa) => (
                      <button
                        key={qa.label}
                        onClick={() => handleQuickAction(qa)}
                        className="px-2.5 py-1 rounded-xl bg-white hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300 border border-slate-200 text-slate-700 text-[11px] font-bold whitespace-nowrap transition-colors shadow-2xs"
                      >
                        {qa.label}
                      </button>
                    ))}
                  </div>

                  {/* Human Help Notice (No owner phone number) */}
                  <div className="bg-blue-50/90 px-3 py-1.5 border-t border-blue-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">Need support?</span>
                    <a
                      href="mailto:overseasworldtransport@gmail.com?subject=Customer%20Support%20Inquiry%20-%20WTO"
                      className="font-bold text-blue-900 hover:text-orange-600 flex items-center space-x-1"
                    >
                      <Mail className="w-3 h-3 text-orange-500" />
                      <span>overseasworldtransport@gmail.com</span>
                    </a>
                  </div>

                  {/* Input Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2 shrink-0"
                  >
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Type a message or WTO tracking code..."
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500"
                    />
                    <button
                      type="submit"
                      disabled={loading || !inputMessage.trim()}
                      className="p-2.5 rounded-xl bg-[#0F2942] hover:bg-orange-600 disabled:opacity-50 text-white transition-colors shadow-sm"
                      aria-label="Send Message"
                    >
                      <Send className="w-4 h-4 text-orange-400" />
                    </button>
                  </form>
                </>
              )}

              {/* MODE 2: GEMINI 3.8 LIVE VOICE ASSISTANT */}
              {mode === 'LIVE_VOICE' && (
                <div className="flex-1 flex flex-col justify-between p-5 bg-gradient-to-b from-slate-900 via-[#0F2942] to-slate-950 text-white">
                  
                  {/* Status Banner */}
                  <div className="text-center space-y-1">
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-mono uppercase bg-white/10 text-orange-300 border border-white/10">
                      <Radio className={`w-3 h-3 ${isLiveConnected ? 'animate-pulse text-emerald-400' : 'text-slate-400'}`} />
                      <span>Gemini 3.8 Live API Voice Engine</span>
                    </span>
                    <p className="text-xs text-slate-300 font-medium">
                      {voiceStatus}
                    </p>
                  </div>

                  {/* Visual Soundwave Animation */}
                  <div className="my-auto flex flex-col items-center justify-center space-y-5">
                    <div className="relative">
                      <div className={`w-28 h-28 rounded-full flex items-center justify-center transition-all ${
                        isMicActive
                          ? 'bg-gradient-to-tr from-orange-500 to-amber-600 shadow-2xl shadow-orange-500/50 scale-105'
                          : 'bg-white/10 border border-white/20'
                      }`}>
                        {isMicActive ? (
                          <Mic className="w-12 h-12 text-white animate-pulse" />
                        ) : (
                          <MicOff className="w-12 h-12 text-slate-400" />
                        )}
                      </div>

                      {isMicActive && (
                        <div className="absolute inset-0 rounded-full border-2 border-orange-400 animate-ping opacity-40"></div>
                      )}
                    </div>

                    {/* Audio Wave Visualizer Bars */}
                    {isMicActive && (
                      <div className="flex items-center space-x-1.5 h-8">
                        <span className="w-1.5 bg-orange-400 rounded-full animate-bounce h-4"></span>
                        <span className="w-1.5 bg-orange-400 rounded-full animate-bounce h-7 [animation-delay:0.15s]"></span>
                        <span className="w-1.5 bg-orange-400 rounded-full animate-bounce h-5 [animation-delay:0.3s]"></span>
                        <span className="w-1.5 bg-orange-400 rounded-full animate-bounce h-8 [animation-delay:0.45s]"></span>
                        <span className="w-1.5 bg-orange-400 rounded-full animate-bounce h-3 [animation-delay:0.2s]"></span>
                      </div>
                    )}
                  </div>

                  {/* Live Transcript Drawer */}
                  <div className="bg-black/30 rounded-2xl p-3 max-h-36 overflow-y-auto border border-white/10 text-xs space-y-1.5 text-slate-300">
                    <span className="text-[10px] font-bold uppercase text-orange-400 block tracking-wider">
                      Real-Time Live Transcript:
                    </span>
                    {liveTranscript.map((t, idx) => (
                      <p key={idx} className="leading-relaxed">
                        <strong className={t.sender === 'user' ? 'text-blue-300' : 'text-emerald-300'}>
                          {t.sender === 'user' ? 'You: ' : 'WTO Live Assistant: '}
                        </strong>
                        {t.text}
                      </p>
                    ))}
                    <div ref={voiceTranscriptEndRef} />
                  </div>

                  {/* Voice Controls */}
                  <div className="pt-4 flex flex-col space-y-2">
                    {!isLiveConnected ? (
                      <button
                        onClick={startLiveSession}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 text-white font-extrabold text-xs shadow-lg shadow-orange-500/30 flex items-center justify-center space-x-2"
                      >
                        <Mic className="w-4 h-4" />
                        <span>Start Voice Session (Speak to WTO)</span>
                      </button>
                    ) : (
                      <button
                        onClick={stopLiveSession}
                        className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-lg flex items-center justify-center space-x-2"
                      >
                        <MicOff className="w-4 h-4" />
                        <span>End Voice Session</span>
                      </button>
                    )}

                    <div className="text-center">
                      <span className="text-[10px] text-slate-400">
                        Inquiries & Invoicing: <strong>overseasworldtransport@gmail.com</strong>
                      </span>
                    </div>
                  </div>

                </div>
              )}
            </>
          )}

        </div>
      )}

    </div>
  );
};
