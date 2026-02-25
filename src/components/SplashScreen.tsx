import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Leaf } from 'lucide-react';

interface SplashScreenProps {
    onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
    useEffect(() => {
        const timer = setTimeout(onComplete, 3500);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="splash-container"
        >
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    duration: 1.5
                }}
                className="splash-logo-container"
            >
                <Leaf size={80} style={{ color: 'var(--primary)' }} />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="splash-text"
            >
                <h1 className="splash-title">ofagri</h1>
                <p className="splash-subtitle">Sowing the Future</p>
            </motion.div>

            <div className="splash-progress-container">
                <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "0%" }}
                    transition={{ duration: 3, ease: "easeInOut" }}
                    className="splash-progress-bar"
                />
            </div>
        </motion.div>
    );
};
