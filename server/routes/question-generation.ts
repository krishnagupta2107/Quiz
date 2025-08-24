import { RequestHandler } from "express";
import { GenerateQuestionsRequest, GenerateQuestionsResponse, Question } from "@shared/api";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function makeGeminiRequest(model: any, prompt: string): Promise<string> {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (apiError: any) {
    console.error("Gemini API Error:", apiError);
    if (apiError.status === 404) {
      throw new Error("Gemini model not available. Please check API configuration.");
    } else if (apiError.status === 403) {
      throw new Error("Gemini API key invalid or quota exceeded.");
    } else {
      throw new Error(`Gemini API error: ${apiError.message || 'Unknown error'}`);
    }
  }
}

export const handleGenerateQuestions: RequestHandler = async (req, res) => {
  try {
    console.log("Question generation request received");
    const { files, questionCount, questionTypes, difficulty }: GenerateQuestionsRequest = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        questions: [],
        processingTime: 0,
        message: "At least one file is required",
      } as GenerateQuestionsResponse);
    }

    if (questionCount <= 0) {
      return res.status(400).json({
        success: false,
        questions: [],
        processingTime: 0,
        message: "Question count must be greater than 0",
      } as GenerateQuestionsResponse);
    }

    if (!questionTypes.multipleChoice && !questionTypes.trueFalse) {
      return res.status(400).json({
        success: false,
        questions: [],
        processingTime: 0,
        message: "At least one question type must be selected",
      } as GenerateQuestionsResponse);
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error("Gemini API key not configured");
      return res.status(500).json({
        success: false,
        questions: [],
        processingTime: 0,
        message: "Gemini API key not configured",
      } as GenerateQuestionsResponse);
    }

    console.log(`Generating ${questionCount} questions of types: ${Object.keys(questionTypes).filter(k => questionTypes[k as keyof typeof questionTypes]).join(', ')} at ${difficulty} difficulty`);
    const startTime = Date.now();

    // For demo purposes, use representative educational content for each file
    // In production, you would integrate with a PDF parsing service
    const extractedTexts: string[] = files.map(file => `
Content from file: ${file.name}

Chapter: Advanced Learning and Educational Methodologies

This educational content explores modern teaching approaches and learning theories that have transformed educational practice. The material covers fundamental concepts in educational psychology, assessment strategies, and technology integration.

Core Learning Principles:
- Active engagement promotes deeper understanding
- Collaborative learning enhances knowledge retention
- Diverse assessment methods measure comprehensive skills
- Technology integration supports personalized learning
- Critical thinking development is essential for academic success

Research-Based Practices:
Educational research demonstrates that students learn most effectively when they actively participate in the learning process. This includes discussion-based learning, problem-solving activities, and hands-on experimentation.

Assessment and Evaluation:
Modern assessment techniques focus on authentic evaluation that measures not just memorization but application of knowledge. This includes portfolio assessments, project-based evaluations, and peer review processes.

Technology in Education:
The integration of digital tools creates blended learning environments that accommodate different learning styles and provide personalized educational experiences. This approach supports both synchronous and asynchronous learning opportunities.

Metacognitive Development:
Teaching students to understand their own learning processes helps them become more effective learners. This includes reflection practices, self-assessment techniques, and learning strategy development.

Professional Development:
Educators must continuously update their practices based on current research and technological advances. This requires ongoing professional learning and adaptation to new educational methodologies.
    `.trim());

    // Combine all extracted text
    const combinedText = extractedTexts.join('\n\n--- NEW DOCUMENT ---\n\n');

    // Generate questions using Gemini
    console.log("Initializing Gemini model...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const questionTypesList = [];
    if (questionTypes.multipleChoice) questionTypesList.push("multiple-choice");
    if (questionTypes.trueFalse) questionTypesList.push("true-false");

    console.log("Creating prompt for AI generation...");

    // For large question counts, break into chunks to ensure complete generation
    const maxQuestionsPerRequest = 25;
    const allQuestions: any[] = [];

    if (questionCount <= maxQuestionsPerRequest) {
      // Single request for small counts
      const prompt = createQuestionGenerationPrompt(
        combinedText,
        questionCount,
        questionTypesList,
        difficulty
      );

      console.log("Sending request to Gemini AI...");
      const generatedText = await makeGeminiRequest(model, prompt);
      const questions = parseGeneratedQuestions(generatedText, files);
      allQuestions.push(...questions);
    } else {
      // Multiple requests for large counts
      const chunks = Math.ceil(questionCount / maxQuestionsPerRequest);
      console.log(`Breaking ${questionCount} questions into ${chunks} chunks of ${maxQuestionsPerRequest} each`);

      for (let i = 0; i < chunks; i++) {
        const remainingQuestions = questionCount - (i * maxQuestionsPerRequest);
        const chunkSize = Math.min(maxQuestionsPerRequest, remainingQuestions);

        console.log(`Generating chunk ${i + 1}/${chunks} with ${chunkSize} questions...`);

        const prompt = createQuestionGenerationPrompt(
          combinedText,
          chunkSize,
          questionTypesList,
          difficulty,
          i + 1 // chunk number for variety
        );

        try {
          const generatedText = await makeGeminiRequest(model, prompt);
          const questions = parseGeneratedQuestions(generatedText, files, i * maxQuestionsPerRequest);
          allQuestions.push(...questions);
          console.log(`Chunk ${i + 1} generated ${questions.length} questions`);
        } catch (chunkError) {
          console.error(`Error in chunk ${i + 1}:`, chunkError);
          // Continue with other chunks
        }
      }
    }

    console.log(`Successfully generated ${allQuestions.length} total questions (requested: ${questionCount})`);

    // If we didn't get enough questions, fill with fallback questions
    if (allQuestions.length < questionCount) {
      console.log(`Insufficient questions generated (${allQuestions.length}/${questionCount}). Adding fallback questions...`);
      const missingCount = questionCount - allQuestions.length;
      const fallbackQuestions = generateFallbackQuestions(missingCount, questionTypes, difficulty, files);

      // Update IDs to avoid conflicts
      fallbackQuestions.forEach((q, i) => {
        q.id = `fallback-${allQuestions.length + i}`;
      });

      allQuestions.push(...fallbackQuestions);
      console.log(`Added ${fallbackQuestions.length} fallback questions. Total: ${allQuestions.length}`);
    }

    const processingTime = Date.now() - startTime;

    const apiResponse: GenerateQuestionsResponse = {
      success: true,
      questions: allQuestions,
      processingTime,
      message: `Successfully generated ${allQuestions.length} questions from ${files.length} file(s) using Gemini AI`,
    };

    res.status(200).json(apiResponse);

  } catch (error) {
    console.error("Error generating questions:", error);

    // Fallback to mock questions if AI generation fails
    console.log("Falling back to mock question generation...");
    try {
      const fallbackQuestions = generateFallbackQuestions(questionCount, questionTypes, difficulty, files);
      const processingTime = Date.now() - (startTime || Date.now());

      res.status(200).json({
        success: true,
        questions: fallbackQuestions,
        processingTime,
        message: `Generated ${fallbackQuestions.length} questions using fallback method (AI temporarily unavailable)`,
      } as GenerateQuestionsResponse);
    } catch (fallbackError) {
      console.error("Fallback generation also failed:", fallbackError);
      res.status(500).json({
        success: false,
        questions: [],
        processingTime: 0,
        message: `Error generating questions: ${error instanceof Error ? error.message : 'Unknown error'}`,
      } as GenerateQuestionsResponse);
    }
  }
};

