import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

type GlowButtonProps = {
  children: React.ReactNode;
  to?: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  className?: string;
  type?: 'button' | 'submit';
};

const variantClasses = {
  primary: 'btn-glow-primary bg-[#0D0D0D] text-[#F4F2F7] hover:bg-[#2a2a2a]',
  secondary: 'btn-glow-secondary border border-[#BFB7E3] bg-[#F4F2F7] text-[#0D0D0D] hover:bg-[#D9D2F0]',
  ghost: 'btn-glow-ghost text-[#4B4963] hover:text-[#0D0D0D] bg-transparent',
  outline: 'btn-glow-outline bg-black text-white hover:bg-gray-900',
};

const GlowButton: React.FC<GlowButtonProps> = ({
  children,
  to,
  href,
  onClick,
  variant = 'primary',
  className = '',
  type = 'button',
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 text-sm font-medium rounded-full px-5 py-2.5 transition-all duration-300 ease-out ' +
    variantClasses[variant] +
    ' ' +
    className;

  const motionProps = {
    whileHover: { scale: 1.02, transition: { duration: 0.2 } },
    whileTap: { scale: 0.98, transition: { duration: 0.1 } },
  };

  if (to) {
    return (
      <motion.div className="inline-flex" {...motionProps}>
        <Link to={to} className={base}>
          {children}
        </Link>
      </motion.div>
    );
  }

  if (href) {
    return (
      <motion.a href={href} className={base} {...motionProps}>
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button type={type} onClick={onClick} className={base} {...motionProps}>
      {children}
    </motion.button>
  );
};

export default GlowButton;
