import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Globe2, 
  HelpCircle, 
  HeartHandshake, 
  ShieldCheck, 
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ChatbotView() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am your AI Food Rescue Assistant. How can I assist you today? I fluently support both English and తెలుగు (Telugu)!\n\nనమస్కారం! నేను ఆహార రక్షణ AI సహాయకుడిని. మీకు ఎలా సహాయపడగలను?',
      suggestions: [
        'How can I donate food?',
        'Where can I find available food?',
        'How do I request food as an NGO?',
        'How does AI smart matching work?',
        'ఆహారం ఎలా దానం చేయాలి?',
        'ఆహార భద్రత నియమాలు ఏమిటి?'
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        text: res.reply,
        suggestions: res.suggestions || []
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Unable to connect to the Food Rescue AI assistant at the moment. Please try again.',
          suggestions: ['How to donate food?', 'Where can I find food?']
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    { en: 'How can I donate surplus food?', te: 'ఆహారం ఎలా దానం చేయాలి?' },
    { en: 'Where can I find available food nearby?', te: 'సమీపంలో ఆహారం ఎక్కడ లభిస్తుంది?' },
    { en: 'How do I request food as an NGO?', te: 'ఆహారాన్ని ఎలా అభ్యర్థించాలి?' },
    { en: 'How can NGOs and shelters register?', te: 'స్వచ్ఛంద సంస్థలు ఎలా నమోదు చేసుకోవాలి?' },
    { en: 'How does the AI smart matching work?', te: 'AI స్మార్ట్ మ్యాచింగ్ ఎలా పనిచేస్తుంది?' },
    { en: 'What are the food safety verification rules?', te: 'ఆహార భద్రత నియమాలు ఏమిటి?' }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
            <Bot className="w-4 h-4" />
            24/7 Intelligent Assistant
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            AI Food Rescue Chatbot
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ask questions about food donation, NGO onboarding, safety thresholds, or smart matching in English or Telugu.
          </p>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setLanguage('en')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              language === 'en'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            English
          </button>
          <button
            onClick={() => setLanguage('te')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              language === 'te'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            తెలుగు (Telugu)
          </button>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden flex flex-col h-[600px]">
        {/* Chat Window Banner */}
        <div className="bg-linear-to-r from-emerald-700 to-teal-700 px-6 py-3.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                Food Rescue Smart AI Assistant
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </h3>
              <p className="text-[11px] text-emerald-100">
                Active Language: {language === 'en' ? 'English (Universal)' : 'తెలుగు (Telugu)'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setMessages([{
              sender: 'bot',
              text: language === 'te' 
                ? 'నమస్కారం! నేను ఆహార రక్షణ AI సహాయకుడిని. మీకు ఎలా సహాయపడగలను?'
                : 'Hello! I am your AI Food Rescue Assistant. What would you like to know today?',
              suggestions: ['How to donate food?', 'Where can I find food?']
            }])}
            className="p-1.5 rounded-lg hover:bg-white/20 transition text-emerald-100"
            title="Reset Chat"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs ${
                  m.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-xs'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-line">{m.text}</div>
              </div>

              {/* Suggestions Chips */}
              {m.suggestions && m.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2.5 max-w-[85%]">
                  {m.suggestions.map((s, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => handleSend(s)}
                      className="text-xs px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium transition text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-2xl w-28">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce delay-100" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce delay-200" />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Suggested Prompt Strip */}
        <div className="px-6 py-2.5 bg-slate-100 border-t border-slate-200 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-bold text-slate-500 shrink-0">Quick Queries:</span>
          {sampleQuestions.map((q, idx) => {
            const label = language === 'te' ? q.te : q.en;
            return (
              <button
                key={idx}
                onClick={() => handleSend(label)}
                className="px-2.5 py-1 rounded-lg text-xs bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 font-medium whitespace-nowrap transition"
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 bg-white border-t border-slate-200 flex items-center gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              language === 'en'
                ? 'Type your inquiry here (e.g. How does food safety verification work?)...'
                : 'మీ ప్రశ్నను ఇక్కడ టైప్ చేయండి (e.g. ఆహారం ఎలా దానం చేయాలి?)...'
            }
            className="flex-1 px-4 py-3 text-sm rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 disabled:opacity-40 transition flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}

