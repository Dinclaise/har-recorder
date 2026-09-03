import { applyTranslations, formatRequestCount, t } from './i18n.js';

const themeButton = document.querySelector('#theme');
const themeIcon = document.querySelector('#theme-icon');
const localeButton = document.querySelector('#locale');
const localeLabel = document.querySelector('#locale-label');
const pill = document.querySelector('#pill');
const pillText = document.querySelector('#pill-text');
const requestCount = document.querySelector('#request-count');
const durationNode = document.querySelector('#duration');
const startButton = document.querySelector('#start');
const stopButton = document.querySelector('#stop');
const exportButton = document.querySelector('#export');
const curlButton = document.querySelector('#copy-curl');
const clearButton = document.querySelector('#clear');
const filenameInput = document.querySelector('#filename');
const scrubInput = document.querySelector('#scrub');
const xhrOnlyInput = document.querySelector('#xhr-only');
const errorsOnlyInput = document.querySelector('#errors-only');
const skipBodiesInput = document.querySelector('#skip-bodies');
const autoExportInput = document.querySelector('#auto-export');
const urlContainsInput = document.querySelector('#url-contains');
const openPopupInput = document.querySelector('#open-popup');
const banner = document.querySelector('#banner');
const bannerDot = document.querySelector('#banner-dot');
const bannerTitle = document.querySelector('#banner-title');
const bannerText = document.querySelector('#banner-text');
const errorNode = document.querySelector('#error');

const required = [
  themeButton,
  themeIcon,
  localeButton,
  localeLabel,
  pill,
  pillText,
  requestCount,
  durationNode,
  startButton,
  stopButton,
  exportButton,
  curlButton,
  clearButton,
  filenameInput,
  scrubInput,
  xhrOnlyInput,
  errorsOnlyInput,
  skipBodiesInput,
  autoExportInput,
  urlContainsInput,
  openPopupInput,
  banner,
  bannerDot,
  bannerTitle,
  bannerText,
  errorNode,
];

if (required.some((node) => !(node instanceof HTMLElement))) {
  throw new Error('Popup markup is missing required elements');
}

let currentLocale = 'ru';
let stickyError = '';
let flashTitle = '';
let flashText = '';
let flashUntil = 0;

const sendMessage = async (message) => {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  let response;
  try {
    response = await chrome.runtime.sendMessage({
      ...message,
      tabId: tab?.id,
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
  if (!response) {
    throw new Error(t(currentLocale, 'errorBackgroundDown'));
  }
  if (response.error) {
    throw new Error(response.error);
  }
  return response;
};

const showError = (message) => {
  stickyError = message;
  if (!message) {
    errorNode.hidden = true;
    errorNode.textContent = '';
    return;
  }
  errorNode.hidden = false;
  errorNode.textContent = message;
};

const setFlash = (title, text) => {
  flashTitle = title;
  flashText = text;
  flashUntil = Date.now() + 4000;
};

const formatDuration = (ms) => {
  const total = Math.max(0, Math.floor((ms ?? 0) / 1000));
  const minutes = String(Math.floor(total / 60)).padStart(2, '0');
  const seconds = String(total % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const formatRequestLabel = (count) => formatRequestCount(currentLocale, count);

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  themeIcon.textContent = theme === 'light' ? '☀️' : '🌙';
};

const downloadHar = (har, fileName) => {
  const blob = new Blob([JSON.stringify(har, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand('copy');
    area.remove();
    if (!copied) {
      throw new Error(t(currentLocale, 'errorClipboard'));
    }
  }
};

const setBanner = ({ live, title, text }) => {
  banner.hidden = false;
  banner.classList.toggle('banner--live', live);
  bannerDot.hidden = !live;
  bannerTitle.textContent = title;
  bannerText.textContent = text;
};

const render = (state) => {
  currentLocale = state.locale === 'en' ? 'en' : 'ru';
  applyTranslations(document, currentLocale);
  localeLabel.textContent = currentLocale === 'en' ? 'RU' : 'EN';
  applyTheme(state.theme);
  requestCount.textContent = String(state.requestCount ?? 0);
  durationNode.textContent = formatDuration(state.durationMs);
  openPopupInput.checked = state.openPopupOnClick !== false;
  scrubInput.checked = state.scrub !== false;
  xhrOnlyInput.checked = state.xhrOnly !== false;
  errorsOnlyInput.checked = state.errorsOnly === true;
  skipBodiesInput.checked = state.skipBodies === true;
  autoExportInput.checked = state.autoExportOnStop === true;
  if (document.activeElement !== urlContainsInput) {
    urlContainsInput.value = state.urlContains ?? '';
  }
  if (document.activeElement !== filenameInput) {
    filenameInput.value = state.filename ?? 'network-log';
  }

  startButton.disabled = Boolean(state.recording);
  stopButton.disabled = !state.recording;
  exportButton.disabled = !state.hasData;
  curlButton.disabled = !state.hasData;
  clearButton.disabled = !state.hasData && !state.recording;

  pill.classList.toggle('pill--live', Boolean(state.recording));
  if (stickyError) {
    errorNode.hidden = false;
    errorNode.textContent = stickyError;
  }

  if (Date.now() < flashUntil && flashTitle) {
    setBanner({ live: false, title: flashTitle, text: flashText });
    return;
  }

  if (state.recording) {
    pillText.textContent = t(currentLocale, 'pillRecording');
    const count = state.requestCount ?? 0;
    setBanner({
      live: true,
      title: t(currentLocale, 'recordingTitle'),
      text:
        count === 0
          ? t(currentLocale, 'recordingEmpty')
          : t(currentLocale, 'recordingCaught', { count: formatRequestLabel(count) }),
    });
    return;
  }

  pillText.textContent = t(currentLocale, 'pillReady');
  if (state.hasData) {
    setBanner({
      live: false,
      title: t(currentLocale, 'exportReadyTitle'),
      text: t(currentLocale, 'exportReadyText', {
        count: formatRequestLabel(state.requestCount ?? 0),
      }),
    });
    return;
  }

  banner.hidden = true;
};

const withBusy = async (button, task) => {
  button.disabled = true;
  try {
    const state = await task();
    if (state) {
      render(state);
    }
  } catch (error) {
    showError(error instanceof Error ? error.message : String(error));
  } finally {
    const state = await sendMessage({ type: 'GET_STATE' }).catch(() => null);
    if (state) {
      render(state);
    }
  }
};

const refresh = async () => {
  try {
    const state = await sendMessage({ type: 'GET_STATE' });
    render(state);
  } catch (error) {
    showError(error instanceof Error ? error.message : String(error));
  }
};

startButton.addEventListener('click', () => {
  showError('');
  withBusy(startButton, () => sendMessage({ type: 'START' }));
});

stopButton.addEventListener('click', () => {
  withBusy(stopButton, async () => {
    const result = await sendMessage({ type: 'STOP' });
    if (result.download?.har && result.download.fileName) {
      downloadHar(result.download.har, result.download.fileName);
    }
    return result;
  });
});

exportButton.addEventListener('click', () => {
  withBusy(exportButton, async () => {
    const result = await sendMessage({ type: 'EXPORT' });
    if (result.download?.har && result.download.fileName) {
      downloadHar(result.download.har, result.download.fileName);
    }
    return result;
  });
});

curlButton.addEventListener('click', () => {
  withBusy(curlButton, async () => {
    const result = await sendMessage({ type: 'COPY_CURL' });
    if (!result.curl) {
      throw new Error(t(currentLocale, 'errorCurlEmpty'));
    }
    await copyText(result.curl);
    setFlash(t(currentLocale, 'curlCopiedTitle'), t(currentLocale, 'curlCopiedText'));
    return result;
  });
});

clearButton.addEventListener('click', () => {
  withBusy(clearButton, () => sendMessage({ type: 'CLEAR' }));
});

themeButton.addEventListener('click', async () => {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  applyTheme(next);
  await sendMessage({ type: 'SET_SETTINGS', patch: { theme: next } });
});

localeButton.addEventListener('click', async () => {
  const next = currentLocale === 'en' ? 'ru' : 'en';
  currentLocale = next;
  applyTranslations(document, next);
  localeLabel.textContent = next === 'en' ? 'RU' : 'EN';
  await sendMessage({ type: 'SET_SETTINGS', patch: { locale: next } });
  await refresh();
});

filenameInput.addEventListener('change', async () => {
  await sendMessage({
    type: 'SET_SETTINGS',
    patch: { filename: filenameInput.value.trim() || 'network-log' },
  });
});

scrubInput.addEventListener('change', async () => {
  await sendMessage({ type: 'SET_SETTINGS', patch: { scrub: scrubInput.checked } });
});

xhrOnlyInput.addEventListener('change', async () => {
  await sendMessage({ type: 'SET_SETTINGS', patch: { xhrOnly: xhrOnlyInput.checked } });
});

errorsOnlyInput.addEventListener('change', async () => {
  await sendMessage({ type: 'SET_SETTINGS', patch: { errorsOnly: errorsOnlyInput.checked } });
});

skipBodiesInput.addEventListener('change', async () => {
  await sendMessage({ type: 'SET_SETTINGS', patch: { skipBodies: skipBodiesInput.checked } });
});

autoExportInput.addEventListener('change', async () => {
  await sendMessage({
    type: 'SET_SETTINGS',
    patch: { autoExportOnStop: autoExportInput.checked },
  });
});

urlContainsInput.addEventListener('change', async () => {
  await sendMessage({
    type: 'SET_SETTINGS',
    patch: { urlContains: urlContainsInput.value.trim() },
  });
});

openPopupInput.addEventListener('change', async () => {
  await sendMessage({
    type: 'SET_SETTINGS',
    patch: { openPopupOnClick: openPopupInput.checked },
  });
  if (!openPopupInput.checked) {
    window.close();
  }
});

refresh();
window.setInterval(() => {
  refresh();
}, 800);
