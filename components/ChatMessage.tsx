

import React, { useMemo } from 'react';
import type { ChatMessage } from '../types';
import { SparklesIcon } from './icons';

interface ChatMessageProps {
  message: ChatMessage;
  onExpand: (text: string) => void;
}

const parseMarkdown = (text: string) => {
  const lines = text.split('\n');
  return lines.map((line, index) => {
    if (line.startsWith('**') && line.endsWith('**')) {
        return <strong key={index} className="font-bold">{line.substring(2, line.length - 2)}</strong>;
    }
    if (/^\d+\./.test(line)) {
      return <p key={index} className="mb-1">{line}</p>;
    }
    if (line.startsWith('* ')) {
        return <li key={index} className="ml-4 list-disc">{line.substring(2)}</li>
    }
    return <p key={index}>{line}</p>;
  });
};

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message, onExpand }) => {
  const isModel = message.role === 'model';
  const parsedContent = useMemo(() => parseMarkdown(message.text), [message.text]);
  const uniqueSources = useMemo(() => {
    if (!message.sources) return [];
    const seen = new Set();
    return message.sources.filter(source => {
      if (seen.has(source.uri)) {
        return false;
      }
      seen.add(source.uri);
      return true;
    });
  }, [message.sources]);

  return (
    <div className={`chat-message-container flex my-3 ${isModel ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`p-4 rounded-2xl max-w-xl lg:max-w-2xl ${
          isModel
            ? 'bg-gray-100 text-gray-800 rounded-br-none'
            : 'bg-teal-500 text-white rounded-bl-none'
        }`}
      >
        <div className="whitespace-pre-wrap leading-relaxed">
            {parsedContent}
            {message.isStreaming && <span className="inline-block w-2 h-4 bg-gray-600 animate-pulse ml-1" />}
        </div>
        {isModel && !message.isStreaming && message.text && (
            <>
                <button
                    onClick={() => onExpand(message.text)}
                    className="mt-4 flex items-center gap-2 text-sm text-teal-600 hover:text-teal-800 font-semibold transition-colors"
                >
                    <SparklesIcon className="w-4 h-4" />
                    <span>הרחב עם AI</span>
                </button>
                {uniqueSources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                        <h4 className="font-semibold text-sm text-gray-600 mb-2">מקורות מידע:</h4>
                        <ul className="list-disc pl-5 space-y-1">
                            {uniqueSources.map((source, index) => (
                                <li key={index}>
                                    <a 
                                        href={source.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline text-sm"
                                    >
                                        {source.title || new URL(source.uri).hostname}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};

export default ChatMessageComponent;