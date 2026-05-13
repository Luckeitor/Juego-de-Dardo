import React from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  className?: string;
}

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-black hover:bg-opacity-90 shadow-neon",
  secondary: "bg-red-500 text-white hover:bg-red-600",
  outline: "border border-primary text-primary hover:bg-primary/10",
  ghost: "text-text-secondary hover:text-white",
};

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = "primary",
  className = "",
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-md font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
  >
    {children}
  </button>
);
