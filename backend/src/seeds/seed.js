// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// demo data seeding for local marker/testing workflows.
require('dotenv').config();

const mongoose = require('mongoose');
const connectDb = require('../config/db');
const Question = require('../models/Question');
const Score = require('../models/Score');
const User = require('../models/User');
const wizardBank = require('./data/wizard_sydney_questions.json');

const syntheticUsernamePattern = /^(smoke-?\d+|browser\d+|bonus\d+|edcheck-\d+)$/;

function validateWizardQuestion(row, index) {
  const label = `wizard question ${index + 1}`;
  if (!row || typeof row !== 'object') {
    throw new Error(`Invalid ${label}`);
  }
  if (!row.questionText || typeof row.questionText !== 'string') {
    throw new Error(`${label} must include questionText`);
  }
  if (!Array.isArray(row.options) || row.options.length !== 4) {
    throw new Error(`${label} must include exactly four options`);
  }
  const opts = row.options.map((o) => String(o).trim());
  if (opts.some((o) => !o) || new Set(opts).size !== opts.length) {
    throw new Error(`${label} options must be non-empty and unique`);
  }
  if (
    typeof row.correctAnswer !== 'number' ||
    !Number.isInteger(row.correctAnswer) ||
    row.correctAnswer < 0 ||
    row.correctAnswer > 3
  ) {
    throw new Error(`${label} correctAnswer must be an integer 0–3`);
  }
}

function normalizeWizardQuestion(row, index) {
  validateWizardQuestion(row, index);
  const options = row.options.map((o) => String(o).trim());
  return {
    questionText: row.questionText.trim(),
    options,
    correctAnswer: row.correctAnswer,
    active: row.active !== false,
    topic: (row.topic && String(row.topic).trim()) || 'general',
    explanation: row.explanation != null ? String(row.explanation).trim() : '',
  };
}

if (!Array.isArray(wizardBank.questions) || wizardBank.questions.length < 10) {
  throw new Error('wizard_sydney_questions.json must include at least 10 questions');
}

const questions = wizardBank.questions.map(normalizeWizardQuestion);
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
  // This script clears all Scores and non-seed Questions, so refuse to run against a
  // production database unless explicitly forced.
  if (process.env.NODE_ENV === 'production' && process.env.FORCE_SEED !== '1') {
    throw new Error(
      'Refusing to seed with NODE_ENV=production. Set FORCE_SEED=1 to override (this wipes all scores).'
    );
  }

  await connectDb();

  const syntheticUserIds = await User.find(
    { username: { $regex: syntheticUsernamePattern } },
    { _id: 1 }
  ).lean();

  const syntheticIds = syntheticUserIds.map((user) => user._id);

  if (syntheticIds.length > 0) {
    await Score.deleteMany({ userId: { $in: syntheticIds } });
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
    `Seeded ${questions.length} active questions (wizard_sydney_questions.json), admin/AdminPass123, and player1/player2/PlayerPass123`
  );

  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
