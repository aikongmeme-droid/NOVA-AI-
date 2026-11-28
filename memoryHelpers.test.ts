import test from 'node:test';
import assert from 'node:assert/strict';
import { extractKnownUserName, extractUserNameFact } from './memoryHelpers';

test('extractUserNameFact detects explicit introductions across languages', () => {
  assert.equal(extractUserNameFact('Меня зовут Амир!'), "User's name is Амир");
  assert.equal(extractUserNameFact('Привет, я — Алина.'), "User's name is Алина");
  assert.equal(extractUserNameFact('Я Данияр'), "User's name is Данияр");
  assert.equal(extractUserNameFact('My name is Alex'), "User's name is Alex");
  assert.equal(extractUserNameFact("Hi, I'm Sarah."), "User's name is Sarah");
  assert.equal(extractUserNameFact('Mening ismim Javohir'), "User's name is Javohir");
  assert.equal(extractUserNameFact('Me llamo Sofía'), "User's name is Sofía");
  assert.equal(
    extractUserNameFact('Тимур', 'Привет! Меня зовут NOVA. А как тебя зовут?'),
    "User's name is Тимур"
  );
});

test('extractUserNameFact ignores ordinary non-name phrases', () => {
  assert.equal(extractUserNameFact('Я сегодня очень устал'), null);
  assert.equal(extractUserNameFact('Я человек'), null);
  assert.equal(extractUserNameFact("I'm fine, thank you!"), null);
  assert.equal(extractUserNameFact('Привет, Нова! Расскажи чем можешь помочь.'), null);
  assert.equal(extractUserNameFact('Меня зовут? Хаха, шутка, просто хорошо'), null);
  assert.equal(extractUserNameFact('Да', 'Привет! Меня зовут NOVA. Как тебя зовут?'), null);
});

test('extractKnownUserName reads saved name fact from memory list', () => {
  assert.equal(
    extractKnownUserName([{ fact: 'Likes coffee' }, { fact: "User's name is Timur" }]),
    'Timur'
  );
  assert.equal(extractKnownUserName([{ fact: 'Learning English' }]), null);
});
