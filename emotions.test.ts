import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  NOVA_EMOTION_CATALOG,
  formatEmotionPaletteForPrompt,
  getEmotionSpec,
  getEmotionVideoUrl,
  inferEmotionFromText,
  selectEditorialThinkingEmotion,
  selectPostSpeechListeningEmotion,
} from './emotions';

test('all 72 cataloged MP4 videos exist on disk in public/videos', () => {
  const videosDir = path.resolve(process.cwd(), 'public/videos');
  const filesOnDisk = new Set(fs.readdirSync(videosDir).filter((f) => f.endsWith('.mp4')));

  assert.equal(NOVA_EMOTION_CATALOG.length, 72);

  for (const spec of NOVA_EMOTION_CATALOG) {
    assert.ok(filesOnDisk.has(spec.file), `Missing video file on disk: ${spec.file}`);
  }

  for (const diskFile of filesOnDisk) {
    const inCatalog = NOVA_EMOTION_CATALOG.some((spec) => spec.file === diskFile);
    assert.ok(inCatalog, `Uncataloged video file in public/videos: ${diskFile}`);
  }
});

test('getEmotionSpec resolves exact ids, aliases, categories, and safe defaults', () => {
  assert.equal(getEmotionSpec('warmwelcome').file, 'warmwelcome.mp4');
  assert.equal(getEmotionSpec('Inlove').file, 'Inlove.mp4');
  assert.equal(getEmotionSpec('thoughtfulteflection').file, 'thoughtfulteflection.mp4');
  assert.equal(getEmotionSpec('thoughtful_reflection').id, 'thoughtfulteflection');
  assert.equal(getEmotionSpec('understandingrealization').id, 'understandingealization');
  assert.equal(getEmotionSpec('intrigued').id, 'Intriguedexpression');
  assert.equal(getEmotionSpec('listening').file, 'activelistening.mp4');
  assert.equal(getEmotionSpec('thinking').file, 'readingthoughtfully.mp4');
  assert.equal(getEmotionVideoUrl('unknown-value'), '/videos/friendlysmile.mp4');
});

test('inferEmotionFromText selects nuanced editorial emotions per conversational moment', () => {
  assert.equal(inferEmotionFromText('Привет! Как дела?').id, 'warmwelcome');
  assert.equal(inferEmotionFromText('Ахаха, это очень смешно!', 'assistant').category, 'laughter');
  assert.equal(inferEmotionFromText('Ахаха, это прикол!', 'user').id, 'amusedreaction');
  assert.equal(inferEmotionFromText('Мне так грустно сегодня...', 'user').id, 'compassionateexpression');
  assert.equal(inferEmotionFromText('Мне очень жаль, я рядом с тобой').id, 'deepempathy');
  assert.equal(inferEmotionFromText('Поздравляю с победой! Браво!').id, 'clappinghands');
  assert.equal(inferEmotionFromText('Спасибо большое, Нова!').id, 'gratefulwarmth');
  assert.equal(inferEmotionFromText('Ого, правда?!').id, 'friendlysurprise0');
  assert.equal(inferEmotionFromText('Почему небо голубое?').id, 'genuinecuriosity');
  assert.equal(inferEmotionFromText('Давай разберём грамматику и произношение').id, 'adjustingglasses');
});

test('selectEditorialThinkingEmotion and selectPostSpeechListeningEmotion choose natural transitions', () => {
  assert.equal(selectEditorialThinkingEmotion('Проверь моё произношение на английском').id, 'adjustingglasses');
  assert.equal(selectEditorialThinkingEmotion('Мне сегодня очень грустно и тяжело').id, 'gentleconcern');
  assert.equal(selectEditorialThinkingEmotion('Ахаха слушай шутку').id, 'amusedreaction');
  assert.equal(selectPostSpeechListeningEmotion('deepempathy').id, 'reflectivelistening0');
  assert.equal(selectPostSpeechListeningEmotion('genuinehappiness').id, 'activelistening');
});

test('formatEmotionPaletteForPrompt includes all 72 catalog emotion ids', () => {
  const promptText = formatEmotionPaletteForPrompt();
  for (const spec of NOVA_EMOTION_CATALOG) {
    assert.ok(promptText.includes(spec.id), `Missing ${spec.id} from editorial palette prompt`);
  }
});
