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
  const darkSections = document.querySelectorAll('.cyber-hero, .work-section, .story-library, .timeline-section, .voice-section, .contact-section');
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
  const hero = document.querySelector('.cyber-hero');
  if (hero && !reduceMotion && 'IntersectionObserver' in window) {
    const heroMotionObserver = new IntersectionObserver(([entry]) => {
      hero.classList.toggle('motion-paused', !entry.isIntersecting);
    }, { rootMargin: '120px 0px 120px 0px', threshold: 0 });
    heroMotionObserver.observe(hero);
  }

  // Cyber hero spotlight + text entrance.
  const cyberHero = document.querySelector('.cyber-hero');
  const cyberReveal = document.querySelector('#cyberReveal');

  if (cyberHero && cyberReveal) {
    const setCyberMask = (clientX, clientY) => {
      const rect = cyberReveal.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const width = window.innerWidth;
      const radius = width < 480 ? 120 : width < 720 ? 160 : 260;
      const mask = `radial-gradient(circle ${radius}px at ${x}px ${y}px, #fff 0%, #fff 40%, rgba(255,255,255,.75) 60%, rgba(255,255,255,.4) 75%, rgba(255,255,255,.12) 88%, transparent 100%)`;
      cyberReveal.style.webkitMaskImage = mask;
      cyberReveal.style.maskImage = mask;
    };

    if (finePointer && !reduceMotion) {
      cyberHero.addEventListener('pointermove', (event) => setCyberMask(event.clientX, event.clientY), { passive: true });
      cyberHero.addEventListener('pointerleave', () => {
        const hidden = 'radial-gradient(circle 0px at -999px -999px, #fff, transparent)';
        cyberReveal.style.webkitMaskImage = hidden;
        cyberReveal.style.maskImage = hidden;
      }, { passive: true });
    }

    if (!reduceMotion) {
      cyberHero.addEventListener('touchmove', (event) => {
        const touch = event.touches && event.touches[0];
        if (touch) setCyberMask(touch.clientX, touch.clientY);
      }, { passive: true });
    }

    let cyberWordIndex = 0;
    document.querySelectorAll('.cyber-words-pull-up').forEach((el) => {
      if (el.dataset.cyberSplit) return;
      el.dataset.cyberSplit = 'true';

      const directLines = el.tagName === 'H1' ? [...el.children].filter((child) => child.tagName === 'SPAN') : [];
      if (directLines.length) {
        directLines.forEach((line) => {
          const words = line.textContent.trim().split(/\s+/);
          line.textContent = '';
          words.forEach((word, index) => {
            const span = document.createElement('span');
            span.className = 'cyber-pull-word';
            span.textContent = word;
            span.style.animationDelay = `${cyberWordIndex * 0.1}s`;
            cyberWordIndex += 1;
            line.appendChild(span);
            if (index < words.length - 1) line.append(' ');
          });
        });
      } else {
        const words = el.textContent.trim().split(/\s+/);
        el.textContent = '';
        words.forEach((word, index) => {
          const span = document.createElement('span');
          span.className = 'cyber-pull-word';
          span.textContent = word;
          span.style.animationDelay = `${index * 0.1}s`;
          el.appendChild(span);
          if (index < words.length - 1) el.append(' ');
        });
      }
    });

    const cyberWords = document.querySelectorAll('.cyber-words-pull-up');
    const cyberFades = document.querySelectorAll('.cyber-fade-up');

    if (!reduceMotion && 'IntersectionObserver' in window) {
      const wordObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('cyber-words-visible');
          wordObserver.unobserve(entry.target);
        });
      }, { threshold: 0.2 });

      const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const delay = Number(entry.target.dataset.delay || 0);
          entry.target.style.animationDelay = `${delay}s`;
          entry.target.classList.add('cyber-is-visible');
          fadeObserver.unobserve(entry.target);
        });
      }, { threshold: 0.15 });

      cyberWords.forEach((el) => wordObserver.observe(el));
      cyberFades.forEach((el) => fadeObserver.observe(el));
    } else {
      cyberWords.forEach((el) => el.classList.add('cyber-words-visible'));
      cyberFades.forEach((el) => el.classList.add('cyber-is-visible'));
    }
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
    i24: {
      kicker: 'AGRITECH / DIGITAL MONITORING / PROTOTYPE',
      title: 'I24 Smart Grain Detector',
      lede: 'A prototype-stage digital monitoring concept designed to make changing grain-storage conditions easier to observe before deterioration becomes obvious.',
      role: 'Project founder: Abbas Abdullahi Sharif. Hassan’s contribution is research and product support, including problem framing, evidence synthesis, sensor-architecture exploration, cost modelling, dashboard thinking and market positioning. Hassan is not presented as the founder.',
      problem: 'Post-harvest grain storage conditions can deteriorate without timely monitoring. Temperature, humidity, grain moisture, internal-air changes, insect activity, fill level and opening/tamper events can all matter, but users may lack a simple monitoring layer.',
      approach: 'Translate the storage problem into a multi-input monitoring concept, identify practical sensing options, connect readings to a digital dashboard and frame alerts around user decisions rather than raw sensor values alone.',
      tools: 'ESP32; SHT31 temperature/humidity sensing; grain-moisture sensing; environmental/air indicators; acoustic insect-activity concepts; level monitoring; tamper/opening detection; dashboard prototyping.',
      implementation: 'Research and prototype support focused on a modular, low-cost concept suitable for Somali storage contexts, with attention to hardware choices, user needs, dashboard presentation and possible future scaling.',
      result: 'A documented prototype direction and dashboard concept. The project remains at prototype/concept stage; this portfolio does not claim commercial deployment, validated loss reduction or proven field impact.',
      adoption: 'The concept is framed around understandable alerts and practical recommendations so farmers or storage operators can act on information instead of interpreting raw sensor data.',
      stage: 'Prototype / concept development',
      link: 'mailto:hassanabdihassan21@gmail.com?subject=I24%20portfolio%20case',
      linkLabel: 'Discuss the case ↗'
    },
    training: {
      kicker: 'DIGITAL SYSTEMS / TRAINING OPERATIONS / USER ADOPTION',
      title: 'Digital Training & Attendance Workflow',
      lede: 'A practical programme-operations workflow supporting participant records, attendance, assessments and day-to-day user support for an AI, research and data-analysis training programme.',
      role: 'Programme coordination, facilitation and digital-workflow support through Benadir University Innovation Hub.',
      problem: 'Running a hands-on training programme requires more than teaching. Participant lists, check-in, attendance status, assessments, follow-up and troubleshooting need to stay organised without creating unnecessary manual work.',
      approach: 'Structure participant records, use QR-based check-in, monitor attendance, coordinate assessment workflows and support learners when devices, forms or course processes create friction.',
      tools: 'QR-based attendance; structured participant records; spreadsheets; digital forms; R learning workflows; presentation and training materials; communication and follow-up processes.',
      implementation: 'The workflow supported registration and attendance operations alongside practical teaching, assessment coordination, troubleshooting and participant-facing communication.',
      result: 'A more structured programme-operations process with clearer attendance records, easier follow-up and a practical link between training delivery and digital administration. No unverified participation or performance metrics are claimed here.',
      adoption: 'Training, onboarding, clear instructions, troubleshooting and participant support were treated as part of the system rather than afterthoughts.',
      stage: 'Implemented programme workflow',
      link: 'mailto:hassanabdihassan21@gmail.com?subject=Digital%20training%20workflow',
      linkLabel: 'Discuss programme systems ↗'
    },
    research: {
      kicker: 'RESEARCH / DATA / M&E',
      title: 'Research & Survey Data Systems',
      lede: 'A repeatable field-to-report workflow for turning digital survey responses into cleaner evidence and clearer decisions.',
      role: 'Research support, survey/data workflow design, field monitoring, quality control, data management and quantitative analysis across development and public-health work.',
      problem: 'Research quality can fail at multiple points: instrument design, digital collection, enumerator practice, missing or inconsistent records, weak cleaning, inappropriate analysis or unclear interpretation.',
      approach: 'Design structured instruments, configure digital collection, monitor submissions, flag quality issues, support corrections and callbacks where appropriate, clean data, run suitable analysis and communicate findings transparently.',
      tools: 'KoboToolbox; XLSForm; Excel; R; Stata; SPSS; descriptive statistics; reliability checks; regression and data visualisation where appropriate.',
      implementation: 'The workflow follows a clear chain: survey design → digital collection → field monitoring → quality control → cleaning → analysis → visualisation → reporting.',
      result: 'Applied research and data-support workflows that improve traceability between the field instrument, cleaned dataset, statistical output and final interpretation while protecting participant confidentiality.',
      adoption: 'Field guidance, enumerator support, clear validation logic and feedback loops help the data system work under real operating conditions.',
      stage: 'Applied research / data operations',
      link: 'mailto:hassanabdihassan21@gmail.com?subject=Research%20and%20data%20collaboration',
      linkLabel: 'Discuss a research project ↗'
    },
    innovation: {
      kicker: 'INNOVATION / BUSINESS DEVELOPMENT / PROGRAMMES',
      title: 'Innovation Hub Programme Implementation',
      lede: 'Programme delivery at the intersection of innovation, entrepreneurship, business development, training, stakeholder engagement and practical digital systems.',
      role: 'Head of Innovations and Business Development, Benadir University Innovation Hub, 2023–Present.',
      problem: 'Innovation programmes need coordinated delivery across participants, university teams, partners, trainers, communications, documentation and follow-up. Strong ideas alone do not create a functioning programme.',
      approach: 'Connect programme design with partner outreach, workshops, entrepreneurship support, participant workflows, proposals, presentations, documentation, events and implementation follow-up.',
      tools: 'Programme plans; stakeholder coordination; participant records; presentations; digital forms and tracking workflows; proposal/concept development; event and training materials.',
      implementation: 'Work spans programme design, innovation activities, business development, training coordination, stakeholder engagement, partner outreach, research/data support, workshops, events, proposals, communications and knowledge products.',
      result: 'A practical implementation role that links institutional priorities to participant-facing programmes, partner engagement and documented outputs without separating “technology” from the people and processes needed to use it.',
      adoption: 'Workshops, onboarding, facilitation, participant communication and follow-up are used to make programme tools and processes understandable and usable.',
      stage: 'Ongoing professional role',
      link: 'mailto:hassanabdihassan21@gmail.com?subject=Innovation%20and%20business%20development',
      linkLabel: 'Discuss programme work ↗'
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
        <div class="dialog-stage">STAGE · ${item.stage}</div>
        <div class="dialog-grid dialog-grid-evidence">
          <div class="dialog-block dialog-block-wide"><span>Hassan’s role</span><p>${item.role}</p></div>
          <div class="dialog-block"><span>Problem</span><p>${item.problem}</p></div>
          <div class="dialog-block"><span>Solution / approach</span><p>${item.approach}</p></div>
          <div class="dialog-block"><span>Tools</span><p>${item.tools}</p></div>
          <div class="dialog-block"><span>Implementation</span><p>${item.implementation}</p></div>
          <div class="dialog-block"><span>Result / output</span><p>${item.result}</p></div>
          <div class="dialog-block"><span>User adoption</span><p>${item.adoption}</p></div>
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

  // Interactive My Library 3D story ring.
  const libraryRing = document.querySelector('#libraryRing');
  const librarySection = document.querySelector('.story-library');

  if (libraryRing && librarySection) {
    const stories = [
      {
        image: './assets/images/nafis-portrait.webp',
        alt: 'Hassan Abdi Hassan at the National Agri-Food Investment Summit 2026',
        title: 'National Agri-Food Investment Summit',
        type: 'REPRESENTATION',
        meta: 'NAFIS 2026 · MOGADISHU',
        text: 'A public-facing moment connecting university innovation work with Somalia’s agri-food ecosystem and investment conversations.'
      },
      {
        image: './assets/images/prototyping.webp',
        alt: 'Hassan working on an electronics prototype at Benadir University Innovation Hub',
        title: 'I24 Prototype Build',
        type: 'PROTOTYPING',
        meta: 'BU INNOVATION HUB · AGRITECH',
        text: 'Prototype-support work around founder Abbas Abdullahi Sharif’s I24 Smart Grain Detector concept, connecting storage research, sensing options, hardware exploration and product thinking.'
      },
      {
        image: './assets/images/somes-speaking-1.webp',
        alt: 'Hassan speaking during a Benadir University and SOMES partnership event',
        title: 'Speaking & Partnership',
        type: 'PUBLIC SPEAKING',
        meta: 'BENADIR UNIVERSITY × SOMES',
        text: 'A partnership setting where public speaking, evaluation, institutional learning and collaboration come together.'
      },
      {
        image: './assets/images/workshop-stage.webp',
        alt: 'Hassan presenting an innovation and technology session',
        title: 'Innovation & Technology Session',
        type: 'FACILITATION',
        meta: 'BU INNOVATION HUB · DIGITAL SOMALIA',
        text: 'Facilitating practical discussions that connect emerging technology with real local needs, opportunities and implementation.'
      },
      {
        image: './assets/images/ai-course-mentoring.webp',
        alt: 'Hassan mentoring learners during an AI and research course',
        title: 'Hands-on AI Research Mentoring',
        type: 'MENTORING',
        meta: 'AI RESEARCH & DATA ANALYSIS',
        text: 'Working directly with learners at their laptops, troubleshooting analysis workflows and helping turn theory into usable research skills.'
      },
      {
        image: './assets/images/ai-course-attendance.webp',
        alt: 'Hassan presenting an AI course attendance system',
        title: 'Applied Course Systems',
        type: 'DATA + AUTOMATION',
        meta: 'AI COURSE · QR ATTENDANCE',
        text: 'A practical teaching environment supported by QR-based attendance, structured participant records, assessment coordination, troubleshooting and day-to-day programme operations.'
      },
      {
        image: './assets/images/team-partnership.webp',
        alt: 'Team and partners at Benadir University Innovation Hub',
        title: 'Partnerships & Shared Goals',
        type: 'COLLABORATION',
        meta: 'INNOVATION HUB · SDGs',
        text: 'Innovation work is collaborative. This moment represents coordination, relationship-building and shared institutional goals.'
      },
      {
        image: './assets/images/stakeholder-meeting.webp',
        alt: 'Professional stakeholder meeting at Benadir University Innovation Hub',
        title: 'Institutional Coordination',
        type: 'STAKEHOLDER WORK',
        meta: 'PLANNING · COORDINATION',
        text: 'Supporting stakeholder discussions and professional coordination around programs, innovation and organizational priorities.'
      },
      {
        image: './assets/images/leadership-dialogue.webp',
        alt: 'Hassan contributing to a professional discussion',
        title: 'Program Design Dialogue',
        type: 'LEADERSHIP',
        meta: 'STRATEGY · PROGRAM DESIGN',
        text: 'A working-session moment representing the conversations behind program design, decision-making and practical implementation.'
      },
      {
        image: './assets/images/participant-collaboration.webp',
        alt: 'Participants collaborating during a practical workshop',
        title: 'Peer Learning in Practice',
        type: 'LEARNING',
        meta: 'WORKSHOP · COLLABORATION',
        text: 'Participants working together rather than passively listening: peer exchange, problem-solving and practical learning in the room.'
      },
      {
        image: './assets/images/training-2.webp',
        alt: 'Hassan facilitating a practical innovation workshop',
        title: 'Training Room Facilitation',
        type: 'FACILITATION',
        meta: 'PRACTICAL LEARNING · BU IHUB',
        text: 'Designing and leading sessions where participants work through innovation and technology challenges together.'
      },
      {
        image: './assets/images/blue-shirt-speaking.webp',
        alt: 'Hassan speaking during a youth-focused innovation session',
        title: 'Youth-Focused Innovation',
        type: 'SPEAKING',
        meta: 'YOUTH · INNOVATION · DIGITAL SKILLS',
        text: 'Communicating technology and innovation in a way that helps young people see concrete pathways into skills, tools and opportunities.'
      }
    ];

    const storyImage = document.querySelector('#libraryStoryImage');
    const storyIndex = document.querySelector('#libraryStoryIndex');
    const storyType = document.querySelector('#libraryStoryType');
    const storyTitle = document.querySelector('#libraryStoryTitle');
    const storyText = document.querySelector('#libraryStoryText');
    const storyMeta = document.querySelector('#libraryStoryMeta');
    const storyOmni = document.querySelector('#libraryOmni');
    const storyMedia = document.querySelector('.library-story-media');
    const prev = document.querySelector('#libraryPrev');
    const next = document.querySelector('#libraryNext');

    const cards = stories.map((story, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'library-card';
      button.dataset.storyIndex = String(index);
      button.setAttribute('aria-label', `Open story: ${story.title}`);
      button.innerHTML = `<img src="${story.image}" alt="" loading="lazy" decoding="async"><span>${String(index + 1).padStart(2, '0')} · ${story.type}</span>`;
      button.querySelector('img').addEventListener('error', () => button.classList.add('broken'));
      libraryRing.appendChild(button);
      return button;
    });

    let selected = 0;
    let lastAuto = performance.now();
    let userLockUntil = 0;
    const step = 11.5;
    const radius = 430;
    const cullAngle = 50;

    const wrappedDistance = (index, center) => {
      let distance = index - center;
      const half = stories.length / 2;
      if (distance > half) distance -= stories.length;
      if (distance < -half) distance += stories.length;
      return distance;
    };

    const updateStory = (index, smooth = true) => {
      selected = (index + stories.length) % stories.length;
      const story = stories[selected];

      cards.forEach((card, i) => card.setAttribute('aria-current', i === selected ? 'true' : 'false'));
      if (storyMedia && smooth) storyMedia.classList.add('is-changing');

      window.setTimeout(() => {
        if (storyImage) {
          storyImage.src = story.image;
          storyImage.alt = story.alt;
        }
        if (storyIndex) storyIndex.textContent = `${String(selected + 1).padStart(2, '0')} / ${String(stories.length).padStart(2, '0')}`;
        if (storyType) storyType.textContent = story.type;
        if (storyTitle) storyTitle.textContent = story.title;
        if (storyText) storyText.textContent = story.text;
        if (storyMeta) storyMeta.textContent = story.meta;
        if (storyOmni) storyOmni.textContent = `portfolio://story/${String(selected + 1).padStart(2, '0')}`;
        if (storyMedia) storyMedia.classList.remove('is-changing');
      }, smooth ? 120 : 0);
    };

    const placeCards = () => {
      const mobile = matchMedia('(max-width: 820px)').matches;
      if (mobile) return;

      cards.forEach((card, index) => {
        const relative = wrappedDistance(index, selected);
        const a = relative * step;
        const abs = Math.abs(a);

        if (abs > cullAngle) {
          card.style.visibility = 'hidden';
          card.style.pointerEvents = 'none';
          return;
        }

        card.style.visibility = 'visible';
        card.style.pointerEvents = 'auto';

        const r = a * Math.PI / 180;
        const c = Math.max(.35, Math.cos(r));
        const x = radius * Math.sin(r);
        const z = radius * (1 - c);
        const depthScale = relative === 0 ? 1.07 : Math.max(.83, 1 - abs / 250);

        card.style.transform = `translate3d(${x}px,0,${z}px) rotateY(${-a}deg) scale(${depthScale})`;
        card.style.filter = `brightness(${Math.max(.72, 1 - abs / 155)})`;
        card.style.opacity = String(Math.max(.54, 1 - abs / 120));
        card.style.zIndex = String(relative === 0 ? 140 : 100 - Math.round(abs));
      });
    };

    const selectStory = (index, fromUser = false) => {
      const normalized = (index + stories.length) % stories.length;
      updateStory(normalized);
      placeCards();
      if (fromUser) {
        userLockUntil = performance.now() + 9000;
        if (matchMedia('(max-width: 820px)').matches) {
          cards[normalized]?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
        }
      }
      lastAuto = performance.now();
    };

    cards.forEach((card, index) => card.addEventListener('click', () => selectStory(index, true)));
    prev?.addEventListener('click', () => selectStory(selected - 1, true));
    next?.addEventListener('click', () => selectStory(selected + 1, true));

    librarySection.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') selectStory(selected - 1, true);
      if (event.key === 'ArrowRight') selectStory(selected + 1, true);
    });

    const tickLibrary = (now) => {
      if (!reduceMotion && !matchMedia('(max-width: 820px)').matches && !document.hidden) {
        if (now > userLockUntil && now - lastAuto > 5200) {
          selectStory(selected + 1, false);
          lastAuto = now;
        }
      }
      requestAnimationFrame(tickLibrary);
    };

    document.addEventListener('visibilitychange', () => { lastAuto = performance.now(); });
    updateStory(0, false);
    placeCards();
    requestAnimationFrame(tickLibrary);
  }

})();
