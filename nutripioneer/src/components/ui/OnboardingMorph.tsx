'use client';

import { motion } from 'framer-motion';

type ShapeVariant = 'line' | 'heart' | 'circle' | 'pill' | 'pizza' | 'sparkle';

interface OnboardingMorphProps {
    currentStep: number;
    className?: string;
}

const VARIANTS: Record<string, string> = {
    // Standardized 4-Segment Cubic Beziers for Smooth Morphing

    // Step 1: Line (Collapsed Loop)
    // M 10 50 -> Right End -> Back to Left -> Close
    line: "M 10 50 C 36 50 63 50 90 50 C 90 50 90 50 90 50 C 63 50 36 50 10 50 C 10 50 10 50 10 50 Z",

    // Step 2: Heart
    heart: "M 50 30 C 60 10 90 20 90 40 C 90 60 50 80 50 80 C 50 80 10 60 10 40 C 10 20 40 10 50 30 Z",

    // Step 3: Circle
    circle: "M 50 10 C 72 10 90 28 90 50 C 90 72 72 90 50 90 C 28 90 10 72 10 50 C 10 28 28 10 50 10 Z",

    // Step 4: Pill (Organic Capsule)
    pill: "M 30 30 C 43 30 56 30 70 30 C 92 30 92 70 70 70 C 56 70 43 70 30 70 C 8 70 8 30 30 30 Z",

    // Step 5: Pizza (Sector) - slightly scaled down to prevent clipping at stroke 4
    pizza: "M 50 50 C 62 42 74 34 86 26 C 91 34 94 42 94 50 C 94 58 91 66 86 74 C 74 66 62 58 50 50 Z",

    // Step 6: Sparkle (4-Point Star)
    sparkle: "M 50 10 C 55 35 65 45 90 50 C 65 55 55 65 50 90 C 45 65 35 55 10 50 C 35 45 45 35 50 10 Z"
};

const COLORS = [
    '#94a3b8', // 1: Line (Gray/Slate)
    '#ec4899', // 2: Heart (Pink)
    '#3b82f6', // 3: Circle (Blue)
    '#10b981', // 4: Pill (Green/Teal)
    '#f59e0b', // 5: Pizza (Orange/Yellow)
    '#8b5cf6', // 6: Sparkle (Purple)
];

export default function OnboardingMorph({ currentStep, className }: OnboardingMorphProps) {
    // Map step to shape key
    const getShape = (s: number): string => {
        switch (s) {
            case 1: return VARIANTS.line;
            case 2: return VARIANTS.heart;
            case 3: return VARIANTS.circle;
            case 4: return VARIANTS.pill;
            case 5: return VARIANTS.pizza;
            case 6: return VARIANTS.sparkle;
            default: return VARIANTS.line;
        }
    };

    const getColor = (s: number) => {
        return COLORS[s - 1] || COLORS[0];
    };

    return (
        <div className={className} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                    width: '100%',
                    height: '100%',
                    maxWidth: '200px', // Limit max size so it doesn't overwhelm
                    maxHeight: '200px',
                    filter: 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.8))' // Smooth centered glow
                }}
            >
                <motion.path
                    d={getShape(currentStep)}
                    stroke={getColor(currentStep)}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                        d: getShape(currentStep),
                        stroke: getColor(currentStep),
                        pathLength: 1,
                        opacity: 1
                    }}
                    transition={{
                        duration: 0.6,
                        ease: "easeInOut",
                        type: "spring",
                        stiffness: 70,
                        damping: 15
                    }}
                />
            </svg>
        </div>
    );
}
