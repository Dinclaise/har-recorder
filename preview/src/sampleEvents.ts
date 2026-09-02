type SampleRequest = {
  id: string;
  method: string;
  url: string;
  status: number;
  statusText: string;
  mimeType: string;
  resourceType: string;
  body: string;
};

const SAMPLE_REQUESTS: SampleRequest[] = [
  {
    id: 'req-document',
    method: 'GET',
    url: 'https://example.com/',
    status: 200,
    statusText: 'OK',
    mimeType: 'text/html',
    resourceType: 'Document',
    body: '<html><body>Example</body></html>',
  },
  {
    id: 'req-script',
    method: 'GET',
    url: 'https://example.com/assets/app.js',
    status: 200,
    statusText: 'OK',
    mimeType: 'application/javascript',
    resourceType: 'Script',
    body: 'console.log("app")',
  },
  {
    id: 'req-api',
    method: 'GET',
    url: 'https://api.example.com/v1/status?env=preview',
    status: 200,
    statusText: 'OK',
    mimeType: 'application/json',
    resourceType: 'XHR',
    body: '{"ok":true,"mode":"preview"}',
  },
  {
    id: 'req-submit',
    method: 'POST',
    url: 'https://api.example.com/v1/session',
    status: 201,
    statusText: 'Created',
    mimeType: 'application/json',
    resourceType: 'Fetch',
    body: '{"id":"session-1"}',
  },
];

export type CdpEvent = {
  method: string;
  params: Record<string, unknown>;
};

export const createSampleEvents = (startedAtSeconds: number): CdpEvent[] => {
  const events: CdpEvent[] = [
    {
      method: 'Page.domContentEventFired',
      params: { timestamp: startedAtSeconds + 0.12 },
    },
    {
      method: 'Page.loadEventFired',
      params: { timestamp: startedAtSeconds + 0.28 },
    },
  ];

  SAMPLE_REQUESTS.forEach((request, index) => {
    const requestTime = startedAtSeconds + index * 0.05;
    const finishedTime = requestTime + 0.08 + index * 0.01;

    events.push(
      {
        method: 'Network.requestWillBeSent',
        params: {
          requestId: request.id,
          initiator: { type: index === 0 ? 'other' : 'script' },
          timestamp: requestTime,
          wallTime: requestTime,
          type: request.resourceType,
          request: {
            method: request.method,
            url: request.url,
            headers: {
              Accept: '*/*',
              'User-Agent': 'HAR Recorder Preview',
            },
            initialPriority: 'High',
            ...(request.method === 'POST'
              ? { postData: '{"source":"preview"}' }
              : {}),
          },
        },
      },
      {
        method: 'Network.responseReceived',
        params: {
          requestId: request.id,
          timestamp: finishedTime,
          type: request.resourceType,
          response: {
            url: request.url,
            status: request.status,
            statusText: request.statusText,
            headers: {
              'content-type': request.mimeType,
              'content-length': String(request.body.length),
            },
            mimeType: request.mimeType,
            protocol: 'http/1.1',
            remoteIPAddress: '93.184.216.34',
            connectionId: 12 + index,
            fromDiskCache: false,
            encodedDataLength: request.body.length + 180,
            timing: {
              requestTime,
              dnsStart: 0.2,
              dnsEnd: 1.1,
              connectStart: 1.1,
              connectEnd: 4.4,
              sslStart: 1.6,
              sslEnd: 4.1,
              sendStart: 4.4,
              sendEnd: 4.8,
              receiveHeadersEnd: 18 + index,
            },
          },
        },
      },
      {
        method: 'Network.dataReceived',
        params: {
          requestId: request.id,
          dataLength: request.body.length,
        },
      },
      {
        method: 'Network.loadingFinished',
        params: {
          requestId: request.id,
          timestamp: finishedTime,
          encodedDataLength: request.body.length + 180,
        },
      },
      {
        method: 'Network.getResponseBody',
        params: {
          requestId: request.id,
          body: request.body,
          base64Encoded: false,
        },
      },
    );
  });

  return events;
};
