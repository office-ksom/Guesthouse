/**
 * KSoM Guesthouse — Dynamic Public Site Section Manager (CMS)
 */
import { api } from '/js/api.js';

/**
 * Initialize dynamic section rendering on a public page
 * @param {string} pageKey - Key in settings, e.g. 'index', 'rooms', 'contact'
 * @param {string} containerSelector - Main container holding the sections
 */
export async function initCMS(pageKey, containerSelector) {
  try {
    const res = await api.getSettings();
    if (!res || !res.settings) return;
    const s = res.settings;

    // Load sections array
    const sectionsConfigStr = s[`sections_${pageKey}`];
    if (!sectionsConfigStr) return;

    let sections = [];
    try {
      sections = JSON.parse(sectionsConfigStr);
    } catch {
      return;
    }

    const container = document.querySelector(containerSelector);
    if (!container) return;

    // 1. Gather all existing hardcoded sections
    const elementsMap = {};
    container.querySelectorAll('[data-section-id]').forEach(el => {
      const id = el.getAttribute('data-section-id');
      elementsMap[id] = el;
      el.remove(); // Detach to reorder
    });

    // 2. Loop through sections config in order
    sections.forEach(sec => {
      let el = elementsMap[sec.id];

      // If it's a custom text/HTML section, dynamically construct it
      if (!el && sec.type === 'custom') {
        el = document.createElement('section');
        el.className = 'section custom-section';
        el.setAttribute('data-section-id', sec.id);
        el.style.padding = 'var(--space-16) 0';
      }

      if (el) {
        // Toggle visibility
        if (sec.visible === false) {
          el.style.display = 'none';
          el.classList.remove('reveal', 'visible');
        } else {
          el.style.display = '';
        }

        // Apply content updates
        if (sec.type === 'custom') {
          el.style.background = sec.content?.background === 'gray' ? 'var(--bg)' : 'white';
          el.innerHTML = `
            <div class="container">
              ${sec.content?.title ? `
                <div class="section-header reveal visible">
                  <h2 class="section-header__title">${sec.content.title}</h2>
                  ${sec.content.subtitle ? `<p class="section-header__subtitle">${sec.content.subtitle}</p>` : ''}
                </div>
              ` : ''}
              <div class="custom-section-body" style="line-height:1.7; color:var(--text-secondary)">
                ${sec.content?.body || ''}
              </div>
            </div>
          `;
        } else {
          updateStandardSectionDOM(sec, el, s);
        }

        // Append in the sorted order
        container.appendChild(el);
      }
    });

    // 3. Fallback for any standard section not configured in sections list (append at end)
    Object.keys(elementsMap).forEach(id => {
      const isConfigured = sections.some(sec => sec.id === id);
      if (!isConfigured) {
        container.appendChild(elementsMap[id]);
      }
    });

    // 4. Update footer globally
    updateFooterDOM(s);

  } catch (err) {
    console.warn(`[CMS] Error initializing page sections for ${pageKey}:`, err);
  }
}

/**
 * Map settings content fields to standard static DOM elements
 */
