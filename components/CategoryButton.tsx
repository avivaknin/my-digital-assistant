import React from 'react';

interface ColorClasses {
  bg: string;
  border: string;
  text: string;
  hoverBorder: string;
}

interface CategoryButtonProps {
  icon?: React.ReactNode;
  text: string;
  onClick: () => void;
  colorClasses?: ColorClasses;
}

const CategoryButton: React.FC<CategoryButtonProps> = ({ icon, text, onClick, colorClasses }) => {
  const colors = colorClasses || {
    bg: 'bg-white',
    border: 'border-teal-200',
    text: 'text-teal-600',
    hoverBorder: 'hover:border-teal-400',
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center text-center p-6 bg-white border-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 h-full ${colors.bg} ${colors.border} ${colors.hoverBorder}`}
    >
      {icon && <div className={`mb-3 ${colors.text}`}>{icon}</div>}
      <span className="font-semibold text-gray-800 text-lg">{text}</span>
    </button>
  );
};

export default CategoryButton;