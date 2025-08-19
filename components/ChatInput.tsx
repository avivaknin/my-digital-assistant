
import React, { useState } from 'react';
import { SendIcon } from './icons';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
    }
  };


  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center p-2 bg-white border-t border-gray-200"
    >
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="מה תרצו לדעת?"
        className="flex-grow p-3 bg-white text-gray-900 placeholder-gray-500 border-2 border-gray-300 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 transition-shadow"
        rows={1}
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading}
        className="mr-3 p-3 bg-teal-500 text-white rounded-full disabled:bg-gray-400 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors"
        aria-label="שלח שאלה"
      >
        {isLoading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
            <SendIcon className="w-6 h-6" />
        )}
      </button>
    </form>
  );
};

export default ChatInput;