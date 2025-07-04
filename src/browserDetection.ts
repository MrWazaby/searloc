import i18next from 'i18next';

export enum Browser {
  Chrome = 'chrome',
  Firefox = 'firefox',
  Safari = 'safari',
  Edge = 'edge',
  Opera = 'opera',
  Unknown = 'unknown'
}

export interface BrowserGuide {
  browser: Browser;
  steps: string[];
}

/**
 * Detects the current browser
 */
export function detectBrowser(): Browser {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('edg/')) {
    return Browser.Edge;
  }
  if (userAgent.includes('opr/') || userAgent.includes('opera/')) {
    return Browser.Opera;
  }
  if (userAgent.includes('chrome/') && !userAgent.includes('edg/')) {
    return Browser.Chrome;
  }
  if (userAgent.includes('firefox/')) {
    return Browser.Firefox;
  }
  if (userAgent.includes('safari/') && !userAgent.includes('chrome/')) {
    return Browser.Safari;
  }
  
  return Browser.Unknown;
}

/**
 * Gets the browser-specific guide for adding as search engine
 */
export function getBrowserGuide(browser: Browser): BrowserGuide {
  const baseUrl = window.location.origin;
  const guides: Record<Browser, BrowserGuide> = {
    [Browser.Chrome]: {
      browser: Browser.Chrome,
      steps: [
        i18next.t('search_engine_guide.chrome.step1'),
        i18next.t('search_engine_guide.chrome.step2'),
        i18next.t('search_engine_guide.chrome.step3'),
        i18next.t('search_engine_guide.chrome.step4'),
        i18next.t('search_engine_guide.chrome.step5', { baseUrl }),
        i18next.t('search_engine_guide.chrome.step6'),
        i18next.t('search_engine_guide.chrome.step7'),
      ]
    },
    [Browser.Firefox]: {
      browser: Browser.Firefox,
      steps: [
        i18next.t('search_engine_guide.firefox.step1'),
        i18next.t('search_engine_guide.firefox.step2'),
        i18next.t('search_engine_guide.firefox.step3'),
        i18next.t('search_engine_guide.firefox.step4'),
        i18next.t('search_engine_guide.firefox.step5'),
        i18next.t('search_engine_guide.firefox.step6'),
        i18next.t('search_engine_guide.firefox.step7'),
      ]
    },
    [Browser.Safari]: {
      browser: Browser.Safari,
      steps: [
        i18next.t('search_engine_guide.safari.step1'),
        i18next.t('search_engine_guide.safari.step2'),
        i18next.t('search_engine_guide.safari.step3'),
        i18next.t('search_engine_guide.safari.step4'),
        i18next.t('search_engine_guide.safari.step5'),
      ]
    },
    [Browser.Edge]: {
      browser: Browser.Edge,
      steps: [
        i18next.t('search_engine_guide.edge.step1'),
        i18next.t('search_engine_guide.edge.step2'),
        i18next.t('search_engine_guide.edge.step3'),
        i18next.t('search_engine_guide.edge.step4'),
        i18next.t('search_engine_guide.edge.step5', { baseUrl }),
        i18next.t('search_engine_guide.edge.step6'),
        i18next.t('search_engine_guide.edge.step7'),
      ]
    },
    [Browser.Opera]: {
      browser: Browser.Opera,
      steps: [
        i18next.t('search_engine_guide.opera.step1'),
        i18next.t('search_engine_guide.opera.step2'),
        i18next.t('search_engine_guide.opera.step3'),
        i18next.t('search_engine_guide.opera.step4', { baseUrl }),
        i18next.t('search_engine_guide.opera.step5'),
        i18next.t('search_engine_guide.opera.step6'),
      ]
    },
    [Browser.Unknown]: {
      browser: Browser.Unknown,
      steps: [
        i18next.t('search_engine_guide.unknown.step1'),
        i18next.t('search_engine_guide.unknown.step2', { baseUrl }),
      ]
    }
  };
  
  return guides[browser];
}

/**
 * Renders the browser guide content
 */
export function renderBrowserGuide(guide: BrowserGuide): string {
  const browserName = i18next.t(`search_engine_guide.browser_names.${guide.browser}`);
  const steps = guide.steps
    .map((step) => `<li>${step}</li>`)
    .join('');
  
  return `
    <div class="browser-guide">
      <h3>${i18next.t('search_engine_guide.title')} ${browserName}</h3>
      <ol class="guide-steps">
        ${steps}
      </ol>
    </div>
  `;
}

/**
 * Initializes the search engine guide modal
 */
export function initSearchEngineModal(): void {
  const modal = document.getElementById('search-engine-modal');
  const openBtn = document.getElementById('open-search-engine-guide');
  const closeBtn = document.getElementById('close-search-engine-modal');
  const modalContent = document.getElementById('search-engine-modal-content');
  
  if (!modal || !openBtn || !closeBtn || !modalContent) {
    return;
  }
  
  // Open modal
  openBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const browser = detectBrowser();
    const guide = getBrowserGuide(browser);
    const guideHtml = renderBrowserGuide(guide);
    modalContent.innerHTML = guideHtml;
    modal.style.display = 'block';
  });
  
  // Close modal
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
}