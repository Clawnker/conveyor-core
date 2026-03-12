import { STAGES, nextStage } from '@conveyor/core';
import { createGithubAdapter } from '@conveyor/adapters-github';

const github = createGithubAdapter({ provider: 'github' });

console.log('conveyor starter boot');
console.log('stages:', STAGES.join(' -> '));
console.log('next after intake:', nextStage('intake'));
console.log('adapter:', github.name);
