(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const coarsePointer = matchMedia('(pointer: coarse)').matches;
  const compactViewport = matchMedia('(max-width: 860px)').matches;

  // Intro loader.
  const loader = document.querySelector('.page-loader');
  if (loader) {
    if (reduceMotion) loader.remove();
    else {
      const loaderDelay = compactViewport ? 760 : 1050;
      setTimeout(() => loader.classList.add('done'), loaderDelay);
      setTimeout(() => loader.remove(), loaderDelay + 1050);
    }
  }

  // Split selected copy into animated word wrappers.
  document.querySelectorAll('.split-words').forEach((el) => {
    const nodes = [...el.childNodes];
    if (nodes.some(n => n.nodeType === 1)) return;
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach((word, i) => {
      const outer = document.createElement('span');
      outer.className = 'word';
      const inner = document.createElement('span');
      inner.textContent = word;
      inner.style.transitionDelay = `${Math.min(i, 12) * 34}ms`;
      outer.appendChild(inner);
      el.appendChild(outer);
      if (i < words.length - 1) el.append(' ');
    });
  });

  // Reveal system.
  const revealTargets = document.querySelectorAll('.reveal, .split-words');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    revealTargets.forEach(el => revealObserver.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('is-visible'));
  }

  // Scroll meter and header contrast.
  const meter = document.querySelector('.scroll-meter span');
  const topbar = document.querySelector('#topbar');
  const portraitFrame = document.querySelector('.portrait-frame');
  const darkSections = document.querySelectorAll('.work-section, .timeline-section, .voice-section, .contact-section');
  const parallaxEnabled = Boolean(portraitFrame && finePointer && !reduceMotion && !compactViewport);
  let raf = 0;

  const updateScroll = () => {
    const y = window.scrollY;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    if (meter) meter.style.width = `${Math.min(100, y / max * 100)}%`;
    if (parallaxEnabled) {
      const shift = Math.min(640, y) * 0.04;
      portraitFrame.style.setProperty('--portrait-shift', `${shift.toFixed(1)}px`);
    }
    raf = 0;
  };
  addEventListener('scroll', () => {
    if (!raf) raf = requestAnimationFrame(updateScroll);
  }, { passive: true });
  updateScroll();

  if (topbar && 'IntersectionObserver' in window) {
    const visibleDark = new Set();
    const headerObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => entry.isIntersecting ? visibleDark.add(entry.target) : visibleDark.delete(entry.target));
      topbar.classList.toggle('dark', visibleDark.size > 0);
    }, { rootMargin: '-15% 0px -75% 0px', threshold: 0 });
    darkSections.forEach(s => headerObserver.observe(s));
  }

  // Futuristic pointer spotlight. Uses a single rAF per active surface and no idle loop.
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.case-card, .proof-card, .mini-project, .practice-media, .community-shot').forEach((el) => {
      let pending = 0;
      let px = 50;
      let py = 50;
      const paint = () => {
        el.style.setProperty('--spot-x', `${px}%`);
        el.style.setProperty('--spot-y', `${py}%`);
        pending = 0;
      };
      el.addEventListener('pointermove', (event) => {
        const rect = el.getBoundingClientRect();
        px = ((event.clientX - rect.left) / rect.width) * 100;
        py = ((event.clientY - rect.top) / rect.height) * 100;
        if (!pending) pending = requestAnimationFrame(paint);
      }, { passive: true });
      el.addEventListener('pointerleave', () => {
        if (pending) cancelAnimationFrame(pending);
        pending = 0;
        el.style.removeProperty('--spot-x');
        el.style.removeProperty('--spot-y');
      });
    });
  }

  // Highlight the section currently near the center of the viewport.
  const navLinks = [...document.querySelectorAll('.topbar nav a[href^="#"]')];
  const navTargets = navLinks
    .map((link) => ({ link, section: document.querySelector(link.getAttribute('href')) }))
    .filter((item) => item.section);
  if (navTargets.length && 'IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const match = navTargets.find((item) => item.section === entry.target);
        if (!match) return;
        match.link.classList.toggle('is-active', entry.isIntersecting);
      });
    }, { rootMargin: '-42% 0px -48% 0px', threshold: 0 });
    navTargets.forEach((item) => navObserver.observe(item.section));
  }

  // Pause purely decorative CSS animation when the browser tab is hidden.
  const syncVisibility = () => {
    document.documentElement.classList.toggle('page-hidden', document.hidden);
  };
  document.addEventListener('visibilitychange', syncVisibility);
  syncVisibility();
  // Pause continuous hero motion while it is off-screen to reduce unnecessary work.
  const hero = document.querySelector('.hero');
  if (hero && !reduceMotion && 'IntersectionObserver' in window) {
    const heroMotionObserver = new IntersectionObserver(([entry]) => {
      hero.classList.toggle('motion-paused', !entry.isIntersecting);
    }, { rootMargin: '120px 0px 120px 0px', threshold: 0 });
    heroMotionObserver.observe(hero);
  }

  // Animated public network counter.
  const counters = document.querySelectorAll('[data-count]');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = Number(el.dataset.count || 0);
        const suffix = el.dataset.suffix || '';
        const start = performance.now();
        const duration = 900;
        const tick = (now) => {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          const value = Math.round(target * eased);
          el.textContent = target >= 1000 && value >= 950 ? `1K${suffix}` : `${value}${suffix}`;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        counterObserver.unobserve(el);
      });
    }, { threshold: .6 });
    counters.forEach(c => counterObserver.observe(c));
  }

  // Field-story photo switching.
  const notes = [...document.querySelectorAll('.field-note')];
  const photos = [...document.querySelectorAll('.field-photo')];
  const fieldIndex = document.querySelector('.field-index span');
  const activateField = (index) => {
    notes.forEach((n, i) => n.classList.toggle('active', i === index));
    photos.forEach((p, i) => p.classList.toggle('active', i === index));
    if (fieldIndex) fieldIndex.textContent = String(index + 1).padStart(2, '0');
  };
  if (notes.length && 'IntersectionObserver' in window && !coarsePointer) {
    const fieldObserver = new IntersectionObserver((entries) => {
      const best = entries
        .filter(e => e.isIntersecting)
        .sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (best) activateField(Number(best.target.dataset.target));
    }, { threshold: [.25,.45,.65], rootMargin: '-18% 0px -24% 0px' });
    notes.forEach(n => fieldObserver.observe(n));
  } else if (notes.length) {
    activateField(0);
  }

  // Case study dialog.
  const cases = {
    b24: {
      kicker: 'EDTECH / AI / FULL-STACK',
      title: 'B24 Learning Assistant & Student Portal',
      lede: 'A university learning system that combines student operations with an AI tutor, voice interaction, interactive learning surfaces and anatomy-focused educational experiences.',
      problem: 'Student information, learning materials, tutoring and academic workflows often live in separate systems. The goal was to create one coherent student workspace rather than another isolated chatbot.',
      contribution: 'Product framing, UI direction, iterative development, AI interaction design, testing and deployment workflows across the portal and assistant experience.',
      stack: 'React 19, TypeScript, Vite, NestJS, Prisma, JWT, Three.js, Framer Motion and AI integrations.',
      result: 'A working platform spanning protected dashboards, attendance, fees, course materials, quizzes, calendar, chat and interactive AI learning experiences.',
      link: 'mailto:hassanabdihassan21@gmail.com?subject=Request%20B24%20private%20demo',
      linkLabel: 'Request private demo ↗'
    },
    bossbaby: {
      kicker: 'ERP / POS / OPERATIONS',
      title: 'Boss Baby Retail Operating System',
      lede: 'A production-oriented operating system for retail workflows, with the data integrity and controls needed to move beyond a simple checkout screen.',
      problem: 'Inventory, expenses, supplier operations and sales reconciliation become unreliable when each workflow lives in a disconnected spreadsheet or informal process.',
      contribution: 'Product development, POS and inventory workflows, reporting logic, data migration, quality gates, deployment and iterative operational fixes.',
      stack: 'Next.js, PostgreSQL, role-based access, reporting/BI, audit trails and deployment workflows.',
      result: 'A system covering variant inventory, POS, supplier workflows, credit, returns, transfers, expenses, fiscal reporting and legacy Excel migration.',
      link: 'mailto:hassanabdihassan21@gmail.com?subject=Request%20Boss%20Baby%20private%20demo',
      linkLabel: 'Request private demo ↗'
    },
    i24: {
      kicker: 'AGRITECH / IOT / PRODUCT RESEARCH',
      title: 'I24 Smart Grain Detector',
      lede: 'An applied agritech concept for detecting risky grain-storage conditions before loss becomes visible.',
      problem: 'Storage losses can develop from temperature, humidity, grain moisture, internal-air changes and pest activity without a simple monitoring layer for farmers and storage operators.',
      contribution: 'Research synthesis, product framing, sensor architecture, cost modelling, dashboard concept, market positioning and prototype support.',
      stack: 'ESP32, temperature/humidity, grain-moisture, air-quality/CO₂ proxy, acoustic/pest, level and tamper sensing.',
      result: 'A prototype direction designed for Somali storage contexts, with dashboard alerts and an expansion path from local users to East African markets.',
      link: 'https://github.com/Darkprince404-ops',
      linkLabel: 'Explore GitHub ↗'
    },
    research: {
      kicker: 'RESEARCH / DATA / M&E',
      title: 'Quantitative Research Systems',
      lede: 'A repeatable workflow for turning field instruments and raw responses into defensible analysis and decision-ready reporting.',
      problem: 'Research quality can break at any stage: questionnaire design, enumerator workflow, missing data, inconsistent coding, inappropriate tests or weak interpretation.',
      contribution: 'Questionnaire design, KoboToolbox setup, sample planning, field-QC logic, cleaning, reliability testing, descriptive statistics, regression, visualization and reporting.',
      stack: 'R, Stata, Excel, KoboToolbox, survey QA and statistical reporting.',
      result: 'Applied across youth participation, public-health, IDP, education and development studies, with a focus on transparent analysis and practical interpretation.',
      link: 'mailto:hassanabdihassan21@gmail.com?subject=Research%20and%20data%20collaboration',
      linkLabel: 'Discuss a research project ↗'
    }
  };

  const dialog = document.querySelector('#case-dialog');
  const dialogContent = document.querySelector('#case-dialog-content');
  const closeDialog = document.querySelector('.dialog-close');

  const openCase = (key) => {
    const item = cases[key];
    if (!dialog || !dialogContent || !item) return;
    dialogContent.innerHTML = `
      <div class="dialog-content">
        <span class="dialog-kicker">${item.kicker}</span>
        <h2 class="dialog-title">${item.title}</h2>
        <p class="dialog-lede">${item.lede}</p>
        <div class="dialog-grid">
          <div class="dialog-block"><span>Problem</span><p>${item.problem}</p></div>
          <div class="dialog-block"><span>My contribution</span><p>${item.contribution}</p></div>
          <div class="dialog-block"><span>Stack / method</span><p>${item.stack}</p></div>
          <div class="dialog-block"><span>Outcome</span><p>${item.result}</p></div>
        </div>
        <a class="dialog-link" href="${item.link}" ${item.link.startsWith('http') ? 'target="_blank" rel="noreferrer"' : ''}>${item.linkLabel}</a>
      </div>
    `;
    dialog.showModal();
    document.body.classList.add('dialog-open');
  };

  document.querySelectorAll('.case-card').forEach(card => {
    const key = card.dataset.case;
    card.querySelector('.case-open')?.addEventListener('click', () => openCase(key));
    card.addEventListener('dblclick', () => openCase(key));
  });
  const close = () => {
    dialog?.close();
    document.body.classList.remove('dialog-open');
  };
  closeDialog?.addEventListener('click', close);
  dialog?.addEventListener('click', (e) => {
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close();
  });
  dialog?.addEventListener('close', () => document.body.classList.remove('dialog-open'));

  // Neon-backed contact form.
  const contactForm = document.querySelector('#contact-form');
  const contactStatus = document.querySelector('#contact-status');
  if (contactForm && contactStatus) {
    contactForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!contactForm.reportValidity()) return;
      const submit = contactForm.querySelector('button[type="submit"]');
      const payload = Object.fromEntries(new FormData(contactForm).entries());
      submit.disabled = true;
      submit.setAttribute('aria-busy', 'true');
      contactStatus.textContent = 'Sending…';
      contactStatus.dataset.state = 'loading';
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(payload)
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'Message could not be sent.');
        contactForm.reset();
        contactStatus.textContent = 'Message received. I’ll get back to you soon.';
        contactStatus.dataset.state = 'success';
      } catch (error) {
        contactStatus.textContent = error.message || 'Something went wrong. Please email me directly.';
        contactStatus.dataset.state = 'error';
      } finally {
        submit.disabled = false;
        submit.removeAttribute('aria-busy');
      }
    });
  }
})();
