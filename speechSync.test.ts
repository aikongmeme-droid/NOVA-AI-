import test from 'node:test';
import assert from 'node:assert/strict';
import { selectBestCompatibleVoice, type VoiceLike } from './speechSync';

const SAMPLE_VOICES: VoiceLike[] = [
  { name: 'Google US English Female', lang: 'en-US', localService: false },
  { name: 'Milena', lang: 'ru-RU', localService: true },
  { name: 'Google русский', lang: 'ru-RU', localService: false },
  { name: 'Yelda', lang: 'tr-TR', localService: true },
  { name: 'Maged', lang: 'ar-SA', localService: true },
  { name: 'Monica', lang: 'es-ES', localService: true },
];

test('selectBestCompatibleVoice chooses native voice for matching language', () => {
  const ru = selectBestCompatibleVoice(SAMPLE_VOICES, 'ru-RU');
  assert.equal(ru?.lang, 'ru-RU');
  assert.equal(ru?.name, 'Google русский');

  const tr = selectBestCompatibleVoice(SAMPLE_VOICES, 'tr-TR');
  assert.equal(tr?.lang, 'tr-TR');

  const ar = selectBestCompatibleVoice(SAMPLE_VOICES, 'ar-SA');
  assert.equal(ar?.lang, 'ar-SA');
});

test('never uses English voice for Russian and never uses Russian voice for Uzbek', () => {
  const onlyEnAndTr: VoiceLike[] = [
    { name: 'Samantha', lang: 'en-US', localService: true },
    { name: 'Milena', lang: 'ru-RU', localService: true },
    { name: 'Yelda', lang: 'tr-TR', localService: true },
  ];

  // Uzbek without uz-UZ installed MUST pick compatible Turkish (tr-TR), NEVER Russian (ru-RU) or English (en-US)
  const uzCompat = selectBestCompatibleVoice(onlyEnAndTr, 'uz-UZ');
  assert.equal(uzCompat?.lang, 'tr-TR');

  // If only English is installed when reading Russian, MUST NOT return English voice
  const onlyEnglish: VoiceLike[] = [
    { name: 'Samantha', lang: 'en-US', localService: true },
  ];
  assert.equal(selectBestCompatibleVoice(onlyEnglish, 'ru-RU'), null);

  // If only Russian & English are installed when reading Uzbek, MUST NOT return Russian or English
  const onlyRuAndEn: VoiceLike[] = [
    { name: 'Samantha', lang: 'en-US', localService: true },
    { name: 'Milena', lang: 'ru-RU', localService: true },
  ];
  assert.equal(selectBestCompatibleVoice(onlyRuAndEn, 'uz-UZ'), null);
});
