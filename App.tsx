import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage, MainCategory, SubCategory, ColorClasses } from './types';
import { sendMessage } from './services/geminiService';
import Header from './components/Header';
import CategoryButton from './components/CategoryButton';
import ListButton from './components/ListButton';
import ChatMessageComponent from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import SettingsModal from './components/SettingsModal';
import { 
    ArrowRightIcon, PlusIcon, PencilIcon, TrashIcon, HeartIcon, BankIcon, PhoneIcon, MapIcon, TvIcon, CameraIcon, ShieldIcon, GlobeIcon, BookOpenIcon, WrenchScrewdriverIcon 
} from './components/icons';
import { mainCategories as initialCategories } from './data/categoriesData';

declare const html2canvas: any;
declare const jspdf: any;

const CHAT_STORAGE_KEY = 'digitalAssistantChatHistory';
const API_KEY_STORAGE_KEY = 'gemini_api_key';

const iconMap: { [key: string]: React.FC<{className?: string}> } = {
  HeartIcon, BankIcon, PhoneIcon, MapIcon, TvIcon, CameraIcon, ShieldIcon, GlobeIcon, BookOpenIcon, WrenchScrewdriverIcon, PlusIcon
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const savedMessagesJSON = localStorage.getItem(CHAT_STORAGE_KEY);
      if (!savedMessagesJSON) return [];
      const savedMessages = JSON.parse(savedMessagesJSON) as ChatMessage[];
      // Ensure no messages are stuck in a streaming state on load
      return savedMessages.map(msg => ({ ...msg, isStreaming: false }));
    } catch (error) {
      console.error("Could not load messages from localStorage", error);
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingPdf, setIsSavingPdf] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(() => localStorage.getItem(API_KEY_STORAGE_KEY));
  const [selectedCategory, setSelectedCategory] = useState<MainCategory | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null);
  const [categories, setCategories] = useState<MainCategory[]>(initialCategories);
  const [isEditing, setIsEditing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // On first load, check if API key is missing in local development
    const isLocal = !window.location.hostname.includes('netlify.app');
    if (isLocal && !apiKey) {
      setIsSettingsOpen(true);
    }
  }, [apiKey]);
  
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
      } else {
        localStorage.removeItem(CHAT_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Could not save messages to localStorage", error);
    }
  }, [messages]);

  const handleSendMessage = useCallback(async (text: string, isExpansion = false) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: isExpansion ? `הרחיבי בבקשה על הנושא: "${text}"` : text,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setSelectedCategory(null);
    setSelectedSubCategory(null);

    const modelMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: modelMessageId, role: 'model', text: '', isStreaming: true, sources: [] },
    ]);

    let fullResponse = '';
    let sources: any[] = [];
    await sendMessage(text, (chunk) => {
        if(chunk.text) {
          fullResponse += chunk.text;
        }
        if(chunk.sources && chunk.sources.length > 0) {
            sources = chunk.sources;
        }
        setMessages((prev) =>
            prev.map((msg) =>
            msg.id === modelMessageId ? { ...msg, text: fullResponse, sources } : msg
            )
        );
    });

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === modelMessageId ? { ...msg, isStreaming: false } : msg
      )
    );
    setIsLoading(false);
  }, []);

  const handleExpand = useCallback((text: string) => {
    handleSendMessage(text, true);
  }, [handleSendMessage]);
  
  const handleSubCategoryClick = (subCat: SubCategory) => {
    if (subCat.questions) {
      setSelectedSubCategory(subCat);
    } else if (subCat.question) {
      handleSendMessage(subCat.question);
    }
  };

  const handleSaveApiKey = (newKey: string) => {
    localStorage.setItem(API_KEY_STORAGE_KEY, newKey);
    setApiKey(newKey);
    setIsSettingsOpen(false);
    alert('המפתח נשמר בהצלחה!');
  };

  // --- Edit Mode Handlers ---

  const handleAdd = (type: 'main' | 'sub' | 'question') => {
    const text = prompt(`הכנס את הטקסט עבור ${type === 'main' ? 'הקטגוריה הראשית' : type === 'sub' ? 'תת הקטגוריה' : 'השאלה'} החדשה:`);
    if (!text) return;

    if (type === 'main') {
        const newCategory: MainCategory = {
            text,
            icon: React.createElement(PlusIcon, { className: "w-12 h-12" }),
            colorClasses: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-500', hoverBorder: 'hover:border-gray-400' },
            subCategories: []
        };
        setCategories(prev => [...prev, newCategory]);
    } else if (type === 'sub' && selectedCategory) {
        const newSubCategory: SubCategory = { text, questions: [] };
        const newCategories = categories.map(cat => cat === selectedCategory ? { ...cat, subCategories: [...cat.subCategories, newSubCategory] } : cat);
        setCategories(newCategories);
        setSelectedCategory(newCategories.find(c => c.text === selectedCategory.text) || null);
    } else if (type === 'question' && selectedCategory && selectedSubCategory) {
        const newCategories = categories.map(cat => cat === selectedCategory ? {
            ...cat,
            subCategories: cat.subCategories.map(sub => sub === selectedSubCategory ? { ...sub, questions: [...(sub.questions || []), text] } : sub)
        } : cat);
        setCategories(newCategories);
        const updatedMain = newCategories.find(c => c.text === selectedCategory.text);
        const updatedSub = updatedMain?.subCategories.find(s => s.text === selectedSubCategory.text);
        setSelectedCategory(updatedMain || null);
        setSelectedSubCategory(updatedSub || null);
    }
  };

  const handleEdit = (type: 'main' | 'sub' | 'question', mainIndex: number, subIndex?: number, qIndex?: number) => {
    const currentText = type === 'main' ? categories[mainIndex].text : type === 'sub' ? categories[mainIndex].subCategories[subIndex!].text : categories[mainIndex].subCategories[subIndex!].questions![qIndex!];
    const newText = prompt('ערוך את הטקסט:', currentText);
    if (!newText || newText === currentText) return;

    const newCategories = [...categories];
    if (type === 'main') {
        newCategories[mainIndex].text = newText;
    } else if (type === 'sub') {
        newCategories[mainIndex].subCategories[subIndex!].text = newText;
    } else if (type === 'question') {
        newCategories[mainIndex].subCategories[subIndex!].questions![qIndex!] = newText;
    }
    setCategories(newCategories);
  };

  const handleDelete = (type: 'main' | 'sub' | 'question', mainIndex: number, subIndex?: number, qIndex?: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק?')) return;
    
    let newCategories = [...categories];
    if (type === 'main') {
        newCategories.splice(mainIndex, 1);
    } else if (type === 'sub') {
        newCategories[mainIndex].subCategories.splice(subIndex!, 1);
    } else if (type === 'question') {
        newCategories[mainIndex].subCategories[subIndex!].questions!.splice(qIndex!, 1);
    }
    setCategories(newCategories);
  };
  
  const EditableWrapper: React.FC<{ children: React.ReactNode; onEdit: () => void; onDelete: () => void; }> = ({ children, onEdit, onDelete }) => (
    <div className="relative group w-full h-full">
        {children}
        <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="p-1.5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"><PencilIcon className="w-4 h-4" /></button>
            <button onClick={onDelete} className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"><TrashIcon className="w-4 h-4" /></button>
        </div>
    </div>
  );


  // --- Export Handlers ---
  
  const handleImportJson = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const jsonContent = event.target?.result as string;
                if (!jsonContent) throw new Error("הקובץ ריק.");
                
                const parsedData = JSON.parse(jsonContent);

                if (!Array.isArray(parsedData)) {
                    throw new Error('המבנה הבסיסי של הקובץ צריך להיות מערך (array).');
                }

                const rehydratedCategories = parsedData.map((cat: any): MainCategory => {
                    if (!cat.text || !cat.subCategories) {
                        throw new Error('לכל קטגוריה ראשית חייב להיות שדה "text" ו-"subCategories".');
                    }
                    return {
                        ...cat,
                        icon: cat.icon && iconMap[cat.icon.__iconName]
                            ? React.createElement(iconMap[cat.icon.__iconName], cat.icon.props)
                            : React.createElement(PlusIcon, { className: "w-12 h-12" }),
                    };
                });

                setCategories(rehydratedCategories);
                setSelectedCategory(null);
                setSelectedSubCategory(null);
                alert('הקטגוריות יובאו בהצלחה!');

            } catch (error) {
                console.error("Error importing JSON:", error);
                alert(`שגיאה בייבוא הקובץ: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`);
            }
        };
        reader.onerror = () => {
            alert('שגיאה בקריאת הקובץ.');
        };
        reader.readAsText(file);
    };
    input.click();
  };

  const handleSaveJson = () => {
    const replacer = (key: string, value: any) => {
        if (key === 'icon' && value && value.type && value.type.name) {
            return { __iconName: value.type.name, props: value.props };
        }
        return value;
    };
    const jsonString = JSON.stringify(categories, replacer, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'categories-backup.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportTs = () => {
    const tsString = `import React from 'react';
import type { MainCategory } from '../types';
// This is a helper to recreate the icon elements. In a real app, you might have a map of names to components.
import {
  HeartIcon, BankIcon, PhoneIcon, MapIcon, TvIcon, CameraIcon, ShieldIcon, GlobeIcon, BookOpenIcon, WrenchScrewdriverIcon, PlusIcon
} from '../components/icons';

const iconMap: { [key: string]: React.FC<{className?: string}> } = {
  HeartIcon, BankIcon, PhoneIcon, MapIcon, TvIcon, CameraIcon, ShieldIcon, GlobeIcon, BookOpenIcon, WrenchScrewdriverIcon, PlusIcon
};

const rehydratedCategories = ${JSON.stringify(categories, (key, value) => {
    if (key === 'icon' && value && value.type && value.type.name) {
        return { __iconName: value.type.name, props: value.props };
    }
    return value;
}, 2)};

export const mainCategories: MainCategory[] = rehydratedCategories.map((cat: any) => ({
    ...cat,
    icon: cat.icon && iconMap[cat.icon.__iconName] 
        ? React.createElement(iconMap[cat.icon.__iconName], cat.icon.props) 
        : React.createElement(PlusIcon, { className: "w-12 h-12" }),
}));`;
    
    const blob = new Blob([tsString], { type: 'application/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'categoriesData.ts';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleExportCsv = () => {
    const rows: string[][] = [];
    
    categories.forEach(mainCat => {
        (mainCat.subCategories || []).forEach(subCat => {
            const questions = subCat.questions || (subCat.question ? [subCat.question] : []);
            questions.forEach(q => {
                rows.push([mainCat.text, subCat.text, q]);
            });
        });
    });

    const escapeCsvCell = (cell: string) => `"${(cell || '').replace(/"/g, '""')}"`;

    const headers = ['category', 'sub_category', 'question'].map(escapeCsvCell).join(',');
    const csvRows = rows.map(row => row.map(escapeCsvCell).join(','));

    const csvContent = [headers, ...csvRows].join('\n');
    
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'categories-backup.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleNewChat = () => {
    setMessages([]);
    setSelectedCategory(null);
    setSelectedSubCategory(null);
  };

  const handleSavePdf = async () => {
    setIsSavingPdf(true);
    const chatContainer = document.getElementById('chat-content-area');
    if (!chatContainer) {
      console.error('Chat container not found');
      setIsSavingPdf(false);
      return;
    }

    try {
      const canvas = await html2canvas(chatContainer, {
        scale: 2,
        useCORS: true,
        scrollY: -window.scrollY,
      });

      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = jspdf;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgWidth / pdfWidth;
      const scaledHeight = imgHeight / ratio;

      let heightLeft = scaledHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      while (heightLeft > 0) {
        position -= pdf.internal.pageSize.getHeight();
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }
      
      pdf.save('digital-assistant-chat.pdf');

    } catch (error) {
      console.error("Failed to save PDF:", error);
      alert("מצטער, הייתה בעיה ביצירת קובץ ה-PDF.");
    } finally {
      setIsSavingPdf(false);
    }
  };

  const renderContent = () => {
    if (messages.length > 0) {
      return (
        <div className="flex-grow">
          {messages.map((msg) => (
            <ChatMessageComponent key={msg.id} message={msg} onExpand={() => handleExpand(msg.text)} />
          ))}
          <div ref={chatEndRef} />
        </div>
      );
    }

    if (selectedCategory && selectedSubCategory) {
        const mainIndex = categories.findIndex(c => c === selectedCategory);
        const subIndex = selectedCategory.subCategories.findIndex(s => s === selectedSubCategory);

        return (
            <div className="flex flex-col items-center">
                <button
                onClick={() => setSelectedSubCategory(null)}
                className="self-start flex items-center gap-2 text-teal-600 hover:text-teal-800 font-semibold mb-6 transition-colors"
                aria-label={`חזרה ל${selectedCategory.text}`}
              >
                <ArrowRightIcon className="w-5 h-5" />
                <span>{`חזרה ל${selectedCategory.text}`}</span>
              </button>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">{selectedCategory.text}</h2>
              <h3 className="text-xl text-gray-600 mb-6">{selectedSubCategory.text}</h3>
              <div className="w-full max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedSubCategory.questions?.map((question, qIndex) => {
                    const button = <ListButton
                        key={question}
                        text={question}
                        onClick={() => handleSendMessage(question)}
                        colorClasses={selectedCategory.colorClasses}
                    />;
                    return isEditing ? <EditableWrapper key={question+qIndex} onEdit={() => handleEdit('question', mainIndex, subIndex, qIndex)} onDelete={() => handleDelete('question', mainIndex, subIndex, qIndex)}>{button}</EditableWrapper> : button;
                })}
                {isEditing && (
                  <div className="sm:col-span-2">
                    <ListButton text="הוסף שאלה חדשה" icon={<PlusIcon className="w-6 h-6" />} onClick={() => handleAdd('question')} colorClasses={{ bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-500', hoverBorder: 'hover:border-gray-400' }} />
                  </div>
                )}
              </div>
            </div>
        )
    }

    if (selectedCategory) {
        const mainIndex = categories.findIndex(c => c === selectedCategory);
        return (
            <div className="flex flex-col items-center">
                <button
                onClick={() => setSelectedCategory(null)}
                className="self-start flex items-center gap-2 text-teal-600 hover:text-teal-800 font-semibold mb-6 transition-colors"
                aria-label="חזרה לכל הקטגוריות"
                >
                <ArrowRightIcon className="w-5 h-5" />
                <span>חזרה לכל הקטגוריות</span>
                </button>
                <h2 className="text-2xl font-semibold text-gray-700 mb-6">{selectedCategory.text}</h2>
                <div className="w-full max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedCategory.subCategories.map((subCat, subIndex) => {
                    const button = <ListButton
                        key={subCat.text}
                        text={subCat.text}
                        onClick={() => handleSubCategoryClick(subCat)}
                        colorClasses={selectedCategory.colorClasses}
                    />;
                    return isEditing ? <EditableWrapper key={subCat.text+subIndex} onEdit={() => handleEdit('sub', mainIndex, subIndex)} onDelete={() => handleDelete('sub', mainIndex, subIndex)}>{button}</EditableWrapper> : button;
                })}
                 {isEditing && (
                  <div className="sm:col-span-2">
                    <ListButton text="הוסף תת-קטגוריה" icon={<PlusIcon className="w-6 h-6" />} onClick={() => handleAdd('sub')} colorClasses={{ bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-500', hoverBorder: 'hover:border-gray-400' }} />
                  </div>
                )}
                </div>
          </div>
        )
    }

    return (
        <>
            <h2 className="text-2xl font-semibold text-gray-700 mb-6 text-center">במה אוכל לעזור היום?</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((cat, index) => {
                const button = <CategoryButton
                    key={cat.text}
                    icon={cat.icon}
                    text={cat.text}
                    onClick={() => setSelectedCategory(cat)}
                    colorClasses={cat.colorClasses}
                />;
                return isEditing ? <EditableWrapper key={cat.text+index} onEdit={() => handleEdit('main', index)} onDelete={() => handleDelete('main', index)}>{button}</EditableWrapper> : button;
            })}
            {isEditing && <CategoryButton text="הוסף קטגוריה חדשה" icon={<PlusIcon className="w-10 h-10" />} onClick={() => handleAdd('main')} colorClasses={{ bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-500', hoverBorder: 'hover:border-gray-400' }} />}
            </div>
        </>
    )
  }


  return (
    <div className="bg-slate-50 min-h-screen flex flex-col items-center font-sans text-gray-800">
      <div className="w-full max-w-4xl mx-auto flex flex-col h-screen">
        <Header 
          className="print:hidden"
          onSaveJson={handleSaveJson}
          onImportJson={handleImportJson}
          onExportTs={handleExportTs}
          onExportCsv={handleExportCsv}
          onNewChat={handleNewChat}
          onSavePdf={handleSavePdf}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isSavingPdf={isSavingPdf}
          isChatActive={messages.length > 0}
          isEditing={isEditing}
          onToggleEdit={() => setIsEditing(!isEditing)}
        />
        <main className="flex-grow p-4 overflow-y-auto flex flex-col">
          <div className="p-4" id="chat-content-area">
            {renderContent()}
          </div>
        </main>
        <div className="sticky bottom-0 bg-slate-50 w-full print:hidden">
            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
        <SettingsModal 
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            onSave={handleSaveApiKey}
            currentApiKey={apiKey}
        />
      </div>
    </div>
  );
};

export default App;