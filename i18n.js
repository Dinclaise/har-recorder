export const normalizeLocale = (locale) => (locale === 'en' ? 'en' : 'ru');

const translations = {
  ru: {
    subtitle: 'ЭКСПОРТ HAR',
    themeTitle: 'Сменить тему',
    localeTitle: 'Switch to English',
    pillReady: 'ГОТОВ',
    pillRecording: 'ЗАПИСЬ',
    statsRequests: 'ЗАПРОСЫ',
    statsDuration: 'ДЛИТЕЛЬНОСТЬ',
    start: '▶ Начать запись',
    stop: '■ Стоп',
    exportOptions: 'Параметры экспорта',
    filename: 'ИМЯ ФАЙЛА',
    filenameHint: 'К имени автоматически добавится дата и время',
    scrubTitle: 'Очищать секреты',
    scrubHint: 'Токены, cookie и пароли заменяются на [REDACTED]',
    xhrTitle: 'Только XHR и Fetch',
    xhrHint: 'В HAR не попадут картинки, CSS и шрифты',
    moreSettings: 'Ещё настройки',
    errorsTitle: 'Только ошибки 4xx/5xx',
    errorsHint: 'В экспорт попадут лишь упавшие запросы',
    skipBodiesTitle: 'Без тел ответов',
    skipBodiesHint: 'HAR легче, удобнее слать в тикет',
    autoExportTitle: 'Скачивать HAR при стопе',
    autoExportHint: 'Не нужно отдельно жать «Экспорт»',
    urlContains: 'URL содержит',
    urlContainsHint: 'Оставьте пустым, чтобы не фильтровать по адресу',
    exportHar: '⬇ Экспорт HAR',
    curl: 'cURL',
    curlTitle:
      'Копирует последний запрос как команду curl: можно сразу повторить в терминале или вставить в тикет',
    curlHint:
      'cURL копирует последний запрос в буфер как команду. Её можно сразу выполнить в терминале или вставить в тикет, не открывая HAR.',
    clear: 'Очистить',
    disclaimer:
      'HAR содержит <strong>пароли, токены и cookie</strong>. Не отправляйте файл в общий чат без очистки секретов.',
    openPopup: 'Открывать панель при клике',
    footer: 'v1.5 · HAR 1.2 · Данные остаются локально',
    recordingTitle: 'Идёт запись',
    recordingEmpty: 'Обновите страницу или вызовите API — запросы появятся здесь',
    recordingCaught: 'Поймали {count}',
    exportReadyTitle: 'Готово к экспорту',
    exportReadyText: 'Снято {count}. Можно скачать HAR или cURL.',
    curlCopiedTitle: 'cURL скопирован',
    curlCopiedText: 'Вставьте в терминал или в тикет',
    requestOne: '{count} запрос',
    requestFew: '{count} запроса',
    requestMany: '{count} запросов',
    recordingTooltip: 'Идёт запись сети',
    idleTooltip: 'HAR Recorder',
    optionsSubtitle: 'ПАРАМЕТРЫ',
    optionsOpenPopup: 'Открывать панель при клике по иконке',
    optionsLightTheme: 'Светлая тема',
    optionsHint: 'Если панель выключена, клик сразу включает или останавливает запись.',
    errorMissingNodes: 'В popup не найдены нужные элементы',
    errorBackgroundDown:
      'Фон расширения не отвечает. Обновите HAR Recorder на chrome://extensions',
    errorClipboard: 'Не удалось скопировать cURL. Разрешите буфер обмена для расширения',
    errorCurlEmpty: 'Не удалось собрать cURL',
    errorNoTab: 'Нет активной вкладки',
    errorHttpOnly: 'Запись доступна только на обычных http/https страницах',
    errorNoRequests: 'Пока нет записанных запросов',
    errorFilteredEmpty: 'После фильтров запросов не осталось. Ослабьте настройки в аккордеоне',
    errorNoCurl: 'Нет запросов для cURL. Походите по странице и нажмите Стоп',
    errorCurlBuild: 'Не удалось собрать cURL из последнего запроса',
    errorUnknownMessage: 'Неизвестное сообщение',
    errorDevtoolsOpen:
      'Закройте DevTools на этой вкладке и нажмите «Начать запись» ещё раз',
    errorCannotAttach:
      'Эту страницу нельзя записывать. Откройте обычный http/https сайт',
    errorDebugger: '{message}',
    errorOptionsNodes: 'В параметрах не найдены переключатели',
  },
  en: {
    subtitle: 'HAR EXPORT',
    themeTitle: 'Toggle theme',
    localeTitle: 'Переключить на русский',
    pillReady: 'READY',
    pillRecording: 'REC',
    statsRequests: 'REQUESTS',
    statsDuration: 'DURATION',
    start: '▶ Start recording',
    stop: '■ Stop',
    exportOptions: 'Export options',
    filename: 'FILENAME',
    filenameHint: 'Date and time are appended to the filename automatically',
    scrubTitle: 'Scrub secrets',
    scrubHint: 'Tokens, cookies and passwords become [REDACTED]',
    xhrTitle: 'XHR and Fetch only',
    xhrHint: 'Images, CSS and fonts stay out of the HAR',
    moreSettings: 'More settings',
    errorsTitle: 'Errors 4xx/5xx only',
    errorsHint: 'Export failed requests only',
    skipBodiesTitle: 'Skip response bodies',
    skipBodiesHint: 'Smaller HAR, easier to attach to a ticket',
    autoExportTitle: 'Download HAR on stop',
    autoExportHint: 'No extra Export click',
    urlContains: 'URL contains',
    urlContainsHint: 'Leave empty to skip URL filtering',
    exportHar: '⬇ Export HAR',
    curl: 'cURL',
    curlTitle:
      'Copies the last request as a curl command you can run in a terminal or paste into a ticket',
    curlHint:
      'cURL copies the last request to the clipboard as a command. Run it in a terminal or paste it into a ticket without opening the HAR.',
    clear: 'Clear',
    disclaimer:
      'HAR files contain <strong>passwords, tokens and cookies</strong>. Do not share them publicly without scrubbing secrets.',
    openPopup: 'Open panel on click',
    footer: 'v1.5 · HAR 1.2 · All data stays local',
    recordingTitle: 'Recording',
    recordingEmpty: 'Reload the page or call an API — requests will show up here',
    recordingCaught: 'Captured {count}',
    exportReadyTitle: 'Ready to export',
    exportReadyText: 'Captured {count}. You can download HAR or copy cURL.',
    curlCopiedTitle: 'cURL copied',
    curlCopiedText: 'Paste it into a terminal or a ticket',
    requestOne: '{count} request',
    requestFew: '{count} requests',
    requestMany: '{count} requests',
    recordingTooltip: 'Recording network traffic',
    idleTooltip: 'HAR Recorder',
    optionsSubtitle: 'SETTINGS',
    optionsOpenPopup: 'Open the panel when clicking the icon',
    optionsLightTheme: 'Light theme',
    optionsHint: 'If the panel is off, the icon click starts or stops recording immediately.',
    errorMissingNodes: 'Popup markup is missing required elements',
    errorBackgroundDown:
      'The extension background is not responding. Reload HAR Recorder on chrome://extensions',
    errorClipboard: 'Could not copy cURL. Allow clipboard access for the extension',
    errorCurlEmpty: 'Could not build a cURL command',
    errorNoTab: 'No active tab',
    errorHttpOnly: 'Recording works only on regular http/https pages',
    errorNoRequests: 'No captured requests yet',
    errorFilteredEmpty: 'Filters removed every request. Loosen the extra settings',
    errorNoCurl: 'No requests for cURL. Browse the page and press Stop',
    errorCurlBuild: 'Could not build cURL from the last request',
    errorUnknownMessage: 'Unknown message',
    errorDevtoolsOpen: 'Close DevTools on this tab and press Start recording again',
    errorCannotAttach: 'This page cannot be recorded. Open a regular http/https site',
    errorDebugger: '{message}',
    errorOptionsNodes: 'Settings markup is missing the toggles',
  },
};

export const t = (locale, key, params = {}) => {
  const table = translations[normalizeLocale(locale)];
  let text = table[key] ?? translations.ru[key] ?? key;
  for (const [name, value] of Object.entries(params)) {
    text = text.replaceAll(`{${name}}`, String(value));
  }
  return text;
};

export const formatRequestCount = (locale, count) => {
  if (normalizeLocale(locale) === 'en') {
    return t(locale, count === 1 ? 'requestOne' : 'requestMany', { count });
  }

  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return t(locale, 'requestOne', { count });
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return t(locale, 'requestFew', { count });
  }
  return t(locale, 'requestMany', { count });
};

export const applyTranslations = (root, locale) => {
  document.documentElement.lang = normalizeLocale(locale);

  for (const node of root.querySelectorAll('[data-i18n]')) {
    node.textContent = t(locale, node.dataset.i18n ?? '');
  }
  for (const node of root.querySelectorAll('[data-i18n-html]')) {
    node.innerHTML = t(locale, node.dataset.i18nHtml ?? '');
  }
  for (const node of root.querySelectorAll('[data-i18n-title]')) {
    node.title = t(locale, node.dataset.i18nTitle ?? '');
  }
  for (const node of root.querySelectorAll('[data-i18n-placeholder]')) {
    node.placeholder = t(locale, node.dataset.i18nPlaceholder ?? '');
  }
};
