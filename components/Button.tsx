import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  as?: React.ElementType;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  isLoading, 
  className = '', 
  disabled,
  as: Component = 'button',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 focus:ring-blue-500",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm hover:shadow-md focus:ring-slate-500",
    danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-500/25 focus:ring-rose-500",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus:ring-slate-500"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };

  const isDisabled = disabled || isLoading;

  return (
    <Component 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={Component === 'button' ? isDisabled : undefined}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
        </span>
      ) : children}
    </Component>
  );
};

export default Button;