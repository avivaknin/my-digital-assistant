import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage, MainCategory, SubCategory, ColorClasses, QuestionItem } from './types';
import { sendMessage } from './services/geminiService';
import Header from './components/Header';
import CategoryButton from './components/CategoryButton';
import ListButton from './components/ListButton';
import ChatMessageComponent from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import SettingsModal from './components/SettingsModal';
import PasswordPrompt from './components/PasswordPrompt';
import { 
    ArrowRightIcon, PlusIcon, PencilIcon, TrashIcon, HeartIcon, BankIcon, PhoneIcon, MapIcon, TvIcon, CameraIcon, ShieldIcon, GlobeIcon, BookOpenIcon, WrenchScrewdriverIcon, MonitorIcon
} from './components/icons';
import { getInitialCategories, generateId } from './data/categoriesData';

declare const html2canvas: any;
declare const jspdf: any;

const CHAT_STORAGE_KEY = 'digitalAssistantChatHistory';
const API_KEY_STORAGE_KEY = 'gemini_api_key';
const CATEGORIES_STORAGE_KEY = 'digitalAssistantCategories';

const iconMap: { [key: string]: React.FC<{className?: string}> } = {
  HeartIcon, BankIcon, PhoneIcon, MapIcon, TvIcon, CameraIcon, ShieldIcon, GlobeIcon, BookOpenIcon, WrenchScrewdriverIcon, MonitorIcon, PlusIcon
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const savedMessagesJSON = localStorage.getItem(CHAT_STORAGE_KEY);
      if (!savedMessagesJSON) return [];
      const savedMessages = JSON.parse(savedMessagesJSON) as ChatMessage[];
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
  const [categories, setCategories] = useState<MainCategory[]>(() => {
    try {
      const savedCategoriesJSON = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (!savedCategoriesJSON) return getInitialCategories();

      const parsedData = JSON.parse(savedCategoriesJSON);
      if (!Array.isArray(parsedData)) return getInitialCategories();

      const rehydratedCategories = parsedData.map((cat: any): MainCategory => {
        if (!cat.id || !cat.text || !cat.subCategories) {
          throw new Error('Invalid category structure in localStorage.');
        }
        return {
          ...cat,
          icon: cat.icon && iconMap[cat.icon.__iconName]
            ? React.createElement(iconMap[cat.icon.__iconName], cat.icon.props)
            : React.createElement(PlusIcon, { className: "w-12 h-12" }),
        };
      });
      return rehydratedCategories;
    } catch (error) {
      console.error("Could not load categories from localStorage", error);
      return getInitialCategories();
    }
  });
  const [editMode, setEditMode] = useState<'off' | 'prompt' | 'on'>('off');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

  useEffect(() => {
    try {
        const replacer = (key: string, value: any) => {
            if (key === 'icon' && value && value.type && value.type.name) {
                return { __iconName: value.type.name, props: value.props };
            }
            return value;
        };
        const categoriesJson = JSON.stringify(categories, replacer);
        localStorage.setItem(CATEGORIES_STORAGE_KEY, categoriesJson);
    } catch (error) {
        console.error("Could not save categories to localStorage", error);
    }
  }, [categories]);

  useEffect(() => {
    if (selectedCategory) {
        const freshCategory = categories.find(c => c.id === selectedCategory.id);
        if (!freshCategory) {
            setSelectedCategory(null);
            setSelectedSubCategory(null);
        } else {
            if (freshCategory !== selectedCategory) {
                setSelectedCategory(freshCategory);
            }
            if (selectedSubCategory) {
                const freshSubCategory = freshCategory.subCategories.find(s => s.id === selectedSubCategory.id);
                if (!freshSubCategory) {
                    setSelectedSubCategory(null);
                } else if (freshSubCategory !== selectedSubCategory) {
                    setSelectedSubCategory(freshSubCategory);
                }
            }
        }
    }
  }, [categories, selectedCategory, selectedSubCategory]);


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
    setSelectedSubCategory(subCat);
  };

  const handleSaveApiKey = (newKey: string) => {
    localStorage.setItem(API_KEY_STORAGE_KEY, newKey);
    setApiKey(newKey);
    setIsSettingsOpen(false);
    alert('המפתח נשמר בהצלחה!');
  };

  // --- Edit Mode Logic ---

  const handleToggleEdit = () => {
    if (editMode === 'on') {
        setEditMode('off');
    } else {
        setEditMode('prompt');
    }
  };

  const handlePasswordSubmit = (password: string) => {
      if (password === '2024') {
          setEditMode('on');
      } else {
          alert('סיסמה שגויה.');
          setEditMode('off');
      }
  };

  const handleCancelPassword = () => {
    setEditMode('off');
  };

  const handleAdd = (type: 'main' | 'sub' | 'question') => {
    const text = prompt(`הכנס את הטקסט עבור ${type === 'main' ? 'הקטגוריה הראשית' : type === 'sub' ? 'תת הקטגוריה' : 'השאלה'} החדשה:`);
    if (!text) return;

    setCategories(prev => {
        if (type === 'main') {
            const newCategory: MainCategory = {
                id: generateId(),
                text,
                icon: React.createElement(PlusIcon, { className: "w-12 h-12" }),
                colorClasses: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-500', hoverBorder: 'hover:border-gray-400' },
                subCategories: []
            };
            return [...prev, newCategory];
        } 
        if (type === 'sub' && selectedCategory) {
            const newSubCategory: SubCategory = { id: generateId(), text, questions: [] };
            return prev.map(cat => 
                cat.id === selectedCategory.id
                ? { ...cat, subCategories: [...cat.subCategories, newSubCategory] } 
                : cat
            );
        } 
        if (type === 'question' && selectedCategory && selectedSubCategory) {
            const newQuestion: QuestionItem = { id: generateId(), text };
            return prev.map(cat => 
                cat.id === selectedCategory.id ? {
                    ...cat,
                    subCategories: cat.subCategories.map(sub => 
                        sub.id === selectedSubCategory.id 
                        ? { ...sub, questions: [...sub.questions, newQuestion] } 
                        : sub)
                } : cat
            );
        }
        return prev;
    });
  };

  const handleEdit = (type: 'main' | 'sub' | 'question', id: string, currentText: string) => {
    const newText = prompt('ערוך את הטקסט:', currentText);
    if (!newText || newText === currentText) return;
  
    setCategories(prev => {
      return prev.map(mainCat => {
        if (type === 'main' && mainCat.id === id) {
          return { ...mainCat, text: newText };
        }
        if (type === 'sub' || type === 'question') {
          return {
            ...mainCat,
            subCategories: mainCat.subCategories.map(subCat => {
              if (type === 'sub' && subCat.id === id) {
                return { ...subCat, text: newText };
              }
              if (type === 'question') {
                return {
                  ...subCat,
                  questions: subCat.questions.map(q => q.id === id ? { ...q, text: newText } : q),
                };
              }
              return subCat;
            }),
          };
        }
        return mainCat;
      });
    });
  };
  
  const handleDelete = (type: 'main' | 'sub' | 'question', id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק?')) return;
  
    setCategories(prev => {
      if (type === 'main') {
        return prev.filter(cat => cat.id !== id);
      }
      return prev.map(mainCat => {
        if (type === 'sub') {
          return {
            ...mainCat,
            subCategories: mainCat.subCategories.filter(sub => sub.id !== id),
          };
        }
        if (type === 'question') {
          return {
            ...mainCat,
            subCategories: mainCat.subCategories.map(sub => ({
              ...sub,
              questions: sub.questions.filter(q => q.id !== id),
            })),
          };
        }
        return mainCat;
      });
    });
  };

  // --- Export/Import Handlers ---

  const processImportedCategories = (parsedData: any[]): MainCategory[] => {
    if (!Array.isArray(parsedData)) {
      throw new Error('המבנה הבסיסי של הקובץ צריך להיות מערך (array).');
    }

    return parsedData.map((cat: any): MainCategory => {
      if (!cat.text || !cat.subCategories) {
        throw new Error('לכל קטגוריה ראשית חייב להיות שדה "text" ו-"subCategories".');
      }
      return {
        ...cat,
        id: cat.id || generateId(),
        subCategories: (cat.subCategories || []).map((sub: any) => ({
          ...sub,
          id: sub.id || generateId(),
          questions: (sub.questions || []).map((q: any) => typeof q === 'string' ? { id: generateId(), text: q } : { ...q, id: q.id || generateId() })
        })),
        icon: cat.icon && iconMap[cat.icon.__iconName]
          ? React.createElement(iconMap[cat.icon.__iconName], cat.icon.props)
          : React.createElement(PlusIcon, { className: "w-12 h-12" }),
      };
    });
  };
  
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
                const rehydratedCategories = processImportedCategories(parsedData);

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

  const handleImportTs = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ts';
    input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const tsContent = event.target?.result as string;
                if (!tsContent) throw new Error("הקובץ ריק.");

                const assignment = 'const rehydratedCategories = ';
                const startIndex = tsContent.indexOf(assignment);
                if (startIndex === -1) {
                    throw new Error("פורמט קובץ TS לא תקין. לא נמצא המשתנה 'rehydratedCategories'.");
                }

                const jsonStartIndex = startIndex + assignment.length;
                const endIndex = tsContent.indexOf(';', jsonStartIndex);
                if (endIndex === -1) {
                    throw new Error("פורמט קובץ TS לא תקין. חסר ';' בסוף הצהרת המשתנה.");
                }

                const jsonString = tsContent.substring(jsonStartIndex, endIndex);
                
                const parsedData = JSON.parse(jsonString);
                const rehydratedCategories = processImportedCategories(parsedData);

                setCategories(rehydratedCategories);
                setSelectedCategory(null);
                setSelectedSubCategory(null);
                alert('הקטגוריות יובאו בהצלחה מקובץ TS!');

            } catch (error) {
                console.error("Error importing TS file:", error);
                alert(`שגיאה בייבוא קובץ ה-TS: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`);
            }
        };
        reader.onerror = () => {
            alert('שגיאה בקריאת הקובץ.');
        };
        reader.readAsText(file, 'UTF-8');
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
import { generateId } from './categoriesData'; // Assuming generateId is exported

