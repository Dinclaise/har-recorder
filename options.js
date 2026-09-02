import { getSettings, setSettings } from './settings.js';

const openPopupInput = document.querySelector('#open-popup');
const themeInput = document.querySelector('#theme-light');

if (
  !(openPopupInput instanceof HTMLInputElement) ||
  !(themeInput instanceof HTMLInputElement)
) {
  throw new Error('В параметрах не найдены переключатели');
}

const settings = await getSettings();
openPopupInput.checked = settings.openPopupOnClick;
themeInput.checked = settings.theme === 'light';
document.documentElement.dataset.theme = settings.theme;

openPopupInput.addEventListener('change', async () => {
  await setSettings({ openPopupOnClick: openPopupInput.checked });
});

themeInput.addEventListener('change', async () => {
  const theme = themeInput.checked ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  await setSettings({ theme });
});
