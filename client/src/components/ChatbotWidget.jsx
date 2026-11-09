import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles, Globe2, Maximize2 } from 'lucide-react';
import { api } from '../services/api';

export default function ChatbotWidget({ isOpen, onClose, onExpandFull }) {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am your AI Food Rescue Assistant. How can I help you today? I support both English and తెలుగు!',
      suggestions: [
        'How can I donate food?',
        'How does AI smart matching work?',
        'What are the food safety guidelines?',
        'ఆహారం ఎలా దానం చేయాలి?'
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (messageText) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage = { sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.sendChatMessage(textToSend, language);
      const botMessage = {
        sender: 'bot',
        text: res.reply || 'Thank you for your inquiry. Please reach out to our rescue coordinator for further assistance.',
        suggestions: res.suggestions || []
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Sorry, I encountered an issue connecting to the AI agent service. Please try again.',
          suggestions: ['How to donate food?', 'Where can I find food?']
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[540px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="bg-linear-to-r from-emerald-600 to-teal-600 px-4 py-3 text-white flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              Food Rescue AI
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </h3>
            <span className="text-[10px] text-emerald-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              Online • English & తెలుగు
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'te' : 'en')}
            className="px-2 py-1 rounded-lg text-xs font-bold bg-white/20 hover:bg-white/30 transition flex items-center gap-1"
            title="Toggle Language"
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'తెలుగు' : 'English'}</span>
          </button>

          {onExpandFull && (
            <button
              onClick={onExpandFull}
              className="p-1.5 rounded-lg hover:bg-white/20 transition"
              title="Expand to Full Page"
            >
              <Maximize2 className="w-4 h-4 text-white" />
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition"
            title="Close Chat"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs ${
                m.sender === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-xs'
                  : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
              }`}
            >
              <div className="whitespace-pre-line">{m.text}</div>
            </div>

            {/* Suggestions Chips */}
            {m.suggestions && m.suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                {m.suggestions.map((s, sIdx) => (
                  <button
                    key={sIdx}
                    onClick={() => handleSend(s)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 font-medium transition text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl w-24">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-100" />
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-200" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={language === 'en' ? 'Ask food rescue query...' : 'ప్రశ్న అడగండి (e.g. ఆహారం ఎలా దానం చేయాలి?)'}
          className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