const iconMap: { [key: string]: React.FC<{className?: string}> } = {
  HeartIcon, BankIcon, PhoneIcon, MapIcon, TvIcon, CameraIcon, ShieldIcon, GlobeIcon, BookOpenIcon, WrenchScrewdriverIcon, PlusIcon
};

const rehydratedCategories = ${JSON.stringify(categories, (key, value) => {
    if (key === 'icon' && value && value.type && value.type.name) {
        return { __iconName: value.type.name, props: value.props };
    }
    return value;
}, 2)};

export const getInitialCategories = (): MainCategory[] => rehydratedCategories.map((cat: any) => ({
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
            const questions = subCat.questions || [];
            questions.forEach(q => {
                rows.push([mainCat.text, subCat.text, q.text]);
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

  const handleResetCategories = () => {
    if (window.confirm('האם את/ה בטוח/ה שברצונך לאפס את כל הקטגוריות לברירת המחדל? כל השינויים שביצעת יימחקו.')) {
        setCategories(getInitialCategories());
        setSelectedCategory(null);
        setSelectedSubCategory(null);
    }
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
    const isEditing = editMode === 'on';
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
                {selectedSubCategory.questions?.map((question) => (
                    <ListButton
                        key={question.id}
                        text={question.text}
                        onClick={() => handleSendMessage(question.text)}
                        colorClasses={selectedCategory.colorClasses}
                        isEditing={isEditing}
                        onEdit={() => handleEdit('question', question.id, question.text)}
                        onDelete={() => handleDelete('question', question.id)}
                    />
                ))}
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
                {selectedCategory.subCategories.map((subCat) => (
                    <ListButton
                        key={subCat.id}
                        text={subCat.text}
                        onClick={() => handleSubCategoryClick(subCat)}
                        colorClasses={selectedCategory.colorClasses}
                        isEditing={isEditing}
                        onEdit={() => handleEdit('sub', subCat.id, subCat.text)}
                        onDelete={() => handleDelete('sub', subCat.id)}
                    />
                ))}
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
            {categories.map((cat) => (
                <CategoryButton
                    key={cat.id}
                    icon={cat.icon}
                    text={cat.text}
                    onClick={() => setSelectedCategory(cat)}
                    colorClasses={cat.colorClasses}
                    isEditing={isEditing}
                    onEdit={() => handleEdit('main', cat.id, cat.text)}
                    onDelete={() => handleDelete('main', cat.id)}
                />
            ))}
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
          onImportTs={handleImportTs}
          onExportCsv={handleExportCsv}
          onNewChat={handleNewChat}
          onSavePdf={handleSavePdf}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isSavingPdf={isSavingPdf}
          isChatActive={messages.length > 0}
          isEditing={editMode === 'on'}
          onToggleEdit={handleToggleEdit}
          onResetCategories={handleResetCategories}
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
        {editMode === 'prompt' && (
            <PasswordPrompt 
                onSubmit={handlePasswordSubmit} 
                onCancel={handleCancelPassword} 
            />
        )}
      </div>
    </div>
  );
};

export default App;