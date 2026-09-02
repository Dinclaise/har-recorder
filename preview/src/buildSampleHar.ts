import { HARBuilder } from '../../har.js';
import { Stats, StatsBuilder } from '../../stats.js';
import { isHarLog, type HarLog } from './harTypes';
import { createSampleEvents } from './sampleEvents';

export const buildSampleHar = (domain: string): HarLog => {
  const stats = new Stats(domain);
  const startedAtSeconds = Date.now() / 1000;
  const events = createSampleEvents(startedAtSeconds);

  for (const event of events) {
    StatsBuilder.processEvent(stats, event);
  }

  const har = new HARBuilder().create([stats], domain);
  if (!isHarLog(har)) {
    throw new Error('HARBuilder вернул неожиданный формат');
  }

  return har;
};

export const downloadHar = (har: HarLog, fileName: string) => {
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
