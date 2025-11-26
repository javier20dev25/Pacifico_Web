import React, { useState, useEffect, useRef } from 'react';
import apiClient from '@/api/axiosConfig';
import { AxiosError } from 'axios';
import ReactMarkdown from 'react-markdown';

// --- TIPOS ---
type ChatMessage = {
  sender: 'user' | 'ai';
  text: string;
  isError?: boolean;
};

const AiChat: React.FC<{ className?: string }> = ({ className }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    const messageText = input.trim();
    if (!messageText) return;

    setMessages(prev => [...prev, { sender: 'user', text: messageText }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await apiClient.post<{ response: string }>('/chat', { message: messageText });
      setMessages(prev => [...prev, { sender: 'ai', text: response.data.response }]);
    } catch (err: unknown) {
      const error = err as AxiosError<{ error: string }>;
      const errorMessage = error.response?.data?.error || 'El asistente no pudo responder.';
      setMessages(prev => [...prev, { sender: 'ai', text: errorMessage, isError: true }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { // Allow Shift + Enter for new line
      e.preventDefault(); // Prevent default behavior (e.g., new line)
      handleSendMessage();
    }
  };

  return (
    <div className={`w-full max-w-2xl bg-white rounded-3xl elegant-card overflow-hidden ${className}`}>
      <header className="p-6 bg-gradient-to-r from-indigo-600 to-purple-700 text-white text-center shadow-md">
        <h1 className="text-3xl font-bold tracking-tight">Asistente de IA</h1>
        <p className="text-indigo-200 mt-1">Tu compañero inteligente en todo momento.</p>
      </header>

      <div className="p-6 h-96 overflow-y-auto space-y-4">
        {messages.length === 0 && !isTyping && (
          <div className="text-gray-500 text-center">Inicia la conversación con tu asistente.</div>
        )}
        {messages.map((msg, index) => (
          <div key={index} className={'flex ' + (msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.sender === 'ai' && (
              <div className="w-8 h-8 flex-shrink-0 mr-2 mt-auto flex items-center justify-center rounded-full bg-gray-300 text-gray-700 font-semibold text-sm">AI</div>
            )}
            <div
              className={'max-w-[70%] p-4 rounded-t-xl shadow-sm ' +
                         (msg.sender === 'user'
                            ? 'rounded-bl-xl user-message text-white'
                            : (msg.isError
                                ? 'rounded-br-xl ai-message text-red-800 border border-red-200'
                                : 'rounded-br-xl ai-message text-gray-800'))}>
              {msg.sender === 'ai' ? <ReactMarkdown>{msg.text}</ReactMarkdown> : <p className="font-medium">{msg.text}</p>}
              {msg.isError && <p className="text-sm text-red-600 mt-1">Hubo un problema con la respuesta.</p>}
            </div>
            {msg.sender === 'user' && <div className="w-8 h-8 flex-shrink-0 ml-2 mt-auto flex items-center justify-center rounded-full bg-indigo-500 text-white font-semibold text-sm">TÚ</div>}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="w-8 h-8 flex-shrink-0 mr-2 mt-auto flex items-center justify-center rounded-full bg-gray-300 text-gray-700 font-semibold text-sm">AI</div>
            <div className="max-w-[70%] p-4 rounded-t-xl rounded-br-xl ai-message text-gray-800 shadow-sm">
              <div className="flex items-center justify-center space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center space-x-3">
        <textarea
          className="flex-grow p-3 rounded-2xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition duration-200 resize-none overflow-hidden"
          rows={1}
          placeholder="Escribe tu mensaje..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isTyping}
          onInput={(e) => {
            e.currentTarget.style.height = "";
            e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
          }}
        ></textarea>
        <button
          onClick={handleSendMessage}
          disabled={isTyping}
          className="send-button-gradient p-3 rounded-full text-white shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-300 flex-shrink-0"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default AiChat;
