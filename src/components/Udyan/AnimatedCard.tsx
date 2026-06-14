import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { fadeInUp, hoverLift, tapScale } from '../../utils/animations';

interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  index?: number;
  hover?: boolean;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  index = 0,
  hover = true,
  className = '',
  ...props
}) => (
  <motion.div
    variants={fadeInUp}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-40px' }}
    transition={{ delay: index * 0.07 }}
    whileHover={hover ? hoverLift : undefined}
    whileTap={hover ? tapScale : undefined}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

export default AnimatedCard;
