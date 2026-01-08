import { loadCheckpoint, saveCheckpoint } from '@state/checkpoint.js';

const checkpoint = loadCheckpoint();
if (!checkpoint) {
  console.log('No checkpoint found.');
  process.exit(0);
}

checkpoint.globalMode = 'NORMAL';
checkpoint.pods = checkpoint.pods.map((pod) => ({
  ...pod,
  mode: 'NORMAL'
}));

saveCheckpoint(checkpoint);
console.log('Modes reset to NORMAL.');
