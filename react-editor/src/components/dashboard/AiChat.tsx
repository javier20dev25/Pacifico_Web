import React, { useState, useEffect, useRef } from 'react';
import apiClient from '@/api/axiosConfig';
import { AxiosError } from 'axios';

// --- TIPOS ---
type ChatMessage = {
  sender: 'user' | 'ai';
  text: string;
  isError?: boolean;
};

const AiChat = () => {
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Asistente de IA</h2>
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="h-64 overflow-y-auto mb-4 p-4 border rounded-lg bg-gray-50">
          {messages.length === 0 && !isTyping && (
            <div className="text-gray-500 text-center">Inicia la conversación con tu asistente.</div>
          )}
          {messages.map((msg, index) => (
            <div key={index} className={'flex items-end mb-4 ' + (msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-gray-600 text-white flex items-center justify-center font-bold mr-3 flex-shrink-0">IA</div>}
              <div 
                className={'max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-xl ' + (msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : (msg.isError ? 'bg-red-200 text-red-800 rounded-bl-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'))}>
                {msg.text}
              </div>
              {msg.sender === 'user' && <div className="w-8 h-8 rounded-full bg-blue-400 text-white flex items-center justify-center font-bold ml-3 flex-shrink-0">TÚ</div>}
            </div>
          ))}
          {isTyping && (
            <div className="flex items-end mb-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-gray-600 text-white flex items-center justify-center font-bold mr-3 flex-shrink-0">IA</div>
              <div className="px-4 py-2 rounded-xl bg-gray-200 text-gray-800 rounded-bl-none">
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
        <div className="flex gap-2">
          <input 
            type="text" 
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
            placeholder="Escribe tu mensaje..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isTyping}
          />
          <button onClick={handleSendMessage} disabled={isTyping} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiChat;
