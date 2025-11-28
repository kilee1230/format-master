import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'ai';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  icon,
  className = '', 
  disabled,
  ...props 
}) => {
  
  const baseStyles = "flex items-center justify-center px-4 py-2 rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 border border-transparent shadow-sm",
    secondary: "bg-gray-700 hover:bg-gray-600 text-gray-100 focus:ring-gray-500 border border-gray-600",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 border border-transparent",
    ghost: "bg-transparent hover:bg-gray-800 text-gray-400 hover:text-white focus:ring-gray-500",
    ai: "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white focus:ring-indigo-500 shadow-md border border-indigo-500/50"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

export default Button;