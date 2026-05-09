// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// demo data seeding for local marker/testing workflows.
require('dotenv').config();

const mongoose = require('mongoose');
const connectDb = require('../config/db');
const Question = require('../models/Question');
const Score = require('../models/Score');
const User = require('../models/User');
const questionBank = require('./data/sydney_life_survival_quiz_50_questions.json');

const syntheticUsernamePattern = /^(smoke-?\d+|browser\d+|bonus\d+|edcheck-\d+)$/;

function validateSourceQuestion(sourceQuestion, index) {
  const label = sourceQuestion?.id || `question ${index + 1}`;

  if (!sourceQuestion || typeof sourceQuestion !== 'object') {
    throw new Error(`Invalid seed question at index ${index}`);
  }

  if (!sourceQuestion.question || typeof sourceQuestion.question !== 'string') {
    throw new Error(`Seed question ${label} must include question text`);
  }

  if (!Array.isArray(sourceQuestion.options) || sourceQuestion.options.length !== 4) {
    throw new Error(`Seed question ${label} must include exactly four options`);
  }

  const trimmedOptions = sourceQuestion.options.map((option) => String(option).trim());
  const correctAnswer = String(sourceQuestion.correctAnswer || '').trim();

  if (trimmedOptions.some((option) => option.length === 0)) {
    throw new Error(`Seed question ${label} must not include blank options`);
  }

  if (new Set(trimmedOptions).size !== trimmedOptions.length) {
    throw new Error(`Seed question ${label} must not include duplicate options`);
  }

  if (!trimmedOptions.includes(correctAnswer)) {
    throw new Error(`Seed question ${label} correctAnswer must match one option exactly`);
  }
}

function normalizeSourceQuestion(sourceQuestion, index) {
  validateSourceQuestion(sourceQuestion, index);

  const options = sourceQuestion.options.map((option) => String(option).trim());
  const correctAnswerText = String(sourceQuestion.correctAnswer).trim();
  const correctAnswerIndex = options.indexOf(correctAnswerText);

  if (correctAnswerIndex === -1) {
    throw new Error(
      `Seed question ${sourceQuestion?.id || index + 1} correctAnswer must match one option exactly`
    );
  }

  return {
    questionText: sourceQuestion.question.trim(),
    options,
    correctAnswer: correctAnswerIndex,
    active: true,
    explanation: sourceQuestion.explanation
      ? String(sourceQuestion.explanation).trim()
      : ''
  };
}

if (!Array.isArray(questionBank.questions) || questionBank.questions.length < 10) {
  throw new Error('Seed question bank must include at least 10 questions');
}

const questions = questionBank.questions.map(normalizeSourceQuestion);
const sourceQuestionTexts = questions.map((question) => question.questionText);

if (new Set(sourceQuestionTexts).size !== sourceQuestionTexts.length) {
  throw new Error('Seed question bank must not include duplicate question text');
}

const nonSourceQuestionFilter = {
  questionText: { $nin: sourceQuestionTexts }
};

const demoUsers = [
  {
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    password: 'AdminPass123'
  },
  {
    username: 'player1',
    email: 'player1@example.com',
    role: 'user',
    password: 'PlayerPass123'
  },
  {
    username: 'player2',
    email: 'player2@example.com',
    role: 'user',
    password: 'PlayerPass123'
  }
];

async function seedUser({ username, email, role, password }) {
  let user = await User.findOne({ username });

  if (!user) {
    user = new User({ username });
  }

  user.email = email;
  user.role = role;
  await user.setPassword(password);
  await user.save();
}

async function seed() {
  await connectDb();

  const syntheticUserIds = await User.find(
    { username: { $regex: syntheticUsernamePattern } },
    { _id: 1 }
  ).lean();

  const syntheticIds = syntheticUserIds.map((user) => user._id);

  if (syntheticIds.length > 0) {
    await Score.deleteMany({ user: { $in: syntheticIds } });
    await User.deleteMany({ _id: { $in: syntheticIds } });
  }

  await Question.deleteMany(nonSourceQuestionFilter);

  // Clear previous quiz attempts so demo data stays consistent with the current seeded questions.
  await Score.deleteMany({});

  await Question.bulkWrite(
    questions.map((question) => ({
      updateOne: {
        filter: { questionText: question.questionText },
        update: { $set: question },
        upsert: true
      }
    }))
  );

  await Promise.all(demoUsers.map(seedUser));

  console.log(
    `Seeded ${questions.length} active Sydney life questions, admin/AdminPass123, and player1/player2/PlayerPass123`
  );

  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});