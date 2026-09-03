import { Stats } from './stats.js';
import { StatsBuilder } from './stats.js';
import { HARBuilder } from './har.js';
import { applyPopupMode, getSettings, setSettings } from './settings.js';
import { buildFileName, filterHar, matchesStatsFilters, scrubHar, toCurlFromStatsEntry } from './export-utils.js';
import { t } from './i18n.js';

const PROTOCOL_VERSION = '1.3';
const sessions = new Map();
const persistTimers = new Map();
const recordingStore = chrome.storage.session ?? chrome.storage.local;

applyPopupMode();
chrome.runtime.onInstalled.addListener(() => {
  applyPopupMode();
});
chrome.runtime.onStartup.addListener(() => {
  applyPopupMode();
});

const canRecordUrl = (url) => Boolean(url?.startsWith('http://') || url?.startsWith('https://'));

const toPlainEntries = (entries) => Object.assign({}, entries);

const countEntries = (stats) => Object.keys(toPlainEntries(stats?.entries)).length;

const translate = async (key, params) => {
  const settings = await getSettings();
  return t(settings.locale, key, params);
};

const formatDebuggerError = async (error) => {
  const text = error instanceof Error ? error.message : String(error);
  if (/another debugger|already attached/i.test(text)) {
    return translate('errorDevtoolsOpen');
  }
  if (/cannot attach|not allowed|chrome:\/\//i.test(text)) {
    return translate('errorCannotAttach');
  }
  return text;
};

const setRecordingIcon = async (tabId, recording) => {
  await chrome.action.setBadgeText({ tabId, text: '' });
  if (recording) {
    await chrome.action.setIcon({ path: 'player_record.png' });
    await chrome.action.setTitle({ tabId, title: await translate('recordingTooltip') });
    return;
  }
  await chrome.action.setIcon({ path: 'icons8-record-16.png' });
  await chrome.action.setTitle({ tabId, title: await translate('idleTooltip') });
};

const setErrorBadge = async (tabId) => {
  await chrome.action.setBadgeBackgroundColor({ color: '#dc2626' });
  await chrome.action.setBadgeText({ tabId, text: '!' });
};

const persistSession = async (tabId) => {
  try {
    const session = sessions.get(tabId);
    const stored = await recordingStore.get({ recordings: {} });
    const recordings = stored.recordings ?? {};
    if (!session) {
      delete recordings[tabId];
    } else {
      recordings[tabId] = {
        recording: session.recording,
        startedAt: session.startedAt,
        elapsedMs: session.elapsedMs,
        host: session.host,
        url: session.url,
        entries: toPlainEntries(session.stats.entries),
      };
    }
    await recordingStore.set({ recordings });
  } catch (error) {
    console.error(error);
  }
};

const schedulePersist = (tabId) => {
  const timer = persistTimers.get(tabId);
  if (timer) {
    clearTimeout(timer);
  }
  persistTimers.set(
    tabId,
    setTimeout(() => {
      persistSession(tabId);
    }, 250),
  );
};

const restoreSessions = async () => {
  const stored = await recordingStore.get({ recordings: {} });
  let targets = [];
  try {
    targets = await chrome.debugger.getTargets();
  } catch {
    targets = [];
  }

  for (const [key, rec] of Object.entries(stored.recordings ?? {})) {
    const tabId = Number(key);
    const attached = targets.some((target) => target.tabId === tabId && target.attached);
    const stats = new Stats();
    stats.entries = rec.entries ?? {};
    sessions.set(tabId, {
      stats,
      recording: Boolean(rec.recording) && attached,
      startedAt: rec.startedAt ?? Date.now(),
      elapsedMs: rec.elapsedMs ?? 0,
      host: rec.host ?? '',
      url: rec.url ?? '',
    });
  }
};

const restoreSessionsReady = restoreSessions();

const getSession = (tabId) => sessions.get(tabId);

const elapsedNow = (session) => {
  if (!session) {
    return 0;
  }
  if (!session.recording) {
    return session.elapsedMs;
  }
  return session.elapsedMs + (Date.now() - session.startedAt);
};

