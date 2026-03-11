export type QuestionType = "multiple-choice" | "true-false" | "short-answer";
export type Difficulty = "easy" | "medium" | "hard";
export type AppStep = "upload" | "settings" | "generating" | "quiz" | "score";

export interface QuizSettings {
  numQuestions: number;
  questionType: QuestionType;
  difficulty: Difficulty;
}

export interface QuizQuestion {
  id: number;
  type: QuestionType;
  question: string;
  options?: string[]; // 4 options for MCQ
  correctAnswer: string;
  explanation: string;
}

export interface UserAnswer {
  questionId: number;
  answer: string;
  isCorrect?: boolean;
}

export interface QuizResult {
  totalQuestions: number;
  correctCount: number;
  percentage: number;
  answers: ReviewAnswer[];
}

export interface ReviewAnswer {
  question: QuizQuestion;
  userAnswer: string;
  isCorrect: boolean;
}

export interface ExtractTextResponse {
  text: string;
  fileName: string;
  charCount: number;
  error?: string;
}

export interface GenerateQuizResponse {
  questions: QuizQuestion[];
  error?: string;
}
