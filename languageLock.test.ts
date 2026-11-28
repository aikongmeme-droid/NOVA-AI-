import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectExplicitLanguageSwitch,
  detectNativeCheckRequest,
  getLanguageSpec,
  hasExplicitLanguageSwitchIntent,
  inferDominantLanguageWithConfidence,
  inferInitialLanguageFromText,
  inferInitialLanguageWithConfidence,
  isAmbiguousShortUtterance,
  normalizeToBcp47,
  resolveMessagePlaybackLanguage,
  resolveNextConversationLanguage,
} from './languageLock';

test('normalizes curated and arbitrary world BCP-47 language codes', () => {
  assert.equal(normalizeToBcp47('ru'), 'ru-RU');
  assert.equal(normalizeToBcp47('en-GB'), 'en-US');
  assert.equal(normalizeToBcp47('uz'), 'uz-UZ');
  assert.equal(normalizeToBcp47('Russian'), 'ru-RU');
  assert.equal(normalizeToBcp47('английский'), 'en-US');
  assert.equal(normalizeToBcp47('таджикский'), 'tg-TJ');
  assert.equal(normalizeToBcp47('кыргызский'), 'ky-KG');
  assert.equal(normalizeToBcp47('mn-mn'), 'mn-MN');
  assert.equal(normalizeToBcp47('sw-ke'), 'sw-KE');
  assert.equal(normalizeToBcp47('Amharic'), 'am-ET');
  assert.equal(normalizeToBcp47('Icelandic'), 'is-IS');
  assert.ok(getLanguageSpec('tg-TJ')?.nativeName.includes('Тоҷик'));
  assert.ok(getLanguageSpec('sw-KE')?.englishName.length);
  assert.ok(getLanguageSpec('am-ET')?.englishName.length);
});

test('locks onto first detected world language and strictly only switches on explicit user command', () => {
  // Turn 1: User speaks Estonian first -> locks onto et-EE (any world language, not just 10)
  const turn1 = resolveNextConversationLanguage({
    currentLanguage: null,
    userText: 'Tere hommikust sõber',
    modelDetectedLanguage: 'et-EE',
  });
  assert.equal(turn1.language, 'et-EE');
  assert.equal(turn1.didSwitch, true);
  assert.equal(turn1.shouldIgnoreForeignSpeech, false);

  // Turn 2: Foreign background Russian speech WITHOUT switch command -> stays locked on et-EE & flags ignore!
  const foreignTurn = resolveNextConversationLanguage({
    currentLanguage: turn1.language,
    userText: 'Привет, как дела сегодня?',
    modelDetectedLanguage: 'ru-RU',
  });
  assert.equal(foreignTurn.language, 'et-EE');
  assert.equal(foreignTurn.didSwitch, false);
  assert.equal(foreignTurn.shouldIgnoreForeignSpeech, true);

  // Turn 3: Explicit user command to switch to Uzbek -> switches strictly to uz-UZ!
  const cmdUz = resolveNextConversationLanguage({
    currentLanguage: foreignTurn.language,
    userText: "O'zbek tilida gaplashaylik",
    modelDetectedLanguage: 'uz-UZ',
  });
  assert.equal(cmdUz.language, 'uz-UZ');
  assert.equal(cmdUz.didSwitch, true);
  assert.equal(cmdUz.shouldIgnoreForeignSpeech, false);

  // Turn 4: Explicit user command to switch to a rare world language (Icelandic) -> switches strictly to is-IS!
  const cmdIs = resolveNextConversationLanguage({
    currentLanguage: cmdUz.language,
    userText: 'Switch to Icelandic please',
    modelDetectedLanguage: 'is-IS',
  });
  assert.equal(cmdIs.language, 'is-IS');
  assert.equal(cmdIs.didSwitch, true);
  assert.equal(cmdIs.shouldIgnoreForeignSpeech, false);
});