const attachDebugger = async (tabId) => {
  const targets = await chrome.debugger.getTargets();
  const attached = targets.find((target) => target.tabId === tabId && target.attached);
  if (attached) {
    await new Promise((resolve, reject) => {
      chrome.debugger.sendCommand({ tabId }, 'Network.enable', {}, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve();
      });
    });
    return;
  }

  await new Promise((resolve, reject) => {
    chrome.debugger.attach({ tabId }, PROTOCOL_VERSION, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      chrome.debugger.sendCommand({ tabId }, 'Network.enable', {}, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve();
      });
    });
  });
};

const detachDebugger = (tabId) => {
  return new Promise((resolve) => {
    chrome.debugger.detach({ tabId }, () => {
      resolve();
    });
  });
};

const getActiveTab = async (tabId) => {
  if (typeof tabId === 'number') {
    return chrome.tabs.get(tabId);
  }
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tab;
};

const buildHarForSession = async (session) => {
  const settings = await getSettings();
  const har = new HARBuilder().create([session.stats], session.host || 'page');
  const filtered = filterHar(har, settings);
  return settings.scrub ? scrubHar(filtered) : filtered;
};

const lastCurl = async (session) => {
  const settings = await getSettings();
  const entries = Object.values(toPlainEntries(session.stats.entries));
  const withUrl = [...entries].reverse().filter((entry) => entry.requestParams?.request?.url);
  const selected = withUrl.find((entry) => matchesStatsFilters(entry, settings)) ?? withUrl[0];

  if (!selected) {
    throw new Error(await translate('errorNoCurl'));
  }

  const curl = toCurlFromStatsEntry(selected, settings.scrub);
  if (!curl) {
    throw new Error(await translate('errorCurlBuild'));
  }
  return curl;
};

const getStateForTab = async (tab) => {
  const settings = await getSettings();
  if (!tab?.id) {
    return {
      ...settings,
      recording: false,
      requestCount: 0,
      durationMs: 0,
      hasData: false,
      canRecord: false,
      tabId: null,
    };
  }

  const session = getSession(tab.id);
  return {
    ...settings,
    recording: Boolean(session?.recording),
    requestCount: countEntries(session?.stats),
    durationMs: elapsedNow(session),
    hasData: countEntries(session?.stats) > 0,
    canRecord: canRecordUrl(tab.url),
    tabTitle: tab.title ?? '',
    tabUrl: tab.url ?? '',
    tabId: tab.id,
  };
};

const startRecording = async (tab) => {
  if (!tab?.id) {
    throw new Error(await translate('errorNoTab'));
  }
  if (!canRecordUrl(tab.url)) {
    throw new Error(await translate('errorHttpOnly'));
  }

  let session = getSession(tab.id);
  if (!session) {
    session = {
      stats: new Stats(),
      recording: false,
      startedAt: Date.now(),
      elapsedMs: 0,
      host: '',
      url: tab.url ?? '',
    };
    sessions.set(tab.id, session);
  }

  session.url = tab.url ?? session.url;
  try {
    session.host = new URL(session.url).host;
  } catch {
    session.host = 'page';
  }

  try {
    await attachDebugger(tab.id);
  } catch (error) {
    await setErrorBadge(tab.id);
    throw new Error(await formatDebuggerError(error));
  }

  session.recording = true;
  session.startedAt = Date.now();
  await persistSession(tab.id);
  await setRecordingIcon(tab.id, true);
};

const stopRecording = async (tab) => {
  if (!tab?.id) {
    throw new Error(await translate('errorNoTab'));
  }
  const session = getSession(tab.id);
  if (session?.recording) {
    session.elapsedMs = elapsedNow(session);
    session.recording = false;
    await persistSession(tab.id);
  }
  await detachDebugger(tab.id);
  await setRecordingIcon(tab.id, false);
};

const clearRecording = async (tab) => {
  if (!tab?.id) {
    throw new Error(await translate('errorNoTab'));
  }
  const session = getSession(tab.id);
  if (session?.recording) {
    await detachDebugger(tab.id);
  }
  sessions.delete(tab.id);
  await persistSession(tab.id);
  await setRecordingIcon(tab.id, false);
};