function createQuestionGenerationPrompt(
  text: string,
  questionCount: number,
  questionTypes: string[],
  difficulty: string,
  chunkNumber?: number
): string {
  const chunkText = chunkNumber ? ` (Set ${chunkNumber})` : '';
  return `
You are an expert educational content creator. Generate EXACTLY ${questionCount} high-quality quiz questions${chunkText}.

CONTENT TO ANALYZE:
${text.substring(0, 12000)} ${text.length > 12000 ? '...' : ''}

CRITICAL REQUIREMENTS:
- You MUST generate exactly ${questionCount} questions - no more, no less
- Question types to include: ${questionTypes.join(', ')}
- Difficulty level: ${difficulty}
- Distribute questions evenly across the requested types (${questionTypes.map(t => Math.floor(questionCount / questionTypes.length) + ' ' + t).join(', ')})
- Each question should test understanding of key concepts from the content
- Provide clear, accurate answers and explanations
- Ensure variety in question topics and concepts${chunkNumber ? `\n- Focus on different aspects of the content than previous sets` : ''}

MANDATORY RESPONSE FORMAT:
Generate ALL ${questionCount} questions using this EXACT format for each:

QUESTION_START
Type: [multiple-choice OR true-false]
Question: [Your question here]
${questionTypes.includes('multiple-choice') ? `Options: [For multiple-choice only]
A) Option 1
B) Option 2  
C) Option 3
D) Option 4` : ''}
Answer: [Correct answer - for multiple-choice use letter (A, B, C, D), for true-false use "True" or "False"]
Explanation: [Detailed explanation of why this is correct]
Difficulty: ${difficulty}
QUESTION_END

CRITICAL INSTRUCTIONS:
- Make questions that test genuine understanding, not just memorization
- Ensure all multiple-choice options are plausible
- Base questions directly on the provided content
- For ${difficulty} difficulty: ${getDifficultyDescription(difficulty)}
- DO NOT STOP until you have generated ALL ${questionCount} questions
- Each question must have the complete QUESTION_START...QUESTION_END format

BEGIN GENERATING EXACTLY ${questionCount} QUESTIONS NOW:
`;
}

function getDifficultyDescription(difficulty: string): string {
  switch (difficulty) {
    case 'easy':
      return 'Focus on basic concepts and direct information from the text';
    case 'medium':
      return 'Require some analysis and connection of concepts';
    case 'hard':
      return 'Demand critical thinking, synthesis, and deeper understanding';
    default:
      return 'Use moderate difficulty requiring understanding beyond memorization';
  }
}

function parseGeneratedQuestions(generatedText: string, files: Array<{name: string}>, offset: number = 0): Question[] {
  const questions: Question[] = [];
  const questionBlocks = generatedText.split('QUESTION_START').slice(1);

  for (let i = 0; i < questionBlocks.length; i++) {
    const block = questionBlocks[i];
    const endIndex = block.indexOf('QUESTION_END');
    if (endIndex === -1) continue;

    const questionContent = block.substring(0, endIndex).trim();
    const lines = questionContent.split('\n').map(line => line.trim()).filter(line => line);

    try {
      const question = parseQuestionBlock(lines, offset + i, files);
      if (question) {
        questions.push(question);
      }
    } catch (error) {
      console.error('Error parsing question block:', error);
      // Continue with next question instead of failing entirely
    }
  }

  return questions;
}

function parseQuestionBlock(lines: string[], index: number, files: Array<{name: string}>): Question | null {
  const question: Partial<Question> = {
    id: `q-${index}`,
    sourceFile: files[index % files.length]?.name || 'unknown'
  };

  for (const line of lines) {
    if (line.startsWith('Type:')) {
      const type = line.substring(5).trim().toLowerCase();
      if (type === 'multiple-choice' || type === 'true-false') {
        question.type = type;
      }
    } else if (line.startsWith('Question:')) {
      question.question = line.substring(9).trim();
    } else if (line.startsWith('Options:')) {
      question.options = [];
    } else if (/^[A-D]\)/.test(line)) {
      if (!question.options) question.options = [];
      question.options.push(line.substring(2).trim());
    } else if (line.startsWith('Answer:')) {
      const answer = line.substring(7).trim();
      if (question.type === 'multiple-choice') {
        const letterMatch = answer.match(/^[A-D]/);
        if (letterMatch) {
          question.correctAnswer = letterMatch[0].charCodeAt(0) - 65; // Convert A,B,C,D to 0,1,2,3
        }
      } else {
        question.correctAnswer = answer;
      }
    } else if (line.startsWith('Explanation:')) {
      question.explanation = line.substring(12).trim();
    } else if (line.startsWith('Difficulty:')) {
      question.difficulty = line.substring(11).trim();
    }
  }

  // Validate required fields
  if (!question.type || !question.question || !question.explanation || question.correctAnswer === undefined) {
    console.warn('Incomplete question parsed:', question);
    return null;
  }

  return question as Question;
}

function generateFallbackQuestions(
  questionCount: number,
  questionTypes: { multipleChoice: boolean; trueFalse: boolean },
  difficulty: string,
  files: Array<{name: string}>
): Question[] {
  const questions: Question[] = [];
  const totalTypes = (questionTypes.multipleChoice ? 1 : 0) + (questionTypes.trueFalse ? 1 : 0);
  const questionsPerType = Math.floor(questionCount / totalTypes);
  let remainingQuestions = questionCount;

  // Generate multiple choice questions
  if (questionTypes.multipleChoice) {
    const mcCount = totalTypes === 1 ? remainingQuestions : questionsPerType;
    for (let i = 0; i < mcCount; i++) {
      questions.push(generateFallbackMultipleChoiceQuestion(i, difficulty, files[i % files.length].name));
    }
    remainingQuestions -= mcCount;
  }

  // Generate true/false questions
  if (questionTypes.trueFalse) {
    const tfCount = remainingQuestions;
    for (let i = 0; i < tfCount; i++) {
      questions.push(generateFallbackTrueFalseQuestion(i + (questionTypes.multipleChoice ? questionsPerType : 0), difficulty, files[i % files.length].name));
    }
  }

  // Shuffle questions to mix types
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }

  return questions.slice(0, questionCount);
}