test('does NOT switch or ignore on short ambiguous fillers and picks dominant language for mixed sentences', () => {
  assert.equal(isAmbiguousShortUtterance('ok'), true);
  assert.equal(isAmbiguousShortUtterance('hmm...'), true);
  assert.equal(isAmbiguousShortUtterance('да'), true);
  assert.equal(isAmbiguousShortUtterance('Assalomu alaykum, yaxshimisiz?'), false);

  // Short filler keeps active locked language and is NOT flagged as foreign noise
  const filler = resolveNextConversationLanguage({
    currentLanguage: 'uz-UZ',
    userText: 'ok',
    modelDetectedLanguage: 'en-US',
  });
  assert.equal(filler.language, 'uz-UZ');
  assert.equal(filler.didSwitch, false);
  assert.equal(filler.shouldIgnoreForeignSpeech, false);

  // Mixed sentence dominated by Uzbek keeps Uzbek lock
  const mixedUz = inferDominantLanguageWithConfidence(
    'Salom, bugun deadline haqida gaplashamizmi?'
  );
  assert.equal(mixedUz.language, 'uz-UZ');
  assert.equal(mixedUz.isMixed, true);
});

test('supports explicit switch commands across ALL world languages and native-speaker check detection', () => {
  assert.equal(detectExplicitLanguageSwitch('Давай говорить на английском'), 'en-US');
  assert.equal(detectExplicitLanguageSwitch('Перейди на финский'), 'fi-FI');
  assert.equal(detectExplicitLanguageSwitch('Перейди на амхарский'), 'am-ET');
  assert.equal(detectExplicitLanguageSwitch('Switch to Spanish please'), 'es-ES');
  assert.equal(detectExplicitLanguageSwitch('Switch to Icelandic'), 'is-IS');
  assert.equal(detectExplicitLanguageSwitch("O'zbek tilida gaplashaylik"), 'uz-UZ');
  assert.equal(hasExplicitLanguageSwitchIntent('What is the weather in London?'), false);
  assert.equal(
    detectNativeCheckRequest('Проверь мой английский как носитель языка'),
    'en-US'
  );
});

test('detects world scripts and defers unrecognized Latin phrases to AI model detection', () => {
  assert.equal(inferInitialLanguageFromText('Привет, Нова!'), 'ru-RU');
  assert.equal(inferInitialLanguageFromText('Hey Nova, how are you?'), 'en-US');
  assert.equal(inferInitialLanguageFromText('Salom, yaxshimisiz?'), 'uz-UZ');
  assert.equal(inferInitialLanguageFromText('Салом, хуш омадед, аҳволатон чӣ тавр?'), 'tg-TJ');
  assert.equal(inferInitialLanguageFromText('გამარჯობა ნოვა'), 'ka-GE');
  assert.equal(inferInitialLanguageFromText('Hola, ¿cómo estás?'), 'es-ES');
  assert.equal(inferInitialLanguageFromText('Bonjour, comment ça va?'), 'fr-FR');
  assert.equal(inferInitialLanguageFromText('Hallo, wie geht es dir?'), 'de-DE');
  assert.equal(inferInitialLanguageFromText('你好，很高兴认识你'), 'zh-CN');
  assert.equal(inferInitialLanguageFromText('こんにちは、元気ですか？'), 'ja-JP');
  assert.equal(inferInitialLanguageFromText('안녕하세요, 오늘 어때요?'), 'ko-KR');

  const unknownLatin = inferInitialLanguageWithConfidence('Tere hommikust sõber');
  assert.equal(unknownLatin.confident, false);

  const firstEstonian = resolveNextConversationLanguage({
    currentLanguage: null,
    userText: 'Tere hommikust sõber',
    modelDetectedLanguage: 'et-EE',
  });
  assert.equal(firstEstonian.language, 'et-EE');
  assert.equal(firstEstonian.didSwitch, true);
});

test('resolveMessagePlaybackLanguage identifies each specific message language independently', () => {
  assert.equal(
    resolveMessagePlaybackLanguage('Привет, я всегда рядом!', 'en-US', 'en-US'),
    'ru-RU'
  );
  assert.equal(
    resolveMessagePlaybackLanguage('Assalomu alaykum, yaxshimisiz?', 'ru-RU', 'ru-RU'),
    'uz-UZ'
  );
  assert.equal(
    resolveMessagePlaybackLanguage('Merhaba, seni dinliyorum!', null, 'en-US'),
    'tr-TR'
  );
  assert.equal(
    resolveMessagePlaybackLanguage('أهلاً بك، يسعدني مساعدتك!', null, 'en-US'),
    'ar-SA'
  );
  assert.equal(
    resolveMessagePlaybackLanguage('Tere hommikust!', 'et-EE', 'en-US'),
    'et-EE'
  );
});
