import { useMemo, useState } from 'react';
import recordIcon from '../../player_record.png';
import { buildSampleHar, downloadHar } from './buildSampleHar';
import type { HarLog } from './harTypes';

type RecorderState = 'idle' | 'recording' | 'ready';

const EXTENSION_PATH = 'HAR Recorder_1.5';

const formatRequestCount = (count: number) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return `${count} запрос в HAR`;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} запроса в HAR`;
  }
  return `${count} запросов в HAR`;
};

export const App = () => {
  const [state, setState] = useState<RecorderState>('idle');
  const [har, setHar] = useState<HarLog | null>(null);
  const [error, setError] = useState<string | null>(null);

  const entries = har?.log.entries ?? [];
  const statusLabel = useMemo(() => {
    if (state === 'recording') {
      return 'Идёт демо-запись';
    }
    if (state === 'ready') {
      return formatRequestCount(entries.length);
    }
    return 'Ожидание';
  }, [entries.length, state]);

  const handleToggle = () => {
    setError(null);

    if (state === 'recording') {
      return;
    }

    if (state === 'ready') {
      setHar(null);
      setState('idle');
      return;
    }

    setState('recording');
    window.setTimeout(() => {
      try {
        const nextHar = buildSampleHar('example.com');
        setHar(nextHar);
        setState('ready');
      } catch (unknownError) {
        const message =
          unknownError instanceof Error
            ? unknownError.message
            : 'Не удалось собрать HAR';
        setError(message);
        setState('idle');
      }
    }, 700);
  };

  const handleDownload = () => {
    if (!har) {
      return;
    }
    downloadHar(har, 'example.com.har');
  };

  return (
    <div className="page">
      <header className="hero">
        <img
          className="hero__icon"
          src={recordIcon}
          alt=""
          width={48}
          height={48}
        />
        <div>
          <p className="eyebrow">Chrome MV3 · без popup</p>
          <h1>HAR Recorder</h1>
          <p className="lede">
            Само расширение пишет сеть через <code>chrome.debugger</code>, поэтому
            обычная вкладка его не заменит. Здесь — фронт-песочница: тот же
            <code>HARBuilder</code> и <code>StatsBuilder</code>, тестовый трафик и
            скачивание HAR.
          </p>
        </div>
      </header>

      <section className="panel">
        <div className="panel__status">
          <span className={`dot ${state === 'recording' ? 'dot--live' : ''}`} />
          <strong>{statusLabel}</strong>
        </div>

        <div className="actions">
          <button
            className={state === 'idle' ? 'button button--record' : 'button'}
            onClick={handleToggle}
            disabled={state === 'recording'}
            type="button"
          >
            {state === 'idle' && 'Начать демо-запись'}
            {state === 'recording' && 'Собираем запросы…'}
            {state === 'ready' && 'Сбросить'}
          </button>
          <button
            className="button button--primary"
            onClick={handleDownload}
            disabled={!har}
            type="button"
          >
            Скачать example.com.har
          </button>
        </div>

        {error ? <p className="error">{error}</p> : null}

        <table className="requests">
          <thead>
            <tr>
              <th>Метод</th>
              <th>URL</th>
              <th>Статус</th>
              <th>Тип</th>
              <th>ms</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty">
                  Нажмите «Начать демо-запись», чтобы прогнать sample CDP-события
                  через текущие `stats.js` и `har.js`.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={`${entry.request.method}-${entry.request.url}`}>
                  <td>{entry.request.method}</td>
                  <td className="url">{entry.request.url}</td>
                  <td>{entry.response.status}</td>
                  <td>{entry._resourceType ?? '—'}</td>
                  <td>{Math.round(entry.time)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="guide">
        <h2>Как открыть настоящее расширение</h2>
        <ol>
          <li>
            Chrome → <code>chrome://extensions</code>
          </li>
          <li>Включите «Режим разработчика»</li>
          <li>
            «Загрузить распакованное расширение» и выберите папку{' '}
            <code>{EXTENSION_PATH}</code>
          </li>
          <li>
            На любой вкладке нажмите иконку записи: старт/стоп. При остановке
            скачается HAR текущего хоста.
          </li>
        </ol>
        <p className="note">
          В Cursor-браузере и в обычной веб-странице нет
          <code> chrome.debugger</code>, поэтому живой перехват сети работает
          только после загрузки как unpacked extension.
        </p>
      </section>
    </div>
  );
};
