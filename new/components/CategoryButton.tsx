import React from 'react';
import { PencilIcon, TrashIcon } from './icons';
import type { ColorClasses } from '../types';

interface CategoryButtonProps {
  icon?: React.FC<{ className?: string }>;
  text: string;
  onClick: () => void;
  colorClasses?: ColorClasses;
  isEditing?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const CategoryButton: React.FC<CategoryButtonProps> = ({ icon: IconComponent, text, onClick, colorClasses, isEditing, onEdit, onDelete }) => {
  const colors = colorClasses || {
    bg: 'bg-white',
    border: 'border-teal-200',
    text: 'text-teal-600',
    hoverBorder: 'hover:border-teal-400',
  };

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
        disabled={isEditing}
        className={`w-full h-full flex flex-col items-center justify-center text-center p-6 bg-white border-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 ${colors.bg} ${colors.border} ${colors.hoverBorder} ${isEditing ? 'opacity-75' : ''}`}
      >
        {IconComponent && (
            <div className={`mb-3 ${colors.text}`}>
            <IconComponent className="w-12 h-12" />
            </div>
        )}
        <span className="font-semibold text-gray-800 text-lg">{text}</span>
      </button>
      {isEditing && onEdit && onDelete && (
        <div className="absolute top-1 left-1 flex gap-1">
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

export default CategoryButton;
