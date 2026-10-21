const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* 1. Scroll: progress bar, header mengecil, tombol kembali ke atas */
const progress = document.querySelector('.scroll-progress');
const header = document.querySelector('header');

const backToTop = document.createElement('button');
backToTop.className = 'back-to-top';
backToTop.type = 'button';
backToTop.setAttribute('aria-label', 'Kembali ke atas');
backToTop.textContent = '↑';
document.body.appendChild(backToTop);
backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
});

let ticking = false;
function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    progress.style.transform = `scaleX(${ratio})`;
    header.classList.toggle('scrolled', window.scrollY > 40);
    backToTop.classList.toggle('show', window.scrollY > 400);
    ticking = false;
}
window.addEventListener('scroll', () => {
    if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
    }
}, { passive: true });
onScroll();

/* 2. Efek mengetik pada subjudul hero */
const subtitle = document.querySelector('.hero h3');
if (subtitle && !reduceMotion) {
    const fullText = subtitle.textContent.trim();
    subtitle.setAttribute('aria-label', fullText);
    subtitle.textContent = '';
    subtitle.classList.add('typing-caret');
    let i = 0;
    setTimeout(function type() {
        subtitle.textContent = fullText.slice(0, ++i);
        if (i < fullText.length) setTimeout(type, 60);
    }, 1300);
}

/* 3. Muncul bertahap saat di-scroll (versi class, hover kartu tetap aman) */
const animatedElements = document.querySelectorAll(
    '.section > p, .section > h2, .section > .info-card, .skills-grid .info-card'
);

animatedElements.forEach((element) => {
    element.classList.add('reveal');
    const siblings = Array.from(element.parentElement.children);
    element.style.setProperty('--delay', (siblings.indexOf(element) % 4) * 0.12 + 's');
});

const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            obs.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });
animatedElements.forEach((element) => revealObserver.observe(element));

/* 4. Menu aktif sesuai section yang sedang dilihat */
const navLinks = document.querySelectorAll('nav a');
const sections = document.querySelectorAll('main section');
const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            navLinks.forEach((link) => {
                link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
            });
        }
    });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach((sec) => navObserver.observe(sec));

/* 5. Efek riak (ripple) saat tombol diklik */
document.querySelectorAll('.button').forEach((button) => {
    button.addEventListener('click', (e) => {
        if (reduceMotion) return;
        const rect = button.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.left = (e.clientX - rect.left - 50) + 'px';
        ripple.style.top = (e.clientY - rect.top - 50) + 'px';
        button.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
    });
});

