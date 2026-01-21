import * as motion from 'motion/react-client';
import { Loader2 } from 'lucide-react';

export default function NPLoader2({
    className = '',
    size = 20,
}: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            style={{ width: '100%' }}
        >
            <style jsx global>{`
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
            <Loader2 className={`animate-spin ${className}`} size={size} />
        </motion.div>
    );
}