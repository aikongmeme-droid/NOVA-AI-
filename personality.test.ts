import test from 'node:test';
import assert from 'node:assert/strict';
import { NOVA_EMOTION_CATALOG } from './emotions';
import {
  DEFAULT_PERSONALITY_TRAITS,
  PERSONALITY_ARCHETYPES,
  analyzeConversationMoodProfile,
  analyzeTurnSentiment,
  evolvePersonalityTraits,
  formatPersonalityContextForPrompt,
  getPersonalityArchetypeSpec,
  parsePersonalityTraits,
  selectPersonalityAwareEmotion,
} from './personality';

test('analyzeTurnSentiment detects diverse user moods accurately across languages', () => {
  assert.equal(analyzeTurnSentiment('Мне так тяжело, я просто рыдаю и не выдерживаю 😭').mood, 'distressed');
  assert.equal(analyzeTurnSentiment('Я очень волнуюсь и боюсь завтрашнего экзамена').mood, 'anxious');
  assert.equal(analyzeTurnSentiment('Меня всё это бесит, ничего не получается!').mood, 'frustrated');
  assert.equal(analyzeTurnSentiment('Сегодня немного грустно и одиноко...').mood, 'melancholic');
  assert.equal(analyzeTurnSentiment('Ура! Я сдал экзамен и получил работу! 🎉').mood, 'celebratory');
  assert.equal(analyzeTurnSentiment('Ахаха, это было очень смешно! 😂').mood, 'playful');
  assert.equal(analyzeTurnSentiment('Спасибо тебе, Нова, ты такая классная ❤️').mood, 'affectionate');
  assert.equal(analyzeTurnSentiment('Иногда я размышляю о смысле жизни и будущем').mood, 'reflective');
  assert.equal(analyzeTurnSentiment('Почему звёзды мерцают? Объясни, пожалуйста').mood, 'curious');
});

test('analyzeConversationMoodProfile tracks improving and declining emotional trajectories', () => {
  const declining = analyzeConversationMoodProfile({
    currentUserText: 'Я больше не выдерживаю, просто плачу и сердце разбито',
    recentMessages: [
      { role: 'user', content: 'Привет! Отличный день сегодня!' },
      { role: 'assistant', content: 'Привет! Как здорово слышать!' },
    ],
  });
  assert.equal(declining.trajectory, 'declining');
  assert.equal(declining.styleName, 'Tender Grounding Companion');

  const improving = analyzeConversationMoodProfile({
    currentUserText: 'Ура, всё получилось! Я так счастлив!',
    recentMessages: [
      { role: 'user', content: 'Мне очень грустно и одиноко сегодня...' },
      { role: 'assistant', content: 'Я рядом с тобой.' },
    ],
  });
  assert.equal(improving.trajectory, 'improving');
  assert.equal(improving.styleName, 'Radiant Celebrating Friend');
});

test('analyzeConversationMoodProfile carries strong emotional context into brief follow-ups', () => {
  const followUp = analyzeConversationMoodProfile({
    currentUserText: 'Да, наверное.',
    recentMessages: [
      { role: 'user', content: 'Я очень тревожусь и боюсь, что не справлюсь со стрессом' },
      { role: 'assistant', content: 'Расскажи, что именно тебя тревожит сейчас?' },
    ],
  });
  assert.equal(followUp.mood, 'anxious');
  assert.equal(followUp.styleName, 'Calm Reassuring Anchor');
});

test('every recommended emotion in style presets and archetypes resolves to a valid catalog video', () => {
  const catalogIds = new Set(NOVA_EMOTION_CATALOG.map((e) => e.id));
  const sampleTexts = [
    'рыдаю',
    'боюсь',
    'бесит',
    'грустно',
    'ура',
    'ахаха',
    'спасибо люблю',
    'смысл жизни',
    'почему',
    'обычный день',
  ];
  for (const arch of PERSONALITY_ARCHETYPES) {
    assert.ok(catalogIds.has(arch.idleEmotion));
    for (const id of [...arch.thinkingEmotions, ...arch.listeningEmotions, ...arch.signatureEmotions]) {
      assert.ok(catalogIds.has(id), `Invalid archetype emotion ${id}`);
    }
  }
  for (const text of sampleTexts) {
    const profile = analyzeConversationMoodProfile({
      currentUserText: text,
      recentMessages: [],
      archetypeId: 'witty_friend',
    });
    assert.ok(profile.recommendedEmotions.length >= 4);
    for (const id of profile.recommendedEmotions) {
      assert.ok(catalogIds.has(id), `Invalid emotion id ${id}`);
    }
    const promptBlock = formatPersonalityContextForPrompt(profile);
    assert.ok(promptBlock.includes(profile.styleName));
    assert.ok(promptBlock.includes('Witty Friend'));
  }
});

test('selected personality archetypes shape video choices, dialogue profile, and TTS style', () => {
  const witty = analyzeConversationMoodProfile({
    currentUserText: 'How is your day going?',
    recentMessages: [],
    archetypeId: 'witty_friend',
  });
  const caring = analyzeConversationMoodProfile({
    currentUserText: 'How is your day going?',
    recentMessages: [],
    archetypeId: 'caring_confidante',
  });
  assert.notEqual(witty.idleEmotion, caring.idleEmotion);
  assert.notEqual(witty.ttsStyleDirective, caring.ttsStyleDirective);
  assert.equal(witty.preferredVoice, 'Zephyr');
  assert.equal(caring.preferredVoice, 'Kore');
  assert.equal(
    selectPersonalityAwareEmotion({
      archetypeId: 'curious_learner',
      candidateEmotionId: 'friendlysmile',
    }),
    'genuinecuriosity'
  );
  assert.equal(getPersonalityArchetypeSpec('unknown').id, 'adaptive');
});

test('evolvePersonalityTraits gradually adapts and safely clamps traits across interactions', () => {
  let traits = { ...DEFAULT_PERSONALITY_TRAITS };
  const funnySignal = analyzeTurnSentiment('Haha that joke was hilarious! 😂');
  traits = evolvePersonalityTraits(traits, funnySignal, 'Haha that joke was hilarious! 😂');
  assert.ok(traits.playfulness > DEFAULT_PERSONALITY_TRAITS.playfulness);
  assert.equal(traits.interactionsCount, 1);

  const parsedBad = parsePersonalityTraits('not-json');
  assert.deepEqual(parsedBad, DEFAULT_PERSONALITY_TRAITS);
  const clamped = parsePersonalityTraits({ warmth: 999, playfulness: -10, curiosity: 72, energy: 45, interactionsCount: 4 });
  assert.equal(clamped.warmth, 100);
  assert.equal(clamped.playfulness, 0);
  assert.equal(clamped.curiosity, 72);
});
