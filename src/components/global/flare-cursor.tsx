"use client";

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const FlareCursor = () => {
    const cursorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const cursor = cursorRef.current;
        if (!cursor) return;

        // Force the native cursor to always be visible
        document.documentElement.style.cursor = 'auto';
        document.body.style.cursor = 'auto';

        const moveCursor = (e: MouseEvent) => {
            gsap.to(cursor, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.6,
                ease: "power3.out",
            });
        };

        const handleMouseDown = () => {
            gsap.to(cursor, {
                scale: 0.8,
                duration: 0.15,
                ease: "back.out(3)",
            });
        };

        const handleMouseUp = () => {
            gsap.to(cursor, {
                scale: 1,
                duration: 0.3,
                ease: "elastic.out(1, 0.3)",
            });
        };

        const handleMouseEnter = () => {
            gsap.to(cursor, {
                scale: 1.6,
                opacity: 0.7,
                duration: 0.3,
                ease: "power2.out",
            });
        };

        const handleMouseLeave = () => {
            gsap.to(cursor, {
                scale: 1,
                opacity: 1,
                duration: 0.3,
                ease: "elastic.out(1, 0.3)",
            });
        };

        const interactiveElements = document.querySelectorAll(
            'a, button, [role="button"], input, textarea, select'
        );

        interactiveElements.forEach((el) => {
            el.addEventListener('mouseenter', handleMouseEnter);
            el.addEventListener('mouseleave', handleMouseLeave);
        });

        window.addEventListener('mousemove', moveCursor);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.documentElement.style.cursor = '';
            document.body.style.cursor = '';
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            interactiveElements.forEach((el) => {
                el.removeEventListener('mouseenter', handleMouseEnter);
                el.removeEventListener('mouseleave', handleMouseLeave);
            });
        };
    }, []);

    return (
        <div
            ref={cursorRef}
            className="pointer-events-none fixed top-0 left-0 z-[9999] hidden lg:block"
            style={{
                width: '12px',
                height: '12px',
                transform: 'translate(-50%, -50%)',
            }}
        >
            <div
                className="w-full h-full rounded-full"
                style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    boxShadow: '0 0 6px 1px rgba(255,255,255,0.4)',
                }}
            />
        </div>
    );
};

export default FlareCursor;
