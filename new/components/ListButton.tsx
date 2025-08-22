
import React from 'react';
import type { ColorClasses } from '../types';
import { PencilIcon, TrashIcon } from './icons';

interface ListButtonProps {
  text: string;
  onClick: () => void;
  colorClasses: ColorClasses;
  icon?: React.ReactNode;
  isEditing?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const ListButton: React.FC<ListButtonProps> = ({ text, onClick, colorClasses, icon, isEditing, onEdit, onDelete }) => {
  const handleMainClick = (e: React.MouseEvent) => {
    if (isEditing) {
      e.preventDefault();
      return;
    }
    onClick();
  };
  
  return (
    <div className="relative w-full h-full">
      <button
        onClick={handleMainClick}
        className={`w-full h-full flex items-center text-right p-4 bg-white border-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ease-in-out transform hover:bg-gray-50 focus:outline-none focus:ring-2 ring-offset-2 ${colorClasses.border} ${colorClasses.hoverBorder} ${colorClasses.text.replace('text-', 'focus:ring-')} ${isEditing ? 'cursor-default opacity-75' : ''}`}
      >
        {icon && <span className="ml-4">{icon}</span>}
        <span className="font-semibold text-gray-800 text-lg">{text}</span>
      </button>
       {isEditing && onEdit && onDelete && (
        <div className="absolute top-2 left-2 flex gap-1">
          <button onClick={onEdit} className="p-1.5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Edit">
            <PencilIcon className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500" aria-label="Delete">
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ListButton;