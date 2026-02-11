"use client";

import { useEffect, useRef } from "react";

export function GlobalClickSound() {
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        // Initialize Audio Context on first user interaction to bypass autoplay policy
        const initAudio = () => {
            if (!audioContextRef.current) {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioContext) {
                    audioContextRef.current = new AudioContext();
                }
            }
        };

        const playPopSound = () => {
            if (!audioContextRef.current) initAudio();
            const ctx = audioContextRef.current;
            if (!ctx) return;

            // Resume context if suspended (browser requirement)
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            // "Pop" sound synthesis
            // Short, rapid pitch drop sine wave
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);

            // Rapid volume envelope
            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.1);
        };

        const handleClick = (e: MouseEvent) => {
            // Check if target or parent is a button or has role="button"
            const target = e.target as HTMLElement;
            const button = target.closest('button') || target.closest('[role="button"]');

            if (button) {
                playPopSound();
            }
        };

        window.addEventListener('click', handleClick);
        window.addEventListener('mousedown', initAudio, { once: true }); // Pre-init

        return () => {
            window.removeEventListener('click', handleClick);
            window.removeEventListener('mousedown', initAudio);
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    return null; // Headless component
}
