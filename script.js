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
    item.addEventListener('mouseenter', () => button.setAttribute('aria-expanded', 'true'));
    item.addEventListener('mouseleave', () => button.setAttribute('aria-expanded', 'false'));
    button.addEventListener('focus', () => button.setAttribute('aria-expanded', 'true'));
    button.addEventListener('blur', () => button.setAttribute('aria-expanded', 'false'));
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

  // Horizontal scroller controls (Campus Challenge)
  const scroller = qs('#campusScroller');
  qsa('.scroll-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!scroller) return;
      const dir = Number(btn.dataset.dir || '1');
      const amount = scroller.clientWidth * 0.8 * dir;
      scroller.scrollBy({ left: amount, behavior: 'smooth' });
    });
  });

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
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (isTouchDevice) {
    // Touch devices: scroll-based expansion
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Collapse all
          accordionItems.forEach(i => i.classList.remove('expanded'));
          // Expand this one
          entry.target.classList.add('expanded');
        }
      });
    }, observerOptions);
    accordionItems.forEach((item) => observer.observe(item));
  } else {
    // Desktop: click and hover expansion
    accordionItems.forEach(item => {
      const toggle = item.querySelector('.accordion-toggle');
      toggle.addEventListener('click', () => {
        const isExpanded = item.classList.contains('expanded');
        // Collapse all items
        accordionItems.forEach(i => i.classList.remove('expanded'));
        // Expand clicked item if it was not already expanded
        if (!isExpanded) {
          item.classList.add('expanded');
        }
      });
      // Also expand on hover
      toggle.addEventListener('mouseenter', () => {
        accordionItems.forEach(i => i.classList.remove('expanded'));
        item.classList.add('expanded');
      });
    });
  }
})();


