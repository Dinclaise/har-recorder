const SENSITIVE_HEADER =
  /^(cookie|set-cookie|set-cookie2|cookie2|authorization|proxy-authorization|x-api-key|x-auth-token|x-csrf-token|x-access-token|authentication|x-session)$/i;

const COOKIE_HEADER = /cookie/i;

const SENSITIVE_FIELD =
  /^(password|passwd|pass|token|access_token|refresh_token|id_token|client_secret|api[_-]?key|authorization|cookie|session|jwt|secret)$/i;

const REDACTED = '[REDACTED]';

export const isSensitiveHeaderName = (name) =>
  SENSITIVE_HEADER.test(name) || COOKIE_HEADER.test(name);

const scrubHeader = (header) => {
  if (isSensitiveHeaderName(header.name)) {
    return { ...header, value: REDACTED };
  }
  return header;
};

const scrubNameValue = (pair) => {
  if (SENSITIVE_FIELD.test(pair.name)) {
    return { ...pair, value: REDACTED };
  }
  return pair;
};

const scrubUrl = (rawUrl) => {
  try {
    const url = new URL(rawUrl);
    for (const key of [...url.searchParams.keys()]) {
      if (SENSITIVE_FIELD.test(key)) {
        url.searchParams.set(key, REDACTED);
      }
    }
    return url.toString();
  } catch {
    return rawUrl;
  }
};

const scrubJson = (value) => {
  if (Array.isArray(value)) {
    return value.map(scrubJson);
  }
  if (typeof value !== 'object' || value === null) {
    return value;
  }

  const next = {};
  for (const [key, nested] of Object.entries(value)) {
    next[key] = SENSITIVE_FIELD.test(key) ? REDACTED : scrubJson(nested);
  }
  return next;
};

const scrubBody = (text) => {
  if (!text) {
    return text;
  }
  try {
    return JSON.stringify(scrubJson(JSON.parse(text)));
  } catch {
    return text.replace(
      /(password|token|secret|authorization|cookie)=([^&\s]+)/gi,
      `$1=${REDACTED}`,
    );
  }
};

const scrubPostData = (postData) => {
  if (!postData) {
    return postData;
  }
  return {
    ...postData,
    text: scrubBody(postData.text),
    params: Array.isArray(postData.params)
      ? postData.params.map(scrubNameValue)
      : postData.params,
  };
};

const withoutCookieHeaders = (headers) =>
  headers.filter((header) => !COOKIE_HEADER.test(header.name));

export const scrubHar = (har) => {
  const clone = structuredClone(har);
  for (const entry of clone.log.entries) {
    entry.request.url = scrubUrl(entry.request.url);
    entry.request.headers = withoutCookieHeaders(entry.request.headers).map(scrubHeader);
    entry.response.headers = withoutCookieHeaders(entry.response.headers).map(scrubHeader);
    entry.request.cookies = [];
    entry.response.cookies = [];
    if (Array.isArray(entry.request.queryString)) {
      entry.request.queryString = entry.request.queryString.map(scrubNameValue);
    }
    if (entry.request.postData) {
      entry.request.postData = scrubPostData(entry.request.postData);
    }
    if (entry.response.content?.text) {
      entry.response.content.text = scrubBody(entry.response.content.text);
    }
  }
  return clone;
};

export const isApiEntry = (entry) => {
  const type = (entry._resourceType ?? '').toLowerCase();
  return type === 'xhr' || type === 'fetch';
};

export const isApiStatsEntry = (entry) => {
  const type = String(entry.requestParams?.type ?? '').toLowerCase();
  return type === 'xhr' || type === 'fetch';
};

export const matchesHarFilters = (entry, settings) => {
  if (settings.xhrOnly && !isApiEntry(entry)) {
    return false;
  }
  if (settings.errorsOnly && (entry.response?.status ?? 0) < 400) {
    return false;
  }
  const needle = settings.urlContains?.trim().toLowerCase();
  if (needle && !String(entry.request?.url ?? '').toLowerCase().includes(needle)) {
    return false;
  }
  return true;
};

export const matchesStatsFilters = (entry, settings) => {
  const url = String(entry.requestParams?.request?.url ?? '');
  if (settings.xhrOnly && !isApiStatsEntry(entry)) {
    return false;
  }
  if (settings.errorsOnly) {
    const status = entry.responseParams?.response?.status;
    if (typeof status !== 'number' || status < 400) {
      return false;
    }
  }
  const needle = settings.urlContains?.trim().toLowerCase();
  if (needle && !url.toLowerCase().includes(needle)) {
    return false;
  }
  return true;
};

export const filterHar = (har, settings) => {
  const clone = structuredClone(har);
  clone.log.entries = clone.log.entries.filter((entry) => matchesHarFilters(entry, settings));
  if (!settings.skipBodies) {
    return clone;
  }
  for (const entry of clone.log.entries) {
    if (entry.request) {
      delete entry.request.postData;
    }
    if (entry.response?.content) {
      delete entry.response.content.text;
      delete entry.response.content.encoding;
    }
  }
  return clone;
};

export const buildFileName = (filename, host) => {
  const base = (filename || host || 'network-log').replace(/\.har$/i, '');
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '-',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');
  return `${base}-${stamp}.har`;
};

const headerLines = (headers, scrub) => {
  const list = Array.isArray(headers)
    ? headers
    : Object.entries(headers ?? {}).map(([name, value]) => ({ name, value }));

  return list
    .filter((header) => !scrub || !isSensitiveHeaderName(header.name))
    .map((header) => `-H ${JSON.stringify(`${header.name}: ${header.value}`)}`)
    .join(' \\\n  ');
};

export const toCurl = (entry, scrub = true) => {
  const headers = headerLines(entry.request.headers ?? [], scrub);
  const method = entry.request.method ?? 'GET';
  const body = entry.request.postData?.text;
  const url = scrub ? scrubUrl(entry.request.url) : entry.request.url;
  const parts = [`curl ${JSON.stringify(url)}`, `-X ${method}`];
  if (headers) {
    parts.push(headers);
  }
  if (body) {
    parts.push(`--data ${JSON.stringify(scrub ? scrubBody(body) : body)}`);
  }
  return parts.join(' \\\n  ');
};

export const toCurlFromStatsEntry = (entry, scrub = true) => {
  const request = entry.requestParams?.request;
  if (!request?.url) {
    return null;
  }

  const headers = headerLines(request.headers ?? {}, scrub);
  const method = request.method ?? 'GET';
  const body = request.postData;
  const url = scrub ? scrubUrl(request.url) : request.url;
  const parts = [`curl ${JSON.stringify(url)}`, `-X ${method}`];
  if (headers) {
    parts.push(headers);
  }
  if (body) {
    parts.push(`--data ${JSON.stringify(scrub ? scrubBody(body) : body)}`);
  }
  return parts.join(' \\\n  ');
};
