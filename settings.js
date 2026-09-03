export const OPEN_POPUP_KEY = 'openPopupOnClick';

const DEFAULTS = {
  openPopupOnClick: true,
  theme: 'dark',
  filename: 'network-log',
  scrub: true,
  xhrOnly: true,
  errorsOnly: false,
  skipBodies: false,
  autoExportOnStop: false,
  urlContains: '',
  locale: 'ru',
};

export const getSettings = async () => {
  const result = await chrome.storage.local.get(DEFAULTS);
  return {
    openPopupOnClick: result.openPopupOnClick !== false,
    theme: result.theme === 'light' ? 'light' : 'dark',
    filename: typeof result.filename === 'string' && result.filename.trim()
      ? result.filename.trim()
      : DEFAULTS.filename,
    scrub: result.scrub !== false,
    xhrOnly: result.xhrOnly !== false,
    errorsOnly: result.errorsOnly === true,
    skipBodies: result.skipBodies === true,
    autoExportOnStop: result.autoExportOnStop === true,
    urlContains: typeof result.urlContains === 'string' ? result.urlContains : '',
    locale: result.locale === 'en' ? 'en' : 'ru',
  };
};

export const setSettings = async (patch) => {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await chrome.storage.local.set(next);
  await chrome.action.setPopup({ popup: next.openPopupOnClick ? 'popup.html' : '' });
  return next;
};

export const getOpenPopupOnClick = async () => {
  const settings = await getSettings();
  return settings.openPopupOnClick;
};

export const setOpenPopupOnClick = async (openPopup) => {
  return setSettings({ openPopupOnClick: openPopup });
};

export const applyPopupMode = async () => {
  const settings = await getSettings();
  await chrome.action.setPopup({ popup: settings.openPopupOnClick ? 'popup.html' : '' });
  return settings.openPopupOnClick;
};
