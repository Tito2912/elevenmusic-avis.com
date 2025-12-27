// main.js — Elevenmusic-avis.com (2025-09)
// Changements clés :
// - SEO : stop auto-redirect agressif par langue (redirige EN seulement sur première visite home, pas bots, pas depuis moteurs).
// - RGPD : aligne la clé LS "cookie-consent" (accepted/refused) avec les pages HTML + événements personnalisés.
// - Perf : IntersectionObserver pour les effets au scroll + listeners passifs + petites micro-optimisations.
// - A11y : aria-expanded pour FAQ, toasts annoncés (aria-live), ESC ferme le menu mobile, respect prefers-reduced-motion.

(function () {
  'use strict';

  // ------ Helpers ------
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
  const isReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Petit helper UA pour éviter les redirections automatiques des bots/crawlers
  function isBotUA() {
    const ua = (navigator.userAgent || '').toLowerCase();
    return /(googlebot|bingbot|yandex|duckduckbot|baiduspider|slurp)/i.test(ua);
  }

  // ------ HERO Typewriter Animation ------
  (function typewriterInit(){
    const typeSpan = $('.typewriter');
    if (!typeSpan) return;

    const words = [
      "pour YouTube et TikTok",
      "multi-genres : pop, rap, électro…",
      "en français, anglais, espagnol…",
      "zéro copyright strike",
      "pour tous tes projets vidéo",
      "qualité studio instantanée"
    ];
    let typeIndex = 0, letterIndex = 0, direction = 1;
    let rafId;

    function loop(){
      const word = words[typeIndex];
      typeSpan.textContent = word.slice(0, letterIndex);
      letterIndex += direction;

      if (direction > 0 && letterIndex > word.length) {
        setTimeout(() => { direction = -1; tick(); }, 1200);
      } else if (direction < 0 && letterIndex === 0) {
        direction = 1; typeIndex = (typeIndex + 1) % words.length;
        setTimeout(tick, 220);
      } else {
        tick();
      }
    }
    function tick(){
      if (isReducedMotion) return; // Respect PRM
      clearTimeout(rafId);
      rafId = setTimeout(loop, 40 + Math.random() * 30);
    }
    tick();
  })();

  // ------ FADE-IN ANIMATIONS AU SCROLL (IntersectionObserver) ------
  (function fadeInIO(){
    const els = $$('.anim-in');
    if (!els.length) return;

    if ('IntersectionObserver' in window && !isReducedMotion) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) e.target.classList.add('visible');
          // On ne retire pas 'visible' pour limiter le jank
        });
      }, { rootMargin: '0px 0px -90px 0px', threshold: 0.01 });
      els.forEach(el => io.observe(el));
    } else {
      // Fallback léger (passive + throttle)
      let ticking = false;
      function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          els.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight - 90) el.classList.add('visible');
          });
          ticking = false;
        });
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('DOMContentLoaded', onScroll, { passive: true });
    }
  })();

  // ------ FAQ ACCORDÉON (a11y + exclusif) ------
  (function faqInit(){
    $$('.faq-item button').forEach(btn => {
      const item = btn.closest('.faq-item');
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', () => {
        const isActive = item.classList.toggle('active');
        btn.setAttribute('aria-expanded', String(isActive));
        $$('.faq-item').forEach(i => {
          if (i !== item) {
            i.classList.remove('active');
            const b = i.querySelector('button');
            if (b) b.setAttribute('aria-expanded', 'false');
          }
        });
      });
    });
  })();

  // ------ COOKIE BANNER (aligné RGPD / Consent Mode v2) ------
  (function cookieBannerInit(){
    const banner = $('#cookie-banner');
    const btnAccept = $('#cookie-accept');
    const btnRefuse = $('#cookie-refuse');
    if (!banner) return;

    const key = 'cookie-consent'; // 'accepted' | 'refused'
    const saved = localStorage.getItem(key);
    if (saved === 'accepted' || saved === 'refused') {
      banner.style.display = 'none';
    }

    function hideBannerAnimated() {
      banner.style.transform = 'translateY(120%)';
      setTimeout(() => banner.style.display = 'none', 600);
    }
    function dispatchConsent(status){
      // Event custom pour que d'autres scripts puissent réagir
      document.dispatchEvent(new CustomEvent('consent:change', { detail: { status } }));
    }

    if (btnAccept) btnAccept.addEventListener('click', () => {
      localStorage.setItem(key, 'accepted');
      dispatchConsent('accepted');
      hideBannerAnimated();
    });
    if (btnRefuse) btnRefuse.addEventListener('click', () => {
      localStorage.setItem(key, 'refused');
      dispatchConsent('refused');
      hideBannerAnimated();
    });
  })();

  // ------ SÉLECTEUR DE LANGUE + redirection mesurée (SEO-safe) ------
  (function languageInit(){
    const langSelects = $$('#lang-switcher, .lang-select');
    if (langSelects.length) {
      langSelects.forEach(sel => {
        sel.addEventListener('change', e => {
          const lang = e.target.value;
          try { localStorage.setItem('preferred-lang', lang); } catch(e){}
          if (lang === 'en') window.location.href = '/en/';
          else window.location.href = '/';
        });
      });
    }

    // Auto-switch très limité :
    // - uniquement sur la home (/ ou /index.html)
    // - première visite (pas de preferred-lang)
    // - navigateur en anglais
    // - pas un bot, pas depuis Google/Bing (referrer)
    const path = location.pathname.replace(/\/index\.html$/i, '/');
    const ref = (document.referrer || '').toLowerCase();
    const fromSearch = /\b(google|bing|yandex|duckduckgo)\./.test(ref);
    const preferred = localStorage.getItem('preferred-lang');

    if (!preferred && !isBotUA() && !fromSearch && path === '/' && navigator.language && navigator.language.toLowerCase().startsWith('en')) {
      window.location.replace('/en/');
    }
  })();

  // ------ INJECTION PROMPTS OFFICIELS ELEVENMUSIC ------
  (function promptsInit(){
    const officialPrompts = [
      { prompt: "A dreamy synth-pop song with female vocals in English about 'exploring the future', upbeat and positive" },
      { prompt: "Un morceau rap instrumental énergique avec des percussions puissantes et une ambiance urbaine nocturne" },
      { prompt: "Epic cinematic orchestral track, suitable for trailer, with emotional strings and bold brass, no vocals" },
      { prompt: "Chanson pop française, paroles sur l’été et la liberté, tempo rapide, voix féminine" },
      { prompt: "Latin reggaeton beat with catchy synths and rhythmic claps, vocal in Spanish, party mood" },
      { prompt: "Ambient chill-out instrumental with soft piano, deep bass and slow atmospheric pads" }
    ];
    const promptList = $('#prompt-list');
    if (!promptList) return;

    officialPrompts.forEach(obj => {
      const div = document.createElement('div');
      div.className = 'prompt-item';
      div.textContent = obj.prompt;
      div.tabIndex = 0;
      promptList.appendChild(div);
      function copy() {
        navigator.clipboard.writeText(obj.prompt).then(() => showToast('Prompt copié !'));
      }
      div.addEventListener('click', copy);
      div.addEventListener('keypress', (e)=>{ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); copy(); } });
    });

    const copyPromptsBtn = $('#copy-prompts');
    if (copyPromptsBtn) {
      copyPromptsBtn.addEventListener('click', () => {
        const allPrompts = officialPrompts.map(p => p.prompt).join('\n\n');
        navigator.clipboard.writeText(allPrompts).then(() => showToast('Tous les prompts copiés !'));
      });
    }
  })();

  // ------ TOAST VISUEL (a11y) ------
  function showToast(text) {
    let toast = document.createElement('div');
    toast.textContent = text;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.style.position = 'fixed';
    toast.style.bottom = '70px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = 'linear-gradient(90deg,#6E47F9 40%,#18A0FB 100%)';
    toast.style.color = '#fff';
    toast.style.padding = '1em 2em';
    toast.style.borderRadius = '15px';
    toast.style.boxShadow = '0 6px 32px #6E47F933';
    toast.style.zIndex = '9999';
    toast.style.fontWeight = '700';
    toast.style.fontSize = '1.12em';
    toast.style.opacity = '0.96';
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; }, 1700);
    setTimeout(() => { toast.remove(); }, 2100);
  }

  // ------ NEWSLETTER (validation email, feedback visuel) ------
  (function newsletterInit(){
    const form = $('#newsletter-form');
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const email = (form.email && form.email.value || '').trim();
      if (!/^[\w-.]+@[\w-]+\.\w{2,}$/i.test(email)) {
        showToast("Email invalide !");
        return;
      }
      try {
        // Remplacer par appel API en prod
        localStorage.setItem('newsletter-elevenmusic', email);
      } catch(e){}
      form.reset();
      showToast("Inscription validée !");
      if (typeof gtag === 'function') {
        try { gtag('event', 'newsletter_signup', { event_category: 'newsletter' }); } catch(e){}
      }
    });
  })();

  // ------ AUDIO : activation/désactivation ------
  (function audioInit(){
    $$('.hero-demo audio').forEach(audio => {
      audio.addEventListener('play', function () {
        $$('.hero-demo audio').forEach(a => { if (a !== audio) a.pause(); });
      }, { passive: true });
    });

    const heroVideo = $('#hero-bg-video');
    const toggleHeroAudioBtn = $('#toggleHeroAudioBtn');
    const audioBtnIcon = $('#audioBtnIcon');
    const audioTooltip = $('#audioTooltip');
    const HERO_VOLUME = 0.25; // 25% du volume pour adoucir fortement le son

    if (heroVideo && toggleHeroAudioBtn && audioBtnIcon && audioTooltip) {
      heroVideo.volume = HERO_VOLUME;
      toggleHeroAudioBtn.addEventListener('click', () => {
        heroVideo.muted = !heroVideo.muted;
        if (!heroVideo.muted) {
          heroVideo.volume = HERO_VOLUME;
          audioBtnIcon.textContent = '🔊';
          audioTooltip.textContent = "Couper le son";
          audioBtnIcon.style.transform = "scale(1.25) rotate(-14deg)";
          audioBtnIcon.style.filter = "drop-shadow(0 0 10px #FFF300cc)";
        } else {
          audioBtnIcon.textContent = '🔈';
          audioTooltip.textContent = "Activer le son";
          audioBtnIcon.style.transform = "scale(1.1) rotate(0deg)";
          audioBtnIcon.style.filter = "drop-shadow(0 0 6px #6e47f9bb)";
        }
        setTimeout(() => {
          audioBtnIcon.style.transform = "";
          audioBtnIcon.style.filter = "";
        }, 300);
      });
      toggleHeroAudioBtn.addEventListener('mouseenter', () => { audioTooltip.style.opacity = "1"; });
      toggleHeroAudioBtn.addEventListener('mouseleave', () => { audioTooltip.style.opacity = "0"; });
    }
  })();

  // ------ GA4 Events (CTA principaux) ------
  (function ctaEvents(){
    $$('.cta-main, .cta-secondary').forEach(cta => {
      cta.addEventListener('click', () => {
        if (typeof gtag === 'function') {
          try {
            gtag('event', 'cta_click', {
              'event_category': 'CTA',
              'event_label': (cta.textContent || '').trim()
            });
          } catch(e){}
        }
      });
    });
  })();

  // ------ SMOOTH SCROLL pour ancres internes ------
  (function smoothScroll(){
    $$('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const id = this.getAttribute('href').slice(1);
        const el = document.getElementById(id);
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: isReducedMotion ? 'auto' : 'smooth', block: 'start' });
        }
      });
    });
  })();

  // ------ Apparition animée des cards (au scroll) ------
  (function cardsInit(){
    $$('.feature-card').forEach(card => {
      card.classList.add('anim-in');
    });
  })();

  // ------ Optional : micro-parallax sur hero-bg (effet léger) ------
  (function parallaxInit(){
    const heroBg = $('.hero-bg-anim');
    if (!heroBg || isReducedMotion) return;
    window.addEventListener('mousemove', e => {
      const x = (e.clientX / window.innerWidth - 0.5) * 10;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;
      heroBg.style.transform = `translate(${x}px,${y}px)`;
    }, { passive: true });
  })();

  // ------ Navbar mobile hamburger + a11y ------
  (function mobileNavInit(){
    const hamburgerBtn = $('#hamburgerBtn');
    const mobileNav = $('#mobileNav');
    const mobileNavOverlay = $('#mobileNavOverlay');
    const closeMobileNav = $('#closeMobileNav');

    function openMobileNav() {
      if (!mobileNav || !mobileNavOverlay) return;
      mobileNav.classList.add('open');
      mobileNavOverlay.style.display = "block";
      setTimeout(()=>mobileNavOverlay.style.opacity="1",20);
      document.body.style.overflow = 'hidden';
      if (closeMobileNav) closeMobileNav.focus();
    }
    function closeMobileNavFn() {
      if (!mobileNav || !mobileNavOverlay) return;
      mobileNav.classList.remove('open');
      mobileNavOverlay.style.opacity = "0";
      setTimeout(()=>mobileNavOverlay.style.display="none",220);
      document.body.style.overflow = '';
      if (hamburgerBtn) hamburgerBtn.focus();
    }
    if (hamburgerBtn && mobileNav && mobileNavOverlay && closeMobileNav) {
      hamburgerBtn.addEventListener('click', openMobileNav);
      closeMobileNav.addEventListener('click', closeMobileNavFn);
      mobileNavOverlay.addEventListener('click', closeMobileNavFn);
      document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeMobileNavFn(); });
    }
  })();

})();
