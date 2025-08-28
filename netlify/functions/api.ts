import type { Handler, HandlerEvent } from "@netlify/functions";

// Export the handler for Netlify
export const handler: Handler = async (event: HandlerEvent) => {
  const { httpMethod, path, body, headers } = event;
  
  try {
    // Find matching route
    const route = path.replace('/.netlify/functions/api', '');
    
    if (route === '/ping' && httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: process.env.PING_MESSAGE ?? "ping" })
      };
    } 
    
    if (route === '/demo' && httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "Hello from Netlify function!" })
      };
    } 
    
    if (route === '/test-questions' && httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: "Test questions endpoint",
          questions: [
            {
              id: 1,
              question: "Sample question 1?",
              options: ["A", "B", "C", "D"],
              correctAnswer: "A"
            }
          ]
        })
      };
    }

    if (route === '/test-simple' && httpMethod === 'POST') {
      // Simple test endpoint that just echoes back the request
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: "Simple test endpoint working",
          received: {
            method: httpMethod,
            path: path,
            hasBody: !!body,
            bodyLength: body ? body.length : 0,
            contentType: headers['content-type'] || 'not-set'
          }
        })
      };
    }

    if (route === '/generate-questions' && httpMethod === 'POST') {
      try {
        const requestBody = body ? JSON.parse(body) : {};
        const { files, questionCount, questionTypes, difficulty } = requestBody;
        
        // For now, return a mock response since we can't process PDFs in Netlify functions
        // In production, you'd want to integrate with a service like Google AI or similar
        const mockQuestions = Array.from({ length: questionCount || 5 }, (_, i) => ({
          id: i + 1,
          question: `Generated question ${i + 1} from uploaded content?`,
          options: ["A", "B", "C", "D"],
          correctAnswer: "A",
          explanation: "This is a sample explanation for the generated question.",
          difficulty: difficulty || "medium",
          type: questionTypes?.[0] || "multiple-choice"
        }));

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            questions: mockQuestions,
            processingTime: 1500,
            message: "Questions generated successfully (mock data)"
          })
        };
      } catch (parseError) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            success: false, 
            message: "Invalid request body" 
          })
        };
      }
    }
    
    // Route not found
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: "Route not found" })
    };
    
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
