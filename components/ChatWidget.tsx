import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types';
import { sendMessageToChat } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { LoadingSpinner } from './LoadingSpinner';

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hi! I'm your RoomOrganizer assistant. Ask me anything about organizing, decluttering, or interior design!",
      timestamp: Date.now()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const chatHistory = [...messages, userMsg];
      const responseText = await sendMessageToChat(chatHistory);

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "I'm sorry, I encountered an issue. Please try again.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-lg transition-all transform hover:scale-105 z-50 flex items-center gap-2"
        aria-label="Open Chat"
      >
        <MessageSquare size={24} />
        <span className="font-medium hidden sm:inline">Ask AI Helper</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[90vw] sm:w-[400px] h-[500px] sm:h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-stone-200">
      {/* Header */}
      <div className="bg-emerald-600 p-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
            <Sparkles size={20} />
            <h3 className="font-semibold">RoomOrganizer Assistant</h3>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="hover:bg-white/20 p-1 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-none'
                  : 'bg-white border border-stone-200 text-stone-800 rounded-tl-none shadow-sm'
              }`}
            >
              <ReactMarkdown 
                components={{
                    ul: ({node, ...props}) => <ul className="list-disc ml-4" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal ml-4" {...props} />,
                    p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />
                }}
              >
                {msg.text}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="bg-white border border-stone-200 p-3 rounded-2xl rounded-tl-none shadow-sm">
                    <LoadingSpinner className="text-emerald-600" size={16} />
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-stone-200">
        <div className="relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask for advice..."
            className="w-full bg-stone-100 border-none rounded-full py-3 pl-4 pr-12 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-emerald-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-700 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
