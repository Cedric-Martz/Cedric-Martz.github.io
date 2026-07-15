const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initScrollReveal() {
    const revealItems = document.querySelectorAll(
        '.hero-copy, .hero-panel, .page-hero, .split-feature, .section-heading, .project-card, .resource-card, .note-card, .cta-band, .contact-copy, .contact-card'
    );

    revealItems.forEach((item, index) => {
        item.classList.add('reveal');
        item.style.setProperty('--reveal-delay', `${Math.min(index * 45, 220)}ms`);
    });

    if (reduceMotion || !('IntersectionObserver' in window)) {
        revealItems.forEach((item) => item.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.14,
        rootMargin: '0px 0px -8% 0px'
    });

    revealItems.forEach((item) => observer.observe(item));
}

function initScrollProgress() {
    const progress = document.createElement('div');
    progress.className = 'scroll-progress';
    document.body.appendChild(progress);

    function updateProgress() {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
        progress.style.transform = `scaleX(${Math.min(Math.max(ratio, 0), 1)})`;
        document.body.classList.toggle('has-scrolled', window.scrollY > 18);
    }

    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
}

function initCursorTrail() {
    if (reduceMotion || window.matchMedia('(pointer: coarse)').matches) {
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.className = 'cursor-canvas';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const points = [];
    const maxPoints = 28;

    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let hasPointer = false;

    function resizeCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(window.innerWidth * dpr);
        canvas.height = Math.floor(window.innerHeight * dpr);
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    window.addEventListener('pointermove', (event) => {
        pointerX = event.clientX;
        pointerY = event.clientY;
        hasPointer = true;
        document.body.classList.add('has-pointer');
        points.push({
            x: pointerX,
            y: pointerY,
            age: 0
        });

        if (points.length > maxPoints) {
            points.shift();
        }
    }, { passive: true });

    window.addEventListener('pointerleave', () => {
        hasPointer = false;
        document.body.classList.remove('has-pointer');
    });

    function animateTrail() {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        points.forEach((point) => {
            point.age += 1;
        });

        while (points.length && points[0].age > 34) {
            points.shift();
        }

        if (points.length > 2) {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            for (let i = 1; i < points.length - 1; i++) {
                const prev = points[i - 1];
                const current = points[i];
                const next = points[i + 1];
                const alpha = Math.max(0, 1 - current.age / 34) * 0.34;
                const width = Math.max(1, 18 * (1 - current.age / 42));

                ctx.beginPath();
                ctx.moveTo(prev.x, prev.y);
                ctx.quadraticCurveTo(current.x, current.y, (current.x + next.x) / 2, (current.y + next.y) / 2);
                ctx.strokeStyle = `rgba(217, 101, 35, ${alpha})`;
                ctx.lineWidth = width;
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(prev.x, prev.y);
                ctx.quadraticCurveTo(current.x, current.y, (current.x + next.x) / 2, (current.y + next.y) / 2);
                ctx.strokeStyle = `rgba(240, 162, 58, ${alpha * 0.55})`;
                ctx.lineWidth = width * 0.42;
                ctx.stroke();
            }
        }

        if (!hasPointer && points.length === 0) {
            document.body.classList.remove('has-pointer');
        }

        requestAnimationFrame(animateTrail);
    }

    animateTrail();
}

document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initScrollProgress();
    initCursorTrail();
});
