import { RequestHandler } from "express";
import { GenerateQuestionsResponse } from "@shared/api";

export const handleTestQuestions: RequestHandler = async (req, res) => {
  try {
    // Import the question generation logic
    const { handleGenerateQuestions } = await import("./question-generation");
    
    // Create a mock request for testing
    const mockRequest = {
      body: {
        files: [
          {
            name: "test-chapter.pdf",
            content: "base64encodedcontent" // This would normally be real PDF content
          }
        ],
        questionCount: 5,
        questionTypes: {
          multipleChoice: true,
          trueFalse: true
        },
        difficulty: "medium"
      }
    } as any;

    // Call the actual question generation handler
    await handleGenerateQuestions(mockRequest, res, () => {});
    
  } catch (error) {
    console.error("Test endpoint error:", error);
    res.status(500).json({
      success: false,
      questions: [],
      processingTime: 0,
      message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    } as GenerateQuestionsResponse);
  }
};
