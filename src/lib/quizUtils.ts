// Import question data
import { grade10MathematicsQuestions } from "@/data/grade10MathematicsQuestions";
import { grade10PhysicsQuestions } from "@/data/grade10PhysicsQuestions";
import { grade10ChemistryQuestions } from "@/data/grade10ChemistryQuestions";
import { grade10EnglishQuestions } from "@/data/grade10EnglishQuestions";
import { grade10CivicsQuestions } from "@/data/grade10CivicsQuestions";
import { grade10GeographyQuestions } from "@/data/grade10GeographyQuestions";
import { grade10HistoryQuestions } from "@/data/grade10HistoryQuestions";
import { grade11AgricultureQuestions } from "@/data/grade11AgricultureQuestions";
import { grade11Biology } from "@/data/grade11Biology";
import { grade11Chemistry } from "@/data/grade11Chemistry";

import { grade11Physics } from "@/data/grade11Physics";
import { grade11AmharicQuestions } from "@/data/grade11AmharicQuestions";
import { grade11CivicsQuestions } from "@/data/grade11CivicsQuestions";
import { grade11GeographyQuestions } from "@/data/grade11GeographyQuestions";
import { grade11HistoryQuestions } from "@/data/grade11HistoryQuestions";
import { grade11EnglishQuestions } from "@/data/grade11EnglishQuestions";
import { grade12AgricultureQuestions } from "@/data/grade12AgricultureQuestions";
import { grade12BiologyQuestions } from "@/data/grade12BiologyQuestions";
import { grade12ChemistryQuestions } from "@/data/grade12ChemistryQuestions";
import { grade12CivicsQuestions } from "@/data/grade12CivicsQuestions";
import { grade12EnglishQuestions } from "@/data/grade12EnglishQuestions";
import { grade12GeographyQuestions } from "@/data/grade12GeographyQuestions";
import { grade12HistoryQuestions } from "@/data/grade12HistoryQuestions";
import { grade12ITQuestions } from "@/data/grade12ITQuestions";
import { grade12Mathematics } from "@/data/grade12Mathematics";
import { grade12PhysicsQuestions } from "@/data/grade12PhysicsQuestions";

interface NormalizedQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty?: string;
}

interface OptionQuestion {
  options: string[];
  correct?: string;
  correctAnswer?: string;
}

interface IndexedOptionQuestion {
  options: string[];
  correctAnswer: number;
}

const shuffleArray = <T,>(items: T[]): T[] => {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
};

const hashSeed = (value: string): number => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const shuffleArrayWithSeed = <T,>(items: T[], seed: string): T[] => {
  const shuffled = [...items];
  let state = hashSeed(seed) || 1;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
};

export const shuffleQuestionOptions = <T extends OptionQuestion>(question: T): T => {
  if (!Array.isArray(question.options) || question.options.length < 2) {
    return question;
  }

  const correctAnswer = question.correct ?? question.correctAnswer;
  const originalCorrectIndex = correctAnswer ? question.options.indexOf(correctAnswer) : -1;
  let shuffledOptions = shuffleArray(question.options);

  if (
    correctAnswer &&
    originalCorrectIndex >= 0 &&
    shuffledOptions.length > 1 &&
    shuffledOptions.indexOf(correctAnswer) === originalCorrectIndex
  ) {
    shuffledOptions = [...shuffledOptions.slice(1), shuffledOptions[0]];
  }

  return {
    ...question,
    options: shuffledOptions,
  };
};

export const shuffleIndexedQuestionOptions = <T extends IndexedOptionQuestion>(question: T): T => {
  if (!Array.isArray(question.options) || question.options.length < 2 || question.correctAnswer < 0) {
    return question;
  }

  const correctOption = question.options[question.correctAnswer];
  let shuffledOptions = shuffleArray(question.options);

  if (shuffledOptions.indexOf(correctOption) === question.correctAnswer) {
    shuffledOptions = [...shuffledOptions.slice(1), shuffledOptions[0]];
  }

  return {
    ...question,
    options: shuffledOptions,
    correctAnswer: shuffledOptions.indexOf(correctOption),
  };
};

// Flatten questions from nested objects to flat arrays
const flattenQuestions = (questionsObj: Record<string, any[]>): any[] => {
  const result: any[] = [];
  Object.values(questionsObj).forEach(chapterQuestions => {
    if (Array.isArray(chapterQuestions)) {
      result.push(...chapterQuestions);
    }
  });
  return result;
};

// Normalize different question formats to a standard format
const normalizeQuestion = (q: any): NormalizedQuestion => ({
  question: q.question,
  options: q.options,
  correctAnswer: q.correct || q.correctAnswer,
  explanation: q.explanation,
  difficulty: q.difficulty?.toLowerCase()
});

const questionSets: Record<string, Record<string, any>> = {
  "10": {
    "Mathematics": grade10MathematicsQuestions,
    "Physics": grade10PhysicsQuestions,
    "Chemistry": grade10ChemistryQuestions,
    "English": grade10EnglishQuestions,
    "Civic Education": grade10CivicsQuestions,
    "Geography": grade10GeographyQuestions,
    "History": grade10HistoryQuestions,
  },
  "11": {
    "Agriculture": grade11AgricultureQuestions,
    "Biology": grade11Biology,
    "Chemistry": grade11Chemistry,
    "Physics": grade11Physics,
    "English": grade11EnglishQuestions,
    "Geography": grade11GeographyQuestions,
    "History": grade11HistoryQuestions,
    "Amharic": grade11AmharicQuestions,
    "Civics": grade11CivicsQuestions,
  },
  "12": {
    "Agriculture": grade12AgricultureQuestions,
    "Biology": grade12BiologyQuestions,
    "Chemistry": grade12ChemistryQuestions,
    "Civics": grade12CivicsQuestions,
    "English": grade12EnglishQuestions,
    "Geography": grade12GeographyQuestions,
    "History": grade12HistoryQuestions,
    "IT": grade12ITQuestions,
    "Mathematics": grade12Mathematics,
    "Physics": grade12PhysicsQuestions,
  },
};

export const getAvailableQuizSubjects = (grade: number): string[] =>
  Object.keys(questionSets[grade.toString()] ?? {}).sort();

export const getQuestionsForQuiz = (
  grade: number,
  subject: string,
  chapterId: string,
  difficulty: string,
  seed?: string,
): NormalizedQuestion[] => {
  const gradeKey = grade.toString();
  const subjectData = questionSets[gradeKey]?.[subject];
  
  if (!subjectData) return [];

  // Flatten the questions object to an array
  const allQuestions = flattenQuestions(subjectData);
  
  // Normalize and filter by difficulty
  let normalized = allQuestions.map(normalizeQuestion);

  if (difficulty && difficulty !== "all") {
    normalized = normalized.filter(q => q.difficulty === difficulty.toLowerCase());
  }

  if (seed) {
    return normalized
      .map((question) => ({
        question,
        order: hashSeed(`${seed}:${question.question}`),
      }))
      .sort((a, b) => a.order - b.order || a.question.question.localeCompare(b.question.question))
      .map(({ question }) => ({
        ...question,
        options: shuffleArrayWithSeed(question.options, `${seed}:${question.question}:options`),
      }));
  }

  // Shuffle and return
  return normalized.sort(() => Math.random() - 0.5).map(shuffleQuestionOptions);
};
