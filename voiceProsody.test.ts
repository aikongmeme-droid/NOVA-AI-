import test from 'node:test';
import assert from 'node:assert/strict';
import { getEmotionSpec } from './emotions';
import { buildEmotionTimeline, resolveVoiceProsody } from './voiceProsody';

test('resolveVoiceProsody adjusts speaking rate, pitch, and transition speed across contrasting emotions', () => {
  const sadProsody = resolveVoiceProsody({
    emotionId: 'deepsadness',
    userMood: 'melancholic',
    trajectory: 'declining',
    valence: -0.7,
    arousal: 0.2,
  });

  const joyProsody = resolveVoiceProsody({
    emotionId: 'excited0',
    userMood: 'celebratory',
    trajectory: 'improving',
    valence: 0.85,
    arousal: 0.88,
  });

  const curiousProsody = resolveVoiceProsody({
    emotionId: 'genuinecuriosity',
    userMood: 'curious',
  });

  assert.ok(sadProsody.speakingRate < 0.92, `Expected slow rate for sadness, got ${sadProsody.speakingRate}`);
  assert.ok(sadProsody.pitchShift < 0.98, `Expected softer lowered pitch for sadness, got ${sadProsody.pitchShift}`);
  assert.ok(
    sadProsody.videoTransitionMs >= 680,
    `Expected smooth slow crossfade for sadness, got ${sadProsody.videoTransitionMs}`
  );
  assert.equal(sadProsody.pauseCadence, 'spacious');

  assert.ok(joyProsody.speakingRate > 1.05, `Expected lively rate for joy, got ${joyProsody.speakingRate}`);
  assert.ok(joyProsody.pitchShift > 1.03, `Expected brighter pitch for joy, got ${joyProsody.pitchShift}`);
  assert.ok(
    joyProsody.videoTransitionMs < sadProsody.videoTransitionMs,
    'Joyful clip transitions should be snappier than deep sadness transitions'
  );
  assert.equal(joyProsody.intonationArc, 'lively-expressive');

  assert.equal(curiousProsody.intonationArc, 'curious-upward');
  assert.ok(curiousProsody.ttsStyleDirective.includes('Vocal delivery:'));
});

test('resolveVoiceProsody keeps distressed conversations gentle regardless of energetic archetype', () => {
  const distressedWithEnergetic = resolveVoiceProsody({
    emotionId: 'deepempathy',
    archetypeId: 'energetic_cheerleader',
    userMood: 'distressed',
    trajectory: 'declining',
    valence: -0.8,
  });

  assert.ok(distressedWithEnergetic.speakingRate <= 0.92);
  assert.ok(distressedWithEnergetic.pitchShift <= 0.98);
  assert.equal(distressedWithEnergetic.pauseCadence, 'spacious');
  assert.ok(distressedWithEnergetic.videoTransitionMs >= 680);
});

test('buildEmotionTimeline produces valid monotonic emotion cues synced to reply sentences', () => {
  const timeline = buildEmotionTimeline({
    replyText:
      'I hear how hard this week felt for you. You have already come so far, and I truly believe in you! Haha, remember how we joked about it yesterday?',
    primaryEmotionId: 'deepempathy',
    secondaryEmotionId: 'reassuringconfidence',
  });

  assert.ok(timeline.length >= 2, 'Multi-sentence emotional reply should schedule at least 2 visual cues');
  assert.equal(timeline[0].atProgress, 0);
  assert.equal(timeline[0].emotionId, 'deepempathy');

  for (let i = 0; i < timeline.length; i++) {
    const cue = timeline[i];
    assert.equal(getEmotionSpec(cue.emotionId).id, cue.emotionId);
    assert.ok(cue.atProgress >= 0 && cue.atProgress < 1);
    assert.ok(cue.prosody.speakingRate >= 0.84 && cue.prosody.speakingRate <= 1.15);
    if (i > 0) {
      assert.ok(cue.atProgress > timeline[i - 1].atProgress);
    }
  }
});

test('buildEmotionTimeline places explicit secondaryEmotionId for single-sentence shifts', () => {
  const timeline = buildEmotionTimeline({
    replyText: 'Take a deep breath, everything is going to be alright.',
    primaryEmotionId: 'gentleconcern',
    secondaryEmotionId: 'reassuringconfidence',
  });

  assert.equal(timeline.length, 2);
  assert.equal(timeline[0].emotionId, 'gentleconcern');
  assert.equal(timeline[1].emotionId, 'reassuringconfidence');
  assert.equal(timeline[1].atProgress, 0.55);
});
