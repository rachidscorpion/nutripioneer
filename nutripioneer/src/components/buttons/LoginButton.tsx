import * as motion from 'motion/react-client';
import { Loader2 } from 'lucide-react';
import styles from './LoginButton.module.css';

interface LoginButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'outline' | 'ghost';
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export default function LoginButton({
    children,
    className = '',
    variant = 'outline',
    isLoading = false,
    icon,
    disabled,
    ...props
}: LoginButtonProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ width: '100%' }}
        >
            <button
                className={`${styles.button} ${styles[variant]} ${className}`}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <Loader2 className={styles.loadingSpinner} size={20} />
                ) : (
                    <>
                        {icon && <span className="flex items-center justify-center w-5 h-5">{icon}</span>}
                        {children}
                    </>
                )}
            </button>
        </motion.div>
    );
}