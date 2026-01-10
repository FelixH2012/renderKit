/**
 * RenderKit - Frontend Enhancements
 *
 * renderKit-Relay provides fully server-rendered HTML (SEO/no-JS friendly).
 * This file only adds progressive enhancements (optional).
 */

function onReady(callback: () => void) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
        callback();
    }
}

function enhanceStickyNavigation() {
    const navs = Array.from(document.querySelectorAll<HTMLElement>('.renderkit-nav.is-sticky'));
    if (navs.length === 0) return;

    const update = () => {
        const scrolled = window.scrollY > 20;
        navs.forEach((nav) => nav.classList.toggle('is-scrolled', scrolled));
    };

    window.addEventListener('scroll', update, { passive: true });
    update();
}

function enhanceNavMobileDetails() {
    const detailsList = Array.from(document.querySelectorAll<HTMLDetailsElement>('.renderkit-nav__mobile-details'));
    if (detailsList.length === 0) return;

    detailsList.forEach((details) => {
        details.addEventListener('click', (event) => {
            const target = event.target as HTMLElement | null;
            if (!target) return;

            const link = target.closest<HTMLAnchorElement>('.renderkit-nav__mobile-link');
            if (!link) return;

            details.open = false;
        });
    });

    window.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        detailsList.forEach((details) => (details.open = false));
    });
}

function enhanceHeroScrollAnimations() {
    const heroes = Array.from(document.querySelectorAll<HTMLElement>('.renderkit-hero[data-rk-hero-animations="1"]'));
    if (heroes.length === 0) return;

    let scheduled = false;
    const update = () => {
        scheduled = false;

        const scrollY = window.scrollY || 0;
        const y = Math.min(scrollY, 500) / 500 * 150;
        const opacity = 1 - Math.min(scrollY, 300) / 300;

        heroes.forEach((hero) => {
            const bg = hero.querySelector<HTMLElement>('[data-rk-hero-bg]');
            const content = hero.querySelector<HTMLElement>('[data-rk-hero-content]');

            if (bg) bg.style.transform = `translate3d(0, ${y}px, 0)`;
            if (content) content.style.opacity = String(opacity);
        });
    };

    const schedule = () => {
        if (scheduled) return;
        scheduled = true;
        window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', schedule, { passive: true });
    schedule();
}

onReady(() => {
    enhanceStickyNavigation();
    enhanceNavMobileDetails();
    enhanceHeroScrollAnimations();
});