function updateStandardSectionDOM(sec, el, s) {
  const c = sec.content;
  if (!c) return;

  switch (sec.id) {
    case 'hero': {
      const headlineEl = el.querySelector('.hero__title');
      if (headlineEl && c.headline) headlineEl.innerHTML = c.headline;
      const subtitleEl = el.querySelector('.hero__subtitle');
      if (subtitleEl && c.subtitle) subtitleEl.textContent = c.subtitle;
      const btn1 = el.querySelector('.hero__actions .btn-primary');
      if (btn1 && c.btn1_label) btn1.textContent = c.btn1_label;
      const btn2 = el.querySelector('.hero__actions .btn-secondary');
      if (btn2 && c.btn2_label) btn2.textContent = c.btn2_label;
      break;
    }
    case 'stats': {
      const cols = el.querySelectorAll('.grid-4 > div');
      if (cols.length >= 4) {
        for (let i = 0; i < 4; i++) {
          const valEl = cols[i].querySelector('div:first-child');
          const lblEl = cols[i].querySelector('div:last-child');
          if (valEl && c[`stat${i+1}_value`]) valEl.textContent = c[`stat${i+1}_value`];
          if (lblEl && c[`stat${i+1}_label`]) lblEl.textContent = c[`stat${i+1}_label`];
        }
      }
      break;
    }
    case 'rooms':
    case 'why-choose-us':
    case 'policies':
    case 'page-hero':
    case 'cta': {
      const headerLabel = el.querySelector('.section-header__label') || el.querySelector('.page-hero__label');
      const headerTitle = el.querySelector('.section-header__title') || el.querySelector('.page-hero__title');
      const headerSubtitle = el.querySelector('.section-header__subtitle') || el.querySelector('.page-hero__subtitle');

      if (headerLabel && c.label) headerLabel.textContent = c.label;
      if (headerTitle && c.title) headerTitle.textContent = c.title;
      if (headerSubtitle && c.subtitle) headerSubtitle.textContent = c.subtitle;

      if (sec.id === 'why-choose-us' && c.cards) {
        const cardsEls = el.querySelectorAll('.grid-3 > .card');
        c.cards.forEach((card, idx) => {
          if (cardsEls[idx]) {
            const iconEl = cardsEls[idx].querySelector('div:first-child');
            const titleEl = cardsEls[idx].querySelector('h4');
            const descEl = cardsEls[idx].querySelector('p');
            if (iconEl && card.icon) iconEl.textContent = card.icon;
            if (titleEl && card.title) titleEl.textContent = card.title;
            if (descEl && card.desc) descEl.textContent = card.desc;
          }
        });
      }

      if (sec.id === 'policies' && c.cards) {
        const cardsEls = el.querySelectorAll('.grid-3 > div');
        c.cards.forEach((card, idx) => {
          if (cardsEls[idx]) {
            const titleEl = cardsEls[idx].querySelector('h4');
            if (titleEl && card.title) titleEl.textContent = card.title;
            const listEl = cardsEls[idx].querySelector('ul');
            if (listEl && card.points) {
              listEl.innerHTML = card.points.map(p => `<li style="font-size:0.9rem;color:var(--text-secondary)">• ${p}</li>`).join('');
            }
          }
        });
      }

      if (sec.id === 'cta') {
        const btn = el.querySelector('.btn-primary');
        if (btn && c.btn_label) btn.textContent = c.btn_label;
      }
      break;
    }
    case 'contact-strip': {
      const titleEl = el.querySelector('h2');
      const descEl = el.querySelector('p');
      const btn1 = el.querySelector('.flex-center .btn-primary');
      const btn2 = el.querySelector('.flex-center .btn-secondary');

      if (titleEl && c.title) titleEl.textContent = c.title;
      if (descEl && c.desc) descEl.textContent = c.desc;
      if (btn1 && c.btn1_label) btn1.textContent = c.btn1_label;
      if (btn2 && c.btn2_label) btn2.textContent = c.btn2_label;
      break;
    }
    case 'contact-layout': {
      const titleEl = el.querySelector('h3');
      if (titleEl && c.title) titleEl.textContent = c.title;

      // Update address
      const addrValEl = el.querySelector('#contact-address');
      if (addrValEl && s.contact_address) {
        addrValEl.innerHTML = s.contact_address.replace(/\n/g, '<br/>');
      }

      // Update phone
      const phoneValEl = el.querySelector('#contact-phone');
      if (phoneValEl && s.contact_phone) {
        phoneValEl.textContent = s.contact_phone;
        phoneValEl.href = `tel:${s.contact_phone.replace(/[^+\d]/g, '')}`;
      }

      // Update email
      const emailValEl = el.querySelector('#contact-email');
      if (emailValEl && s.contact_email) {
        emailValEl.textContent = s.contact_email;
        emailValEl.href = `mailto:${s.contact_email}`;
      }

      // Update website
      const webValEl = el.querySelector('#contact-website');
      if (webValEl && s.contact_website) {
        webValEl.textContent = s.contact_website.replace(/^https?:\/\/(www\.)?/, '');
        webValEl.href = s.contact_website;
      }

      // Update office hours
      const hoursContainer = el.querySelector('#contact-office-hours');
      if (hoursContainer && c.hours) {
        const hoursTitle = hoursContainer.querySelector('h5');
        if (hoursTitle && c.hours_title) {
          hoursTitle.textContent = c.hours_title;
        }

        const listWrap = hoursContainer.querySelector('div');
        if (listWrap) {
          listWrap.innerHTML = c.hours.map(h => `
            <div style="display:flex;justify-content:space-between;font-size:0.875rem;color:${h.closed ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.75)'}">
              <span>${h.days}</span><span>${h.hours}</span>
            </div>
          `).join('');
        }

        hoursContainer.style.display = c.show_hours !== false ? '' : 'none';
      }
      break;
    }
    case 'map': {
      const titleEl = el.querySelector('h3');
      if (titleEl && c.title) titleEl.textContent = c.title;
      break;
    }
  }
}

/**
 * Standardize footers dynamically
 */
function updateFooterDOM(s) {
  if (s.contact_email) {
    const fEmailEl = document.getElementById('footer-email');
    if (fEmailEl) {
      fEmailEl.textContent = s.contact_email;
      fEmailEl.href = `mailto:${s.contact_email}`;
    }
  }
  if (s.contact_phone) {
    const fPhoneEl = document.getElementById('footer-phone');
    if (fPhoneEl) {
      fPhoneEl.textContent = s.contact_phone;
      fPhoneEl.href = `tel:${s.contact_phone.replace(/[^+\d]/g, '')}`;
    }
  }
  if (s.contact_address) {
    const fAddrEl = document.getElementById('footer-address');
    if (fAddrEl) {
      fAddrEl.textContent = s.contact_address.replace(/\n/g, ', ');
    }
  }
}
