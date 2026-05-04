// ============================================================
// landing.js — Landing page interactions
// ============================================================

function goToLogin() {
    window.location.href = "/pages/index.html";
}

function goToSignup() {
    window.location.href = "/pages/index.html?tab=signup";
}

document.addEventListener("DOMContentLoaded", () => {

    // ===== SCROLL REVEAL =====
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) e.target.classList.add('visible');
        });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => observer.observe(el));

    // ===== FAQ =====
    document.querySelectorAll('.faq-item').forEach(item => {
        item.querySelector('.faq-q').addEventListener('click', () => {
            const isOpen = item.classList.contains('open');
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
            if (!isOpen) item.classList.add('open');
        });
    });

    // ===== COUNTER ANIMATION =====
    function animateCount(el, target, suffix = '', duration = 1800) {
        let start = 0;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= target) { start = target; clearInterval(timer); }
            if (suffix === '+')       el.textContent = Math.floor(start).toLocaleString('en-IN') + 'K+';
            else if (suffix === 'M+') el.textContent = Math.floor(start) + 'M+';
            else if (suffix === '%')  el.textContent = start.toFixed(1) + '%';
            else if (suffix === '★')  el.textContent = start.toFixed(1) + '★';
        }, 16);
    }

    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                const nums = e.target.querySelectorAll('.stat-item h3');
                if (nums[0]) animateCount(nums[0], 10, '+');
                if (nums[1]) animateCount(nums[1], 1, 'M+');
                if (nums[2]) animateCount(nums[2], 99.9, '%');
                if (nums[3]) animateCount(nums[3], 4.8, '★');
                statsObserver.disconnect();
            }
        });
    }, { threshold: 0.4 });

    const statsSection = document.querySelector('.stats-section');
    if (statsSection) statsObserver.observe(statsSection);

    // ===== NAVBAR SCROLL =====
    const nav = document.querySelector('.nav');
    if (nav) {
        window.addEventListener('scroll', () => {
            nav.style.boxShadow = window.scrollY > 10 ? '0 2px 20px rgba(0,0,0,0.08)' : 'none';
        });
    }
});