/* 6. Kartu miring 3D mengikuti kursor (hanya di perangkat dengan mouse) */
if (canHover && !reduceMotion) {
    document.querySelectorAll('.info-card').forEach((card) => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.transform =
                `perspective(700px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg) translateY(-4px)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

/* 7. Cahaya emas yang mengikuti kursor */
if (canHover && !reduceMotion) {
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    glow.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glow);

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;

    window.addEventListener('mousemove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
        glow.classList.add('on');
    });
    document.addEventListener('mouseleave', () => glow.classList.remove('on'));

    (function follow() {
        currentX += (targetX - currentX) * 0.12;
        currentY += (targetY - currentY) * 0.12;
        glow.style.transform = `translate(${currentX - 200}px, ${currentY - 200}px)`;
        requestAnimationFrame(follow);
    })();
}

/* 8. Partikel emas melayang di hero */
const hero = document.querySelector('.hero');
if (hero && !reduceMotion) {
    const canvas = document.createElement('canvas');
    canvas.className = 'particles';
    canvas.setAttribute('aria-hidden', 'true');
    hero.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let w = 0;
    let h = 0;
    let particles = [];
    let running = true;
    let looping = false;

    function resize() {
        const dpr = window.devicePixelRatio || 1;
        w = hero.clientWidth;
        h = hero.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const count = Math.min(60, Math.floor(w / 22));
        particles = Array.from({ length: count }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 1.8 + 0.6,
            vx: (Math.random() - 0.5) * 0.15,
            vy: -(Math.random() * 0.25 + 0.08),
            phase: Math.random() * Math.PI * 2
        }));
    }

    function draw(t) {
        if (!running) {
            looping = false;
            return;
        }
        ctx.clearRect(0, 0, w, h);
        particles.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
            if (p.x < -5) p.x = w + 5;
            if (p.x > w + 5) p.x = -5;
            const alpha = 0.35 + 0.3 * Math.sin(t / 900 + p.phase);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(198, 166, 107, ${alpha})`;
            ctx.fill();
        });
        requestAnimationFrame(draw);
    }

    function start() {
        if (!looping) {
            looping = true;
            requestAnimationFrame(draw);
        }
    }

    resize();
    window.addEventListener('resize', resize);

    // Hemat baterai: berhenti menggambar saat hero tidak terlihat
    new IntersectionObserver(([entry]) => {
        running = entry.isIntersecting;
        if (running) start();
    }).observe(hero);

    start();
}
/* 9. Langit malam berbintang */
(function starfield() {
    const canvas = document.createElement('canvas');
    canvas.className = 'starfield';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);
    const ctx = canvas.getContext('2d');

    const layers = [
        { speed: 0.02, size: [0.3, 0.9], alpha: 0.55, share: 0.6 },
        { speed: 0.05, size: [0.6, 1.3], alpha: 0.8, share: 0.3 },
        { speed: 0.10, size: [1.0, 2.0], alpha: 1.0, share: 0.1 }
    ];
    const colors = ['255,255,255', '200,220,255', '255,240,210'];

    let w = 0, h = 0, stars = [];
    let shooting = null;
    let nextShoot = performance.now() + 3000;

    function build() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const total = Math.floor((w * h) / 2200);
        stars = [];
        layers.forEach((L, li) => {
            const n = Math.floor(total * L.share);
            for (let i = 0; i < n; i++) {
                let x = Math.random() * w;
                let y = Math.random() * h;
                // 35% bintang dikumpulkan di pita Bimasakti diagonal
                if (Math.random() < 0.35) {
                    y = x * -0.45 + h * 0.85 +
                        (Math.random() + Math.random() + Math.random() - 1.5) * h * 0.14;
                    y = ((y % h) + h) % h;
                }
                stars.push({
                    x, y, li,
                    r: L.size[0] + Math.random() * (L.size[1] - L.size[0]),
                    tw: 0.0008 + Math.random() * 0.002,
                    ph: Math.random() * Math.PI * 2,
                    c: colors[Math.floor(Math.random() * colors.length)]
                });
            }
        });
    }

    function spawnShooting() {
        shooting = {
            x: Math.random() * w * 0.7 + w * 0.1,
            y: Math.random() * h * 0.35,
            vx: 7 + Math.random() * 3,
            vy: 3 + Math.random() * 2,
            life: 0
        };
    }

    function draw(t) {
        ctx.clearRect(0, 0, w, h);
        const scroll = window.scrollY;

        stars.forEach((s) => {
            const L = layers[s.li];
            const y = (((s.y - scroll * L.speed) % h) + h) % h;
            const a = reduceMotion
                ? L.alpha * 0.8
                : L.alpha * (0.55 + 0.45 * Math.sin(t * s.tw + s.ph));
            ctx.beginPath();
            ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${s.c}, ${a})`;
            ctx.fill();
        });

        if (!reduceMotion) {
            if (!shooting && t > nextShoot) spawnShooting();
            if (shooting) {
                const s = shooting;
                s.x += s.vx;
                s.y += s.vy;
                s.life++;
                const tail = 90;
                const len = Math.hypot(s.vx, s.vy);
                const tx = s.x - (s.vx / len) * tail;
                const ty = s.y - (s.vy / len) * tail;
                const g = ctx.createLinearGradient(s.x, s.y, tx, ty);
                g.addColorStop(0, 'rgba(255,255,255,0.9)');
                g.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.strokeStyle = g;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(tx, ty);
                ctx.stroke();
                if (s.life > 70 || s.x > w + 100 || s.y > h + 100) {
                    shooting = null;
                    nextShoot = t + 4000 + Math.random() * 6000;
                }
            }
            requestAnimationFrame(draw);
        }
    }

    build();
    if (reduceMotion) {
        draw(0);
        window.addEventListener('scroll', () => draw(0), { passive: true });
        window.addEventListener('resize', () => { build(); draw(0); });
    } else {
        requestAnimationFrame(draw);
        window.addEventListener('resize', build);
    }
})();