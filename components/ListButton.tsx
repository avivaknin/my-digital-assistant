import React from 'react';
import type { ColorClasses } from '../types';

interface ListButtonProps {
  text: string;
  onClick: () => void;
  colorClasses: ColorClasses;
  icon?: React.ReactNode;
}

const ListButton: React.FC<ListButtonProps> = ({ text, onClick, colorClasses, icon }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full h-full flex items-center text-right p-4 bg-white border-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ease-in-out transform hover:bg-gray-50 focus:outline-none focus:ring-2 ring-offset-2 ${colorClasses.border} ${colorClasses.hoverBorder} ${colorClasses.text.replace('text-', 'focus:ring-')}`}
    >
      {icon && <span className="ml-4">{icon}</span>}
      <span className="font-semibold text-gray-800 text-lg">{text}</span>
    </button>
  );
};

export default ListButton;