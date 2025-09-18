(function() {
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Announcement bar close
  const announcement = qs('#announcementBar');
  const closeAnnouncement = qs('#closeAnnouncement');
  if (closeAnnouncement) {
    closeAnnouncement.addEventListener('click', () => {
      if (!announcement) return;
      announcement.style.transition = 'opacity 200ms ease';
      announcement.style.opacity = '0';
      setTimeout(() => { announcement.style.display = 'none'; }, 200);
    });
  }

  // Mobile menu toggle
  const menuToggle = qs('#menuToggle');
  const mobileMenu = qs('#mobileMenu');
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!expanded));
      mobileMenu.hidden = expanded;
    });
  }

  // Dropdown accessible hover/focus handling
  qsa('.has-dropdown').forEach((item) => {
    const button = qs('.nav-link', item);
    const dropdown = qs('.dropdown', item);
    if (!button || !dropdown) return;
    // Desktop hover
    item.addEventListener('mouseenter', () => button.setAttribute('aria-expanded', 'true'));
    item.addEventListener('mouseleave', () => button.setAttribute('aria-expanded', 'false'));
    button.addEventListener('focus', () => button.setAttribute('aria-expanded', 'true'));
    button.addEventListener('blur', () => button.setAttribute('aria-expanded', 'false'));

    // Mobile tap: open panel with the dropdown's links
    function openMobilePanel(e) {
      const isMobile = window.matchMedia('(max-width: 768px)').matches;
      if (!isMobile) return; // keep desktop behavior
      e.preventDefault();
      const panel = qs('#mobileNavPanel');
      if (!panel) return;
      // Populate panel
      const links = qsa('a', dropdown).map(a => ({ href: a.getAttribute('href') || '#', text: a.textContent }));
      if (links.length === 0) { panel.hidden = true; return; }
      panel.innerHTML = links.map(l => `<a href="${l.href}">${l.text}</a>`).join('');
      panel.hidden = false;
      panel.style.display = 'grid';
      // Ensure panel is visible in viewport
      panel.scrollIntoView({ block: 'start', behavior: 'smooth' });

      // Toggle behavior: if same button tapped again, hide
      const currentKey = button.textContent.trim();
      if (panel.dataset.openKey === currentKey) {
        panel.hidden = true;
        panel.dataset.openKey = '';
        return;
      }
      panel.dataset.openKey = currentKey;
      // Auto-hide when clicking outside or choosing a link
      const hide = (ev) => {
        if (!panel.contains(ev.target) && ev.target !== button) {
          panel.hidden = true;
          document.removeEventListener('click', hide);
        }
      };
      setTimeout(() => document.addEventListener('click', hide), 0);
    }
    // Bind both click and pointerup for better mobile support
    button.addEventListener('click', openMobilePanel);
    button.addEventListener('pointerup', openMobilePanel);
  });

  // Shoe selection
  const shoeButtons = qsa('.shoe');
  let selectedShoe = null;
  shoeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (selectedShoe === btn.dataset.shoe) {
        selectedShoe = null;
        btn.setAttribute('aria-pressed', 'false');
        return;
      }
      selectedShoe = btn.dataset.shoe;
      shoeButtons.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    });
  });

  // Photo upload preview
  const photoInput = qs('#photoInput');
  const photoPreview = qs('#photoPreview');
  if (photoInput && photoPreview) {
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      photoPreview.src = url;
      photoPreview.hidden = false;
      const visual = qs('.upload-visual');
      if (visual) visual.style.display = 'none';
    });
  }

  // Key modal handling
  const tryNow = qs('#tryNow');
  const tryNowTop = qs('#tryNowTop');
  const keyModal = qs('#keyModal');
  const keyInput = qs('#geminiKeyInput');
  const rememberKey = qs('#rememberKey');
  const keyStatus = qs('#keyStatus');

  function getStoredKey() {
    try {
      return localStorage.getItem('gemini_api_key') || sessionStorage.getItem('gemini_api_key') || '';
    } catch { return ''; }
  }
  function storeKey(value, remember) {
    try {
      if (remember) {
        localStorage.setItem('gemini_api_key', value);
        sessionStorage.removeItem('gemini_api_key');
      } else {
        sessionStorage.setItem('gemini_api_key', value);
      }
    } catch {}
  }
  function updateKeyStatus() {
    const hasKey = !!getStoredKey();
    if (keyStatus) {
      keyStatus.hidden = !hasKey;
    }
  }
  updateKeyStatus();

  function openKeyModal() {
    if (!keyModal) return;
    if (typeof keyModal.showModal === 'function') {
      keyModal.showModal();
    } else {
      keyModal.removeAttribute('hidden');
    }
    const existing = getStoredKey();
    if (keyInput) keyInput.value = existing;
  }

  [tryNow, tryNowTop].forEach((btn) => {
    if (!btn) return;
    btn.addEventListener('click', () => {
      openKeyModal();
    });
  });

  const keyForm = qs('#keyForm');
  if (keyForm) {
    keyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = keyInput ? keyInput.value.trim() : '';
      if (!value) return;
      storeKey(value, !!(rememberKey && rememberKey.checked));
      if (keyModal && typeof keyModal.close === 'function') keyModal.close();
      updateKeyStatus();
      alert('Gemini key saved locally for this preview.');
    });
  }

  // Reset form
  const resetForm = qs('#resetForm');
  if (resetForm) {
    resetForm.addEventListener('click', () => {
      // Reset file
      if (photoInput) photoInput.value = '';
      if (photoPreview) {
        photoPreview.src = '';
        photoPreview.hidden = true;
      }
      const visual = qs('.upload-visual');
      if (visual) visual.style.display = 'flex';
      // Reset shoe selection
      selectedShoe = null;
      shoeButtons.forEach(b => b.setAttribute('aria-pressed', 'false'));
    });
  }

  // Stacked Card Carousel for Campus Challenge
  (function() {
    const carousel = qs('#campusCarousel');
    if (!carousel) return;

    const tiles = qsa('.tile', carousel);
    const prevBtns = qsa('.carousel-btn.prev');
    const nextBtns = qsa('.carousel-btn.next');
    let currentIndex = 0;
    let autoplayInterval;
    let isPaused = false;

    function transformForOffset(offset) {
      // offset 0 is active card
      if (offset === 0) {
        return 'translate3d(-50%, -50%, 0) rotateY(0deg) rotateX(0deg) scale(1)';
      }
      if (offset === 1) {
        return 'translate3d(calc(-50% + 40px), calc(-50% + 20px), -120px) rotateY(-15deg) rotateX(5deg) scale(0.85)';
      }
      if (offset === 2) {
        return 'translate3d(calc(-50% + 80px), calc(-50% + 40px), -240px) rotateY(-25deg) rotateX(10deg) scale(0.7)';
      }
      // 3 or more: push far back and hide visually
      return 'translate3d(calc(-50% + 120px), calc(-50% + 60px), -480px) rotateY(-35deg) rotateX(15deg) scale(0.5)';
    }

    function updateCarousel() {
      tiles.forEach((tile, index) => {
        const rel = (index - currentIndex + tiles.length) % tiles.length; // 0..N-1
        tile.style.transform = transformForOffset(rel);
        // Only keep two background tiles slightly visible; hide the rest
        if (rel === 0) {
          tile.style.opacity = '1';
          tile.style.visibility = 'visible';
          tile.style.pointerEvents = 'auto';
        } else if (rel === 1) {
          tile.style.opacity = '0.01  ';
          tile.style.visibility = 'visible';
          tile.style.pointerEvents = 'none';
        } else if (rel === 2) {
          tile.style.opacity = '0.2';
          tile.style.visibility = 'visible';
          tile.style.pointerEvents = 'none';
        } else {
          tile.style.opacity = '0';
          tile.style.visibility = 'hidden';
          tile.style.pointerEvents = 'none';
        }
        tile.classList.toggle('active', rel === 0);
      });
    }

    function nextCard() { currentIndex = (currentIndex + 1) % tiles.length; updateCarousel(); }
    function prevCard() { currentIndex = (currentIndex - 1 + tiles.length) % tiles.length; updateCarousel(); }

    function startAutoplay() {
      autoplayInterval = setInterval(() => { if (!isPaused) nextCard(); }, 7000);
    }
    function stopAutoplay() { clearInterval(autoplayInterval); }
    function pauseAutoplay() { isPaused = true; }
    function resumeAutoplay() { isPaused = false; }

    // Event listeners for all arrow buttons
    prevBtns.forEach(b => b.addEventListener('click', prevCard));
    nextBtns.forEach(b => b.addEventListener('click', nextCard));

    // Pause on hover/tap
    carousel.addEventListener('mouseenter', pauseAutoplay);
    carousel.addEventListener('mouseleave', resumeAutoplay);
    carousel.addEventListener('touchstart', pauseAutoplay);
    carousel.addEventListener('touchend', resumeAutoplay);

    // Swipe gestures for mobile
    let startX = 0;
    let endX = 0;
    carousel.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; pauseAutoplay(); });
    carousel.addEventListener('touchend', (e) => {
      endX = e.changedTouches[0].clientX;
      const diffX = startX - endX;
      if (Math.abs(diffX) > 50) { if (diffX > 0) nextCard(); else prevCard(); }
      resumeAutoplay();
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') prevCard();
      else if (e.key === 'ArrowRight') nextCard();
    });

    // Initialize positions (override inline transforms)
    updateCarousel();
    startAutoplay();
  })();

  // Timeline highlighting
  const timelineEvents = qsa('.event');
  if (timelineEvents.length > 0) {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        } else {
          entry.target.classList.remove('active');
        }
      });
    }, observerOptions);
    timelineEvents.forEach((event) => observer.observe(event));
  }

  // Accordion functionality for Brand Philosophy and global accordions
  const accordionItems = qsa('.accordion-item');
  if (accordionItems.length > 0) {
    accordionItems.forEach(item => {
      const toggle = item.querySelector('.accordion-toggle');
      if (!toggle) return;
      // Click toggles on all devices (fixes mobile + not opening)
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isExpanded = item.classList.contains('expanded');
        accordionItems.forEach(i => i.classList.remove('expanded'));
        if (!isExpanded) item.classList.add('expanded');
      });
      // Keyboard support
      toggle.setAttribute('role', 'button');
      toggle.setAttribute('tabindex', '0');
      toggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle.click(); }
      });
      // Desktop hover enhancement only when hover is available
      toggle.addEventListener('mouseenter', () => {
        if (window.matchMedia('(hover:hover)').matches) {
          accordionItems.forEach(i => i.classList.remove('expanded'));
          item.classList.add('expanded');
        }
      });
    });
    if (window.matchMedia('(max-width: 768px)').matches && accordionItems[0]) {
      accordionItems[0].classList.add('expanded');
    }
  }
})();

// Story section scroll animations
(function() {
  const storyBlocks = document.querySelectorAll('.story-block');

  if (storyBlocks.length > 0) {
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -100px 0px', // Trigger slightly before fully in view
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
          // Optional: unobserve after animation to prevent re-triggering
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    storyBlocks.forEach((block) => observer.observe(block));
  }
})();

