(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;

  // Intro loader.
  const loader = document.querySelector('.page-loader');
  if (loader) {
    if (reduceMotion) loader.remove();
    else setTimeout(() => loader.classList.add('done'), 1250);
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
  const darkSections = document.querySelectorAll('.work-section, .timeline-section, .voice-section, .contact-section');
  let raf = 0;

  const updateScroll = () => {
    const y = window.scrollY;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    if (meter) meter.style.width = `${Math.min(100, y / max * 100)}%`;
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

  // Custom cursor for project/media surfaces.
  const cursor = document.querySelector('.cursor');
  if (cursor && finePointer && !reduceMotion) {
    let tx = innerWidth / 2, ty = innerHeight / 2, x = tx, y = ty;
    addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    const follow = () => {
      x += (tx - x) * .16;
      y += (ty - y) * .16;
      cursor.style.left = `${x}px`;
      cursor.style.top = `${y}px`;
      requestAnimationFrame(follow);
    };
    follow();
    document.querySelectorAll('.media-hover, .proof-card').forEach(el => {
      el.addEventListener('pointerenter', () => cursor.classList.add('active'));
      el.addEventListener('pointerleave', () => cursor.classList.remove('active'));
    });
  }

  // Magnetic buttons.
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.magnetic').forEach(el => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * .08}px,${dy * .08}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  // Gentle parallax on hero portrait.
  const heroPortrait = document.querySelector('.hero-portrait');
  if (heroPortrait && !reduceMotion) {
    addEventListener('scroll', () => {
      const y = Math.min(650, window.scrollY);
      heroPortrait.style.transform = `translate3d(0,${y * .055}px,0)`;
    }, { passive: true });
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
  if (notes.length && 'IntersectionObserver' in window) {
    const fieldObserver = new IntersectionObserver((entries) => {
      const best = entries
        .filter(e => e.isIntersecting)
        .sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (best) activateField(Number(best.target.dataset.target));
    }, { threshold: [.25,.45,.65], rootMargin: '-18% 0px -24% 0px' });
    notes.forEach(n => fieldObserver.observe(n));
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
