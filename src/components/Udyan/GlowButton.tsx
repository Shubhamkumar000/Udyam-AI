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
  primary: 'btn-glow-primary bg-[#0D0D0D] text-[#F4F2F7] hover:bg-[#4B4963]',
  secondary: 'btn-glow-secondary border border-[#BFB7E3] bg-[#F4F2F7] text-[#0D0D0D] hover:bg-[#D9D2F0]',
  ghost: 'btn-glow-ghost text-[#4B4963] hover:text-[#0D0D0D] bg-transparent',
  outline: 'btn-glow-outline bg-black text-white hover:bg-gray-800',
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
    'relative inline-flex items-center justify-center gap-2 font-medium rounded-full overflow-hidden transition-colors duration-200 ' +
    variantClasses[variant] +
    ' ' +
    className;

  const inner = (
    <>
      <span className="btn-glow-shimmer" aria-hidden />
      <span className="btn-glow-sparkle btn-glow-sparkle-1" aria-hidden />
      <span className="btn-glow-sparkle btn-glow-sparkle-2" aria-hidden />
      <span className="relative z-10">{children}</span>
    </>
  );

  if (to) {
    return (
      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-block">
        <Link to={to} className={base}>
          {inner}
        </Link>
      </motion.div>
    );
  }

  if (href) {
    return (
      <motion.a
        href={href}
        className={base}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        {inner}
      </motion.a>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      className={base}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      {inner}
    </motion.button>
  );
};

export default GlowButton;
