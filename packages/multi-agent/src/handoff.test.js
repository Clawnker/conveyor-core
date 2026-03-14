import test from 'node:test';
import assert from 'node:assert/strict';

import { createRegistry } from './registry.js';
import { createLensRunner } from './lenses.js';
import { createHandoff } from './handoff.js';

test('handoff rejects a receiver outside the card lane', async () => {
  const registry = createRegistry();
  registry.register({ id: 'builder', role: 'builder', lane: ['web-*'], status: 'online' });
  registry.register({ id: 'audit', role: 'audit', lane: ['ops-*'], status: 'online' });

  const handoff = createHandoff(registry, createLensRunner());
  const result = await handoff.initiate('builder', 'audit', { id: 'web-42', stage: 'review' }, { proof: true });

  assert.equal(result.accepted, false);
  assert.match(result.reason, /lane mismatch/);
});

test('handoff applies advisory lenses and returns a handoff packet', async () => {
  const registry = createRegistry();
  registry.register({ id: 'builder', role: 'builder', lane: ['web-*'], status: 'online' });
  registry.register({ id: 'audit', role: 'audit', lane: ['*'], status: 'online' });

  const lenses = createLensRunner();
  lenses.register({
    domain: 'review',
    name: 'quality-pass',
    authority: 'Top reviewer',
    perspectives: ['What would you improve?'],
    appliesTo: 'builder',
  });

  const handoff = createHandoff(registry, lenses);
  const card = { id: 'web-42', stage: 'review', projectKey: 'web' };
  const evidence = { summary: 'Initial draft complete' };

  const result = await handoff.initiate('builder', 'audit', card, evidence, async (authority, perspectives, output) => ({
    outputReview: [`${authority}: tighten scope`],
    processOptimisation: [`${perspectives[0]} via checklist`],
    priority: [output.summary],
  }));

  assert.equal(result.accepted, true);
  assert.equal(result.handoff.from, 'builder');
  assert.equal(result.handoff.to, 'audit');
  assert.deepEqual(result.lensResults.outputReview, ['Top reviewer: tighten scope']);
  assert.deepEqual(result.lensResults.processOptimisation, ['What would you improve? via checklist']);
  assert.deepEqual(result.lensResults.priority, ['Initial draft complete']);
  assert.deepEqual(result.lensResults.lensesApplied, ['quality-pass']);
});
