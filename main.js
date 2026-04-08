// main.js — Elevenmusic-avis.com (2025-09)
// Changements clés :
// - SEO : stop auto-redirect agressif par langue (redirige en/es/de uniquement sur première visite home, pas bots, pas depuis moteurs).
// - RGPD : aligne la clé LS "cookie-consent" (accepted/refused) avec les pages HTML + événements personnalisés.
// - Perf : IntersectionObserver pour les effets au scroll + listeners passifs + petites micro-optimisations.
// - A11y : aria-expanded pour FAQ, toasts annoncés (aria-live), ESC ferme le menu mobile, respect prefers-reduced-motion.

(function () {
  'use strict';

  // ------ Helpers ------
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
  const isReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ------ I18N (FR/EN/ES/DE) ------
  const SUPPORTED_LANGS = ['fr', 'en', 'es', 'de'];
  const SITE_LANG = (() => {
    const raw = String(document.documentElement.getAttribute('lang') || 'fr').toLowerCase();
    const base = raw.split('-')[0];
    return SUPPORTED_LANGS.includes(base) ? base : 'fr';
  })();

  const I18N = {
    fr: {
      typewriterWords: [
        "pour YouTube et TikTok",
        "multi-genres : pop, rap, électro…",
        "en français, anglais, espagnol…",
        "risque de copyright réduit",
        "pour tous tes projets vidéo",
        "qualité studio instantanée"
      ],
      toast: {
        invalidEmail: "Email invalide !",
        newsletterOk: "Inscription validée !",
        promptCopied: "Prompt copié !",
        allPromptsCopied: "Tous les prompts copiés !"
      },
      audio: { enable: "Activer le son", disable: "Couper le son" },
      copy: { button: "Copier", done: "Copié !" },
    },
    en: {
      typewriterWords: [
        "for YouTube and TikTok",
        "multi-genre: pop, rap, EDM...",
        "in English, French, Spanish...",
        "lower copyright-claim risk",
        "for all your video projects",
        "studio quality instantly"
      ],
      toast: {
        invalidEmail: "Invalid email!",
        newsletterOk: "Signed up!",
        promptCopied: "Prompt copied!",
        allPromptsCopied: "All prompts copied!"
      },
      audio: { enable: "Enable sound", disable: "Mute sound" },
      copy: { button: "Copy", done: "Copied!" },
    },
    es: {
      typewriterWords: [
        "para YouTube y TikTok",
        "multigénero: pop, rap, electrónica…",
        "en español, inglés, francés…",
        "riesgo de copyright reducido",
        "para todos tus proyectos de vídeo",
        "calidad de estudio al instante"
      ],
      toast: {
        invalidEmail: "Email inválido!",
        newsletterOk: "¡Inscripción confirmada!",
        promptCopied: "¡Prompt copiado!",
        allPromptsCopied: "¡Todos los prompts copiados!"
      },
      audio: { enable: "Activar sonido", disable: "Silenciar" },
      copy: { button: "Copiar", done: "Copiado!" },
    },
    de: {
      typewriterWords: [
        "für YouTube und TikTok",
        "Multi-Genres: Pop, Rap, Elektro…",
        "auf Deutsch, Englisch, Spanisch…",
        "reduziertes Copyright-Risiko",
        "für all deine Videoprojekte",
        "Studioqualität sofort"
      ],
      toast: {
        invalidEmail: "Ungültige E-Mail!",
        newsletterOk: "Anmeldung bestätigt!",
        promptCopied: "Prompt kopiert!",
        allPromptsCopied: "Alle Prompts kopiert!"
      },
      audio: { enable: "Ton aktivieren", disable: "Stumm schalten" },
      copy: { button: "Kopieren", done: "Kopiert!" },
    },
  };

  const L = I18N[SITE_LANG] || I18N.fr;

  // Petit helper UA pour éviter les redirections automatiques des bots/crawlers
  function isBotUA() {
    const ua = (navigator.userAgent || '').toLowerCase();
    return /(googlebot|bingbot|yandex|duckduckbot|baiduspider|slurp)/i.test(ua);
  }

  // ------ Analytics (GA4) : chargement uniquement après consentement ------
  const GA4_MEASUREMENT_ID = 'G-FWXK1PDKDJ';
  function loadGA4AfterConsent() {
    if (!GA4_MEASUREMENT_ID) return;
    if (document.getElementById('ga4-lib')) return;

    const s = document.createElement('script');
    s.async = true;
    s.id = 'ga4-lib';
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_MEASUREMENT_ID)}`;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    function gtag(){ window.dataLayer.push(arguments); }
    window.gtag = window.gtag || gtag;

    window.gtag('js', new Date());
    // Consent: analytics autorise (pub reste refusee par defaut dans le <head>)
    window.gtag('consent', 'update', {
      'analytics_storage': 'granted',
      'functionality_storage': 'granted',
      'security_storage': 'granted'
    });
    window.gtag('config', GA4_MEASUREMENT_ID, { 'anonymize_ip': true, 'allow_google_signals': false });
  }

  // ------ HERO Typewriter Animation ------
  (function typewriterInit(){
    const typeSpan = $('.typewriter');
    if (!typeSpan) return;

    const words = Array.isArray(L.typewriterWords) && L.typewriterWords.length ? L.typewriterWords : I18N.fr.typewriterWords;
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
    if (saved === 'accepted') {
      loadGA4AfterConsent();
      banner.style.display = 'none';
    } else if (saved === 'refused') {
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
      loadGA4AfterConsent();
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

    const PAGE_PATHS = {
      home:    { fr: '/', en: '/en/', es: '/es/', de: '/de/' },
      blog:    { fr: '/blog', en: '/en/blog', es: '/es/blog', de: '/de/blog' },
      blog1:   { fr: '/blog-1', en: '/en/blog-1', es: '/es/blog-1', de: '/de/blog-1' },
      blog2:   { fr: '/blog-2', en: '/en/blog-2', es: '/es/blog-2', de: '/de/blog-2' },
      legal:   { fr: '/mentions-legales', en: '/en/legal-notice', es: '/es/legal-notice', de: '/de/legal-notice' },
      privacy: { fr: '/politique-de-confidentialite', en: '/en/privacy-policy', es: '/es/privacy-policy', de: '/de/privacy-policy' },
    };

    function normPath(p){
      return String(p || '/')
        .replace(/\?.*$/, '')
        .replace(/#.*$/, '')
        .replace(/\/index\.html$/i, '/')
        .replace(/\.html$/i, '');
    }

    function detectPageKey(pathname){
      const p = normPath(pathname);
      if (p === '/' || p === '/en/' || p === '/es/' || p === '/de/') return 'home';
      if (p === '/blog' || p === '/en/blog' || p === '/es/blog' || p === '/de/blog') return 'blog';
      if (p === '/blog-1' || p === '/en/blog-1' || p === '/es/blog-1' || p === '/de/blog-1') return 'blog1';
      if (p === '/blog-2' || p === '/en/blog-2' || p === '/es/blog-2' || p === '/de/blog-2') return 'blog2';
      if (p === '/mentions-legales' || p === '/en/legal-notice' || p === '/es/legal-notice' || p === '/de/legal-notice') return 'legal';
      if (p === '/politique-de-confidentialite' || p === '/en/privacy-policy' || p === '/es/privacy-policy' || p === '/de/privacy-policy') return 'privacy';
      return 'home';
    }

    function pathFor(pageKey, lang){
      const key = PAGE_PATHS[pageKey] ? pageKey : 'home';
      const l = SUPPORTED_LANGS.includes(lang) ? lang : 'fr';
      return PAGE_PATHS[key][l] || PAGE_PATHS[key].fr;
    }

    function ensureLangOptions(sel){
      const wanted = [
        ['fr', 'FR'],
        ['en', 'EN'],
        ['es', 'ES'],
        ['de', 'DE'],
      ];
      const existing = Array.from(sel.options || []).map(o => String(o.value || '').toLowerCase());
      const hasAll = wanted.every(([v]) => existing.includes(v));
      if (!hasAll || existing.length !== wanted.length) {
        sel.innerHTML = '';
        wanted.forEach(([v, label]) => {
          const opt = document.createElement('option');
          opt.value = v;
          opt.textContent = label;
          sel.appendChild(opt);
        });
      }
      try { sel.value = SITE_LANG; } catch(e) {}
    }

    const currentKey = detectPageKey(location.pathname);
    const currentHash = location.hash || '';

    if (langSelects.length) {
      langSelects.forEach(sel => {
        ensureLangOptions(sel);
        sel.addEventListener('change', e => {
          const lang = String(e.target.value || '').toLowerCase();
          if (!SUPPORTED_LANGS.includes(lang)) return;
          try { localStorage.setItem('preferred-lang', lang); } catch(e){}
          window.location.href = pathFor(currentKey, lang) + currentHash;
        });
      });
    }

    // Auto-switch très limité :
    // - uniquement sur la home (/ ou /index.html)
    // - première visite (pas de preferred-lang)
    // - navigateur en en/es/de
    // - pas un bot, pas depuis Google/Bing (referrer)
    const path = normPath(location.pathname);
    const ref = (document.referrer || '').toLowerCase();
    const fromSearch = /\b(google|bing|yandex|duckduckgo)\./.test(ref);
    const preferred = String(localStorage.getItem('preferred-lang') || '').toLowerCase();
    const navLang = String(navigator.language || '').toLowerCase();

    let guessed = null;
    if (navLang.startsWith('en')) guessed = 'en';
    else if (navLang.startsWith('es')) guessed = 'es';
    else if (navLang.startsWith('de')) guessed = 'de';

    if (!preferred && guessed && !isBotUA() && !fromSearch && path === '/') {
      window.location.replace(pathFor('home', guessed) + currentHash);
    }
  })();

  // ------ INJECTION PROMPTS OFFICIELS ELEVENMUSIC ------
  (function promptsInit(){
    const promptsByLang = {
      fr: [
        "Une musique pop electro entrainante, tempo 120 BPM, sans paroles, synths lumineux et basse punchy",
        "Un beat rap/trap instrumental energique, 140 BPM, 808 lourdes, hats en triolet, ambiance urbaine nocturne",
        "Musique cinematographique epique, orchestre + choeur, montee progressive, sans voix",
        "Ambiance lo-fi chill avec piano doux, pads, basse ronde, tempo lent",
        "Reggaeton latin avec claps rythmiques et synths accrocheurs, mood fete",
        "Jingle court (10s) futuriste pour intro video, impacts et whooshes, tres dynamique",
      ],
      en: [
        "Upbeat electro-pop instrumental with bright synths, catchy hook, tempo 120 BPM, no lyrics",
        "Modern trap beat: heavy 808, triplet hi-hats, punchy claps, tempo 140 BPM",
        "Epic cinematic orchestral track for a trailer: emotional strings, bold brass, no vocals",
        "Chill lo-fi instrumental with soft piano, warm pads, deep bass, slow tempo",
        "Latin reggaeton groove with rhythmic claps and catchy synths, party mood",
        "Short (10s) futuristic intro for a video: impacts, risers, punchy rhythm",
      ],
      es: [
        "Instrumental electro-pop energico con sintes brillantes y gancho pegadizo, 120 BPM, sin letra",
        "Beat trap moderno: 808 potente, hi-hats en tripletes, claps marcados, 140 BPM",
        "Pista cinematografica epica para trailer: cuerdas emotivas, metales, sin voces",
        "Instrumental lo-fi chill con piano suave, pads calidos, bajo profundo, tempo lento",
        "Ritmo reggaeton latino con palmas ritmicas y sintes pegadizos, ambiente fiesta",
        "Intro corta (10s) futurista para video: impactos, subidas, ritmo contundente",
      ],
      de: [
        "Upbeat Electro-Pop Instrumental mit hellen Synths und eingangigem Hook, 120 BPM, ohne Lyrics",
        "Moderner Trap-Beat: fette 808, Triplet-Hi-Hats, punchige Claps, 140 BPM",
        "Epischer Cinematic-Orchestertrack für Trailer: emotionale Streicher, Brass, ohne Vocals",
        "Chill Lo-Fi Instrumental mit softem Piano, warmen Pads, tiefem Bass, langsames Tempo",
        "Latin Reggaeton Groove mit rhythmischen Claps und catchy Synths, Party-Vibe",
        "Kurzes (10s) futuristisches Intro für Video: Impacts, Risers, treibender Rhythmus",
      ],
    };

    const officialPrompts = (promptsByLang[SITE_LANG] || promptsByLang.fr).map(p => ({ prompt: p }));
    const promptList = $('#prompt-list');
    if (!promptList) return;

    officialPrompts.forEach(obj => {
      const div = document.createElement('div');
      div.className = 'prompt-item';
      div.textContent = obj.prompt;
      div.tabIndex = 0;
      promptList.appendChild(div);
      function copy() {
        navigator.clipboard.writeText(obj.prompt).then(() => showToast(L.toast.promptCopied));
      }
      div.addEventListener('click', copy);
      div.addEventListener('keypress', (e)=>{ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); copy(); } });
    });

    const copyPromptsBtn = $('#copy-prompts');
    if (copyPromptsBtn) {
      copyPromptsBtn.addEventListener('click', () => {
        const allPrompts = officialPrompts.map(p => p.prompt).join('\n\n');
        navigator.clipboard.writeText(allPrompts).then(() => showToast(L.toast.allPromptsCopied));
      });
    }
  })();

  // ------ COPY CODE BLOCKS (articles) ------
  (function copyCodeInit(){
    const buttons = $$('.copy-code');
    if (!buttons.length) return;

    buttons.forEach(btn => {
      // Save original label so we can revert it after a successful copy.
      if (!btn.dataset.copyLabel) btn.dataset.copyLabel = (btn.textContent || '').trim();

      btn.addEventListener('click', () => {
        const codeEl = btn.previousElementSibling;
        const text = (codeEl && codeEl.textContent ? codeEl.textContent : '').trim();
        if (!text) return;

        function onCopied(){
          try { showToast(L.toast.promptCopied); } catch(e) {}
          btn.textContent = (L.copy && L.copy.done) || btn.dataset.copyLabel || (btn.textContent || '');
          setTimeout(() => {
            btn.textContent = btn.dataset.copyLabel || (L.copy && L.copy.button) || btn.textContent;
          }, 2000);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(onCopied).catch(() => {});
        } else {
          // Fallback minimaliste
          try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.top = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
            onCopied();
          } catch(e) {}
        }
      });
    });
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
        showToast(L.toast.invalidEmail);
        return;
      }
      try {
        // Remplacer par appel API en prod
        localStorage.setItem('newsletter-elevenmusic', email);
      } catch(e){}
      form.reset();
      showToast(L.toast.newsletterOk);
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
      audioTooltip.textContent = heroVideo.muted ? L.audio.enable : L.audio.disable;
      toggleHeroAudioBtn.addEventListener('click', () => {
        heroVideo.muted = !heroVideo.muted;
        if (!heroVideo.muted) {
          heroVideo.volume = HERO_VOLUME;
          audioBtnIcon.textContent = '🔊';
          audioTooltip.textContent = L.audio.disable;
          audioBtnIcon.style.transform = "scale(1.25) rotate(-14deg)";
          audioBtnIcon.style.filter = "drop-shadow(0 0 10px #FFF300cc)";
        } else {
          audioBtnIcon.textContent = '🔈';
          audioTooltip.textContent = L.audio.enable;
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
