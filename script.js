(() => {
  const root = document.documentElement;
  const progress = document.querySelector('.scroll-progress span');
  const cursorGlow = document.querySelector('.cursor-glow');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reveal on scroll.
  const revealables = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.13, rootMargin: '0px 0px -5% 0px' });
    revealables.forEach((el, index) => {
      el.style.transitionDelay = `${Math.min(index % 5, 4) * 70}ms`;
      observer.observe(el);
    });
  } else {
    revealables.forEach((el) => el.classList.add('is-visible'));
  }

  // Scroll progress + subtle parallax.
  const parallaxItems = [
    { el: document.querySelector('.hero-grid'), speed: 0.06 },
    { el: document.querySelector('.orbit-a'), speed: -0.035 },
    { el: document.querySelector('.orbit-b'), speed: 0.045 },
    { el: document.querySelector('.contact-orb'), speed: -0.025 }
  ].filter(x => x.el);

  let raf = null;
  const updateScroll = () => {
    const top = window.scrollY || document.documentElement.scrollTop;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    if (progress) progress.style.width = `${Math.min(100, (top / max) * 100)}%`;
    if (!reduceMotion) {
      parallaxItems.forEach(({el, speed}) => {
        el.style.transform = `translate3d(0, ${top * speed}px, 0)`;
      });
    }
    raf = null;
  };
  window.addEventListener('scroll', () => {
    if (!raf) raf = requestAnimationFrame(updateScroll);
  }, { passive: true });
  updateScroll();

  // Cursor halo.
  if (cursorGlow && !reduceMotion && window.matchMedia('(pointer:fine)').matches) {
    let targetX = innerWidth / 2, targetY = innerHeight / 2;
    let x = targetX, y = targetY;
    window.addEventListener('pointermove', (e) => { targetX = e.clientX; targetY = e.clientY; }, { passive: true });
    const follow = () => {
      x += (targetX - x) * .12;
      y += (targetY - y) * .12;
      cursorGlow.style.left = `${x}px`;
      cursorGlow.style.top = `${y}px`;
      requestAnimationFrame(follow);
    };
    follow();
  }

  // Magnetic CTA buttons.
  if (!reduceMotion && window.matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('.magnetic').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * .08}px, ${dy * .08}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  // Tilt cards on fine pointers.
  if (!reduceMotion && window.matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('.tilt-card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5;
        const py = (e.clientY - r.top) / r.height - .5;
        card.style.transform = `perspective(900px) rotateX(${py * -4}deg) rotateY(${px * 5}deg) translateZ(0)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  // Pause horizontal gallery while it is mostly off screen to reduce CPU work.
  const gallery = document.querySelector('.gallery-track');
  const galleryWrap = document.querySelector('.gallery-track-wrap');
  if (gallery && galleryWrap && 'IntersectionObserver' in window) {
    const gObs = new IntersectionObserver(([entry]) => {
      gallery.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
    }, { threshold: 0.04 });
    gObs.observe(galleryWrap);
  }

  // Neon-backed contact form. The database credential remains on the server.
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
          headers: { 'Content-Type': 'application/json' },
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

  // Section-aware header state.
  const header = document.querySelector('.site-header');
  const contact = document.querySelector('#contact');
  if (header && contact && 'IntersectionObserver' in window) {
    const hObs = new IntersectionObserver(([entry]) => {
      header.style.borderColor = entry.isIntersecting ? 'rgba(133,242,166,.32)' : 'rgba(255,255,255,.1)';
    }, { threshold: .2 });
    hObs.observe(contact);
  }
})();
