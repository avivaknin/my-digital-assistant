
import React, { useState, useEffect, useRef } from 'react';

interface PasswordPromptProps {
    onSubmit: (password: string) => void; 
    onCancel: () => void; 
}

const PasswordPrompt: React.FC<PasswordPromptProps> = ({ onSubmit, onCancel }) => {
    const [password, setPassword] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(password);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onCancel}>
            <div className="bg-white rounded-lg p-6 sm:p-8 shadow-xl max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-gray-800 mb-4">נדרשת סיסמה</h2>
                <p className="text-gray-600 mb-4">כדי להיכנס למצב עריכה, יש להזין את סיסמת הניהול.</p>
                <form onSubmit={handleSubmit}>
                    <input
                        ref={inputRef}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                        placeholder="הכנס סיסמה"
                    />
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                            ביטול
                        </button>
                        <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors">
                            אישור
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PasswordPrompt;