/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Types for quiz generation functionality
 */
export interface Question {
  id: string;
  type: "multiple-choice" | "true-false";
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  difficulty: string;
  sourceFile?: string;
}

export interface GenerateQuestionsRequest {
  files: Array<{
    name: string;
    content: string; // Base64 encoded PDF content
  }>;
  questionCount: number;
  questionTypes: {
    multipleChoice: boolean;
    trueFalse: boolean;
  };
  difficulty: "easy" | "medium" | "hard";
}

export interface GenerateQuestionsResponse {
  questions: Question[];
  processingTime: number;
  success: boolean;
  message?: string;
}

export interface ProcessPDFRequest {
  fileName: string;
  fileContent: string; // Base64 encoded
}

export interface ProcessPDFResponse {
  success: boolean;
  extractedText: string;
  pageCount: number;
  message?: string;
}
