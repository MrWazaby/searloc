import i18next from 'i18next';
import HttpApi from 'i18next-http-backend';
import langDetect from 'i18next-browser-languagedetector';

export function translateApp() {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(elem => {
    const key = elem.getAttribute('data-i18n') ?? "";
    elem.innerHTML = i18next.t(key);
  });
  const input = document.querySelector('input[name="q"]');
  if (input) {
    input.setAttribute('placeholder', i18next.t('search_placeholder'));
  }
}

export function initI18n() {
  i18next
  .use(HttpApi)
  .use(langDetect)
  .init({
    supportedLngs: ['en', 'fr'],
    fallbackLng: 'en',
    backend: {
      loadPath: '/locales/{{lng}}/translation.json'
    }
  }, translateApp);
}

