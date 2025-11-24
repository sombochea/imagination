
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'icon';
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  disabled,
  size = 'md',
  ...props 
}) => {
  const baseStyles = "font-bold transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 rounded-xl";
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3.5 text-base",
  };

  const variants = {
    primary: "bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/20 border border-transparent",
    secondary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 border border-transparent",
    outline: "border border-gray-200 text-gray-700 bg-white hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 shadow-sm",
    ghost: "text-gray-500 hover:bg-gray-100 hover:text-gray-900 bg-transparent",
    danger: "bg-red-50 hover:bg-red-100 text-red-600 border border-red-100",
    icon: "p-2 aspect-square rounded-full bg-transparent hover:bg-gray-100 text-gray-500 hover:text-brand-600 border border-transparent",
  };

  // If variant is icon, override padding with size irrelevant or fixed
  const classes = `${baseStyles} ${variant === 'icon' ? 'p-2' : sizeStyles[size]} ${variants[variant]} ${className}`;

  return (
    <button 
      className={classes}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {variant !== 'icon' && <span>Thinking...</span>}
        </>
      ) : children}
    </button>
  );
};
