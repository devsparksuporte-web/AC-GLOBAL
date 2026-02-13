import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface PageTransitionProps {
    children: ReactNode;
    type?: 'slide' | 'fade' | 'scale';
}

const variants = {
    slide: {
        initial: { x: '100%', opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: '-100%', opacity: 0 },
    },
    fade: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
    },
    scale: {
        initial: { scale: 0.9, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 1.1, opacity: 0 },
    }
};

export function PageTransition({ children, type = 'slide' }: PageTransitionProps) {
    return (
        <motion.div
            variants={variants[type]}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{
                type: 'spring',
                stiffness: 400,
                damping: 35,
                mass: 0.8,
                opacity: { duration: 0.2 }
            }}
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {children}
        </motion.div>
    );
}
