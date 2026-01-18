'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

type Particle = {
    top: string;
    left: string;
    size: number;
    color: string;
    duration: number;
    delay: number;
};

export default function InteractiveBackground() {
    // Determine particles strictly on client side to avoid hydration mismatch
    const [particles, setParticles] = useState<Particle[]>([]);
    const [visible, setVisible] = useState(false);

    useEffect(() => {

        setTimeout(() => {
            const newParticles = [...Array(100)].map((_, i) => ({
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                size: Math.random() > 0.5 ? 8 : 12,
                color: i % 2 === 0 ? '#0d9488' : '#3b82f6',
                duration: 10 + Math.random() * 20,
                delay: Math.random() * 2
            }));
            setParticles(newParticles);
            setVisible(true);
        }, 100);
    }, []);

    return (
        <div
            style={{
                zIndex: -5,
                // overflow: 'hidden',
            }}
        >

            {/* Floating Particles / Dots */}
            <div style={{ position: 'absolute', inset: 0, opacity: visible ? 0.4 : 0, visibility: visible ? 'visible' : 'hidden' }}>
                {particles.map((p, i) => (
                    <motion.div
                        key={i}
                        style={{
                            position: 'absolute',
                            top: p.top,
                            left: p.left,
                            width: p.size,
                            height: p.size,
                            borderRadius: '50%',
                            background: p.color,
                            filter: 'blur(1px)',
                        }}
                        animate={{
                            y: [0, -100, 0],
                            opacity: [0, 0.8, 0],
                        }}
                        transition={{
                            duration: p.duration,
                            repeat: Infinity,
                            ease: "linear",
                            delay: p.delay
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