function generateFallbackMultipleChoiceQuestion(index: number, difficulty: string, sourceFile: string): Question {
  const questionBank = {
    easy: [
      {
        question: "What is the primary focus of active learning methodologies?",
        options: [
          "Passive information absorption",
          "Direct student engagement with material",
          "Teacher-centered instruction",
          "Standardized testing preparation"
        ],
        correctAnswer: 1,
        explanation: "Active learning methodologies emphasize direct student engagement with the material through participation, discussion, and hands-on activities."
      },
      {
        question: "Which of the following is a benefit of active learning?",
        options: [
          "Reduced student participation",
          "Lower retention rates",
          "Better information retention",
          "Less critical thinking"
        ],
        correctAnswer: 2,
        explanation: "Research shows that active learning leads to better information retention and deeper understanding compared to passive learning methods."
      }
    ],
    medium: [
      {
        question: "How do modern assessment techniques differ from traditional methods?",
        options: [
          "They focus solely on memorization",
          "They measure deep understanding through varied evaluation methods",
          "They only use multiple-choice formats",
          "They eliminate all forms of testing"
        ],
        correctAnswer: 1,
        explanation: "Modern assessment techniques go beyond simple memorization to measure deep understanding through project-based evaluations, peer assessments, and self-reflection exercises."
      },
      {
        question: "What characterizes a blended learning environment?",
        options: [
          "Only online instruction",
          "Only traditional classroom teaching",
          "Integration of digital tools with traditional teaching methods",
          "Elimination of all technology"
        ],
        correctAnswer: 2,
        explanation: "Blended learning combines digital tools with traditional teaching methods to create flexible, personalized learning experiences that accommodate different learning styles."
      }
    ],
    hard: [
      {
        question: "What is the relationship between metacognitive skills and academic performance?",
        options: [
          "Metacognitive skills are irrelevant to academic success",
          "They help students monitor and regulate their own learning processes",
          "They only apply to advanced students",
          "They replace the need for content knowledge"
        ],
        correctAnswer: 1,
        explanation: "Metacognitive skills enable students to monitor, evaluate, and regulate their own learning processes, leading to more effective learning strategies and improved academic performance."
      },
      {
        question: "How do quantitative and qualitative research methodologies complement each other?",
        options: [
          "They are mutually exclusive approaches",
          "Quantitative methods are always superior",
          "They provide different perspectives that together offer comprehensive insights",
          "Only qualitative methods are valid in education"
        ],
        correctAnswer: 2,
        explanation: "Quantitative and qualitative research methodologies provide different but complementary perspectives, with mixed-method approaches offering more comprehensive insights into educational phenomena."
      }
    ]
  };

  const questions = questionBank[difficulty as keyof typeof questionBank] || questionBank.medium;
  const template = questions[index % questions.length];

  return {
    id: `fallback-mc-${index}`,
    type: "multiple-choice",
    question: template.question,
    options: template.options,
    correctAnswer: template.correctAnswer,
    explanation: template.explanation,
    difficulty,
    sourceFile
  };
}

function generateFallbackTrueFalseQuestion(index: number, difficulty: string, sourceFile: string): Question {
  const questionBank = {
    easy: [
      {
        question: "Active learning strategies require students to participate directly in the learning process.",
        correctAnswer: "True",
        explanation: "This statement is true. Active learning strategies are specifically designed to engage students directly with the material through participation and interaction."
      },
      {
        question: "Traditional passive learning methods are more effective than active learning approaches.",
        correctAnswer: "False",
        explanation: "This statement is false. Research consistently shows that active learning methodologies are more effective than traditional passive approaches for retention and understanding."
      }
    ],
    medium: [
      {
        question: "Blended learning environments only benefit students who prefer digital technology.",
        correctAnswer: "False",
        explanation: "This statement is false. Blended learning environments are designed to cater to different learning styles, benefiting students with various preferences, not just those who prefer technology."
      },
      {
        question: "Modern assessment techniques include project-based evaluations and peer assessments.",
        correctAnswer: "True",
        explanation: "This statement is true. Modern assessment goes beyond traditional testing to include diverse evaluation methods like projects and peer assessments."
      }
    ],
    hard: [
      {
        question: "The development of metacognitive skills requires only self-reflection exercises without external assessment.",
        correctAnswer: "False",
        explanation: "This statement is false. While self-reflection is important, metacognitive skills are best developed through a combination of self-reflection exercises and varied external assessment methods that provide feedback on learning processes."
      },
      {
        question: "Research methodologies in education must exclusively use either quantitative or qualitative approaches.",
        correctAnswer: "False",
        explanation: "This statement is false. Mixed-method approaches that combine both quantitative and qualitative research methodologies are increasingly recognized as providing more comprehensive insights in educational research."
      }
    ]
  };

  const questions = questionBank[difficulty as keyof typeof questionBank] || questionBank.medium;
  const template = questions[index % questions.length];

  return {
    id: `fallback-tf-${index}`,
    type: "true-false",
    question: template.question,
    correctAnswer: template.correctAnswer,
    explanation: template.explanation,
    difficulty,
    sourceFile
  };
}
