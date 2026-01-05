import React, { useEffect, useRef } from 'react';

const InteractivePolkaDots: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let width = window.innerWidth;
        let height = window.innerHeight;

        // Mouse state
        const mouse = { x: -1000, y: -1000 };

        // Dots configuration
        const DOT_COLOR = '#000000';
        const DOT_RADIUS = 1.5;
        const SPACING = 60; // Average space between dots
        const CONNECTION_DISTANCE = 100;
        const REPULSION_RADIUS = 150;
        const REPULSION_STRENGTH = 2; // Multiplier for repulsion force

        interface Dot {
            x: number;
            y: number;
            vx: number;
            vy: number;
            baseX: number;
            baseY: number;
        }

        let dots: Dot[] = [];

        const initDots = () => {
            dots = [];
            // Create a grid-like distribution but with some randomness for organic feel
            // or just random distribution? The reference "polka dots" implies somewhat regular or just scattered.
            // Let's go with scattered but dense enough.

            const numDots = Math.floor((width * height) / (SPACING * SPACING));

            for (let i = 0; i < numDots; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                dots.push({
                    x,
                    y,
                    vx: (Math.random() - 0.5) * 0.5, // Slow drift velocity
                    vy: (Math.random() - 0.5) * 0.5,
                    baseX: x,
                    baseY: y
                });
            }
        };

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            initDots();
        };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        };

        const handleMouseLeave = () => {
            mouse.x = -1000;
            mouse.y = -1000;
        };

        const update = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);

            // Background is white by CSS/parent, but let's ensure clear
            ctx.fillStyle = DOT_COLOR;

            dots.forEach(dot => {
                // Calculate distance to mouse
                const dx = mouse.x - dot.x;
                const dy = mouse.y - dot.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Repulsion force
                let forceX = 0;
                let forceY = 0;

                if (distance < REPULSION_RADIUS) {
                    const force = (REPULSION_RADIUS - distance) / REPULSION_RADIUS;
                    const angle = Math.atan2(dy, dx);
                    // Move away from mouse
                    forceX = -Math.cos(angle) * force * REPULSION_STRENGTH;
                    forceY = -Math.sin(angle) * force * REPULSION_STRENGTH;
                }

                // Apply velocities (base drift + repulsion)
                // We actually want a "return to base" or purely flowing system?
                // Let's make them flow freely but repelled by mouse

                dot.vx += forceX * 0.05; // Add force to velocity
                dot.vy += forceY * 0.05;

                // Apply friction to dampen changes
                dot.vx *= 0.98; // Friction on added velocity? 
                // Logic for drift:
                // If we want constant drift, we should have a target velocity. 
                // But simpler: just add force to position directly for immediate reaction
                // or add to velocity for inertia. Inertia feels better.

                // Let's try a hybrid:
                // Base movement is slow drift.
                // Mouse adds a vector to the dot.

                // Simplified Logic:
                // 1. Update position by velocity
                dot.x += dot.vx;
                dot.y += dot.vy;

                // 2. Wrap around screen
                if (dot.x < 0) dot.x = width;
                if (dot.x > width) dot.x = 0;
                if (dot.y < 0) dot.y = height;
                if (dot.y > height) dot.y = 0;

                // 3. Mouse Interaction (Repulsion)
                if (distance < REPULSION_RADIUS) {
                    const angle = Math.atan2(dy, dx);
                    const force = (REPULSION_RADIUS - distance) / REPULSION_RADIUS;
                    const pushX = -Math.cos(angle) * force * 2; // Push away strength
                    const pushY = -Math.sin(angle) * force * 2;

                    dot.vx += pushX;
                    dot.vy += pushY;
                }

                // 4. Limit velocity / Apply friction to return to calm state
                const maxSpeed = 2; // Max speed under repulsion
                const baseSpeed = 0.5; // Normal drift speed

                const currentSpeed = Math.sqrt(dot.vx * dot.vx + dot.vy * dot.vy);
                if (currentSpeed > maxSpeed) {
                    dot.vx = (dot.vx / currentSpeed) * maxSpeed;
                    dot.vy = (dot.vy / currentSpeed) * maxSpeed;
                } else if (currentSpeed > baseSpeed && distance >= REPULSION_RADIUS) {
                    // Slow down if moving fast and not near mouse
                    dot.vx *= 0.95;
                    dot.vy *= 0.95;
                } else if (currentSpeed < 0.1) {
                    // Ensure minimum drift
                    dot.vx += (Math.random() - 0.5) * 0.05;
                    dot.vy += (Math.random() - 0.5) * 0.05;
                }


                // Draw dot
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, DOT_RADIUS, 0, Math.PI * 2);
                ctx.fill();
                ctx.closePath();
            });

            animationFrameId = requestAnimationFrame(update);
        };

        // Initialize
        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);

        handleResize(); // Sets size and inits dots
        update();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none bg-white"
            style={{ zIndex: 0 }}
        />
    );
};

export default InteractivePolkaDots;
