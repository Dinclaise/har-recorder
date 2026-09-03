import { getSettings, setSettings } from './settings.js';
import { applyTranslations } from './i18n.js';

const openPopupInput = document.querySelector('#open-popup');
const themeInput = document.querySelector('#theme-light');
const localeInput = document.querySelector('#locale-en');

if (
  !(openPopupInput instanceof HTMLInputElement) ||
  !(themeInput instanceof HTMLInputElement) ||
  !(localeInput instanceof HTMLInputElement)
) {
  throw new Error('Settings markup is missing the toggles');
}

const applyLocale = (locale) => {
  applyTranslations(document, locale);
};

const settings = await getSettings();
openPopupInput.checked = settings.openPopupOnClick;
themeInput.checked = settings.theme === 'light';
localeInput.checked = settings.locale === 'en';
document.documentElement.dataset.theme = settings.theme;
applyLocale(settings.locale);

openPopupInput.addEventListener('change', async () => {
  await setSettings({ openPopupOnClick: openPopupInput.checked });
});

themeInput.addEventListener('change', async () => {
  const theme = themeInput.checked ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  await setSettings({ theme });
});

localeInput.addEventListener('change', async () => {
  const locale = localeInput.checked ? 'en' : 'ru';
  applyLocale(locale);
  await setSettings({ locale });
});