const exportHar = async (tab) => {
  if (!tab?.id) {
    throw new Error(await translate('errorNoTab'));
  }
  const session = getSession(tab.id);
  if (!session || countEntries(session.stats) === 0) {
    throw new Error(await translate('errorNoRequests'));
  }
  const settings = await getSettings();
  const har = await buildHarForSession(session);
  if (har.log.entries.length === 0) {
    throw new Error(await translate('errorFilteredEmpty'));
  }
  const fileName = buildFileName(settings.filename, session.host);
  return { har, fileName };
};

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await restoreSessionsReady;
  const session = getSession(activeInfo.tabId);
  await setRecordingIcon(activeInfo.tabId, Boolean(session?.recording));
});

chrome.debugger.onEvent.addListener((debuggeeId, method, params) => {
  const tabId = debuggeeId.tabId;
  if (tabId === undefined) {
    return;
  }
  const session = getSession(tabId);
  if (!session?.recording) {
    return;
  }

  StatsBuilder.processEvent(session.stats, { method, params });
  schedulePersist(tabId);

  if (method !== 'Network.loadingFinished') {
    return;
  }

  chrome.debugger.sendCommand(
    { tabId },
    'Network.getResponseBody',
    { requestId: params.requestId },
    (responseBodyParams) => {
      if (chrome.runtime.lastError || !responseBodyParams) {
        return;
      }
      const { body, base64Encoded } = responseBodyParams;
      StatsBuilder.processEvent(session.stats, {
        method: 'Network.getResponseBody',
        params: { requestId: params.requestId, body, base64Encoded },
      });
      schedulePersist(tabId);
    },
  );
});

chrome.debugger.onDetach.addListener(async (debuggeeId) => {
  const tabId = debuggeeId.tabId;
  if (tabId === undefined) {
    return;
  }
  const session = getSession(tabId);
  if (!session?.recording) {
    return;
  }
  session.elapsedMs = elapsedNow(session);
  session.recording = false;
  await persistSession(tabId);
  await setRecordingIcon(tabId, false);
});

chrome.action.onClicked.addListener(async (tab) => {
  try {
    await restoreSessionsReady;
    const session = tab.id ? getSession(tab.id) : undefined;
    if (session?.recording) {
      await stopRecording(tab);
      return;
    }
    await startRecording(tab);
  } catch (error) {
    console.error(error);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const handleMessage = async () => {
    await restoreSessionsReady;
    const tab = await getActiveTab(message?.tabId);

    if (message?.type === 'GET_STATE') {
      return getStateForTab(tab);
    }
    if (message?.type === 'START') {
      await startRecording(tab);
      return getStateForTab(tab);
    }
    if (message?.type === 'STOP') {
      await stopRecording(tab);
      const settings = await getSettings();
      if (!settings.autoExportOnStop) {
        return getStateForTab(tab);
      }
      try {
        const download = await exportHar(tab);
        return { ...(await getStateForTab(tab)), download };
      } catch {
        return getStateForTab(tab);
      }
    }
    if (message?.type === 'CLEAR') {
      await clearRecording(tab);
      return getStateForTab(tab);
    }
    if (message?.type === 'EXPORT') {
      const download = await exportHar(tab);
      return { ...(await getStateForTab(tab)), download };
    }
    if (message?.type === 'COPY_CURL') {
      const session = tab?.id ? getSession(tab.id) : undefined;
      if (!session) {
        throw new Error(await translate('errorNoRequests'));
      }
      const curl = await lastCurl(session);
      return { ...(await getStateForTab(tab)), curl };
    }
    if (message?.type === 'SET_SETTINGS') {
      await setSettings(message.patch ?? {});
      return getStateForTab(tab);
    }
    throw new Error(await translate('errorUnknownMessage'));
  };

  handleMessage()
    .then(sendResponse)
    .catch(async (error) => {
      sendResponse({ error: await formatDebuggerError(error) });
    });
  return true;
});
