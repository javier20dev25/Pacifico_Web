import { useState, useEffect, useRef } from 'react';
import apiClient from '../../api/axiosConfig';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline'; // Import Heroicon

interface Message {
  sender: 'user' | 'ai';
  text: string;
  isError?: boolean;
}

const AiChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    const message = input.trim();
    if (!message) return;

    setMessages(prev => [...prev, { sender: 'user', text: message }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await apiClient.post('/chat', { message });
      setMessages(prev => [...prev, { sender: 'ai', text: response.data.response }]);
    } catch (error: any) {
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
  }

  return (
    <div className="mb-8"> {/* Consistent spacing */}
      <h2 className="text-2xl font-bold text-googleBlue mb-6">Asistente de IA</h2>
      <div className="bg-googleBlue-50 shadow-lg rounded-lg border-t-4 border-googleBlue p-6">
        <div className="h-64 overflow-y-auto mb-4 p-4 border border-neutral-200 rounded-lg bg-neutral-50">
          {messages.length === 0 && !isTyping && (
            <div className="text-neutral-500 text-center">Inicia la conversación con tu asistente.</div>
          )}
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-end mb-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-primary-light text-white flex items-center justify-center font-bold mr-3 flex-shrink-0">IA</div>}
              <div 
                className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-xl ${msg.sender === 'user' ? 'bg-primary-DEFAULT text-white rounded-br-none' : (msg.isError ? 'bg-red-200 text-red-800 rounded-bl-none' : 'bg-neutral-200 text-neutral-800 rounded-bl-none')}`}>
                {msg.text}
              </div>
              {msg.sender === 'user' && <div className="w-8 h-8 rounded-full bg-secondary-DEFAULT text-white flex items-center justify-center font-bold ml-3 flex-shrink-0">TÚ</div>}
            </div>
          ))}
          {isTyping && (
            <div className="flex items-end mb-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary-light text-white flex items-center justify-center font-bold mr-3 flex-shrink-0">IA</div>
              <div className="px-4 py-2 rounded-xl bg-neutral-200 text-neutral-800 rounded-bl-none">
                <div className="flex items-center justify-center space-x-1">
                    <div className="w-2 h-2 bg-neutral-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-neutral-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-neutral-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="flex gap-2 mt-4"> {/* Added mt-4 for spacing */}
          <input 
            type="text" 
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none transition duration-200" 
            placeholder="Escribe tu mensaje..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isTyping}
          />
          <button onClick={handleSendMessage} disabled={isTyping} 
            className="inline-flex items-center justify-center bg-googleBlue text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-googleBlue disabled:bg-neutral-300 disabled:text-neutral-500 transition duration-300"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiChat;
