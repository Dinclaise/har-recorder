export type HarHeader = {
  name: string;
  value: string;
};

export type HarEntry = {
  startedDateTime: string;
  time: number;
  request: {
    method: string;
    url: string;
    httpVersion: string;
    headers: HarHeader[];
  };
  response: {
    status: number;
    statusText: string;
    httpVersion: string;
    headers: HarHeader[];
    content: {
      size: number;
      mimeType: string;
      text?: string;
    };
  };
  _resourceType?: string;
};

export type HarLog = {
  log: {
    version: string;
    creator: {
      name: string;
      version: string;
      comment: string;
    };
    pages: Array<{
      id: string;
      title: string;
      startedDateTime: string;
    }>;
    entries: HarEntry[];
  };
};

export const isHarLog = (value: unknown): value is HarLog => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const log = 'log' in value ? value.log : undefined;
  if (typeof log !== 'object' || log === null) {
    return false;
  }

  return 'entries' in log && Array.isArray(log.entries);
};
