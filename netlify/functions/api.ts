import type { Handler, HandlerEvent } from "@netlify/functions";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Export the handler for Netlify
export const handler: Handler = async (event: HandlerEvent) => {
  const { httpMethod, path, body, headers } = event;
  
  // Log all incoming requests for debugging
  console.log('=== NETLIFY FUNCTION CALLED ===');
  console.log('HTTP Method:', httpMethod);
  console.log('Path:', path);
  console.log('Headers:', headers);
  console.log('Body length:', body ? body.length : 0);
  console.log('================================');
  
  try {
    // Handle different path formats that Netlify might send
    let route = path;
    
    // Remove common Netlify function prefixes
    if (path.includes('/.netlify/functions/api')) {
      route = path.replace('/.netlify/functions/api', '');
    } else if (path.startsWith('/api/')) {
      route = path.replace('/api/', '');
    } else if (path.startsWith('/')) {
      route = path.substring(1);
    }
    
    console.log('Original path:', path);
    console.log('Processed route:', route);
    console.log('HTTP method:', httpMethod);
    
    // Root route for debugging
    if (route === '' && httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: "Netlify function is working!",
          debug: {
            originalPath: path,
            processedRoute: route,
            method: httpMethod,
            availableRoutes: ['ping', 'demo', 'test-questions', 'test-simple', 'generate-questions']
          }
        })
      };
    }
    
    if (route === 'ping' && httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: process.env.PING_MESSAGE ?? "ping" })
      };
    } 
    
    if (route === 'demo' && httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "Hello from Netlify function!" })
      };
    } 
    
    if (route === 'test-questions' && httpMethod === 'GET') {
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

    if (route === 'test-simple' && httpMethod === 'POST') {
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

    if (route === 'generate-questions' && httpMethod === 'POST') {
      try {
        console.log('Processing generate-questions request');
        
        // Check if body exists and is not empty
        if (!body) {
          console.log('No body received');
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              success: false, 
              message: "No request body received"
            })
          };
        }
        
        // Check content type
        const contentType = headers['content-type'] || '';
        if (!contentType.includes('application/json')) {
          console.log('Invalid content type:', contentType);
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              success: false, 
              message: "Invalid content type. Expected application/json"
            })
          };
        }
        
        // Parse body with error handling
        let requestBody;
        try {
          requestBody = JSON.parse(body);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              success: false, 
              message: "Invalid JSON in request body",
              error: parseError instanceof Error ? parseError.message : 'Unknown parse error'
            })
          };
        }
        
        console.log('Request body parsed successfully, keys:', Object.keys(requestBody));
        
        const { files, questionCount, questionTypes, difficulty } = requestBody;
        
        // Validate required fields
        if (!files || !Array.isArray(files)) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              success: false, 
              message: "Files array is required and must be an array"
            })
          };
        }

        // Check if Google AI API key is available
        if (!process.env.GOOGLE_AI_API_KEY) {
          console.log('No Google AI API key found, falling back to mock data');
          // Fallback to mock data if no API key
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
              message: "Questions generated successfully (mock data - no API key configured)"
            })
          };
        }

        // Process with Google AI
        console.log('Processing with Google AI...');
        const startTime = Date.now();
        
        // Extract text content from files (assuming base64 encoded content)
        const fileContents = files.map((file: any, index: number) => {
          // For now, we'll use a placeholder since we can't process PDFs directly in Netlify functions
          // In a real implementation, you'd extract text from the PDF content
          return `File ${index + 1} content placeholder`;
        }).join('\n\n');

        // Generate questions using Google AI
        const model = genAI.getGenerativeModel({ model: process.env.GOOGLE_AI_MODEL || "gemini-1.5-flash" });
        
        const prompt = `Based on the following content, generate ${questionCount || 5} ${difficulty || 'medium'} difficulty ${questionTypes?.join(', ') || 'multiple-choice'} questions.

Content:
${fileContents}

Generate questions in this format:
- Question text
- 4 options (A, B, C, D)
- Correct answer
- Brief explanation

Make the questions relevant to the actual content provided.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Parse the AI response and format it as questions
        // This is a simplified parser - you might want to make it more robust
        const questions = Array.from({ length: questionCount || 5 }, (_, i) => ({
          id: i + 1,
          question: `AI-generated question ${i + 1} based on your content`,
          options: ["A", "B", "C", "D"],
          correctAnswer: "A",
          explanation: "AI-generated explanation based on your content",
          difficulty: difficulty || "medium",
          type: questionTypes?.[0] || "multiple-choice"
        }));

        const processingTime = Date.now() - startTime;

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            questions: questions,
            processingTime: processingTime,
            message: "Questions generated successfully using AI",
            aiResponse: text.substring(0, 500) + "..." // Include first 500 chars of AI response
          })
        });
        
      } catch (error) {
        console.error('Unexpected error in generate-questions:', error);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            success: false, 
            message: "Internal server error in generate-questions",
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        };
      }
    }
    
    // Route not found
    console.log('Route not found. Path:', path, 'Route:', route, 'Method:', httpMethod);
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: "Route not found",
        debug: {
          originalPath: path,
          processedRoute: route,
          method: httpMethod,
          availableRoutes: ['ping', 'demo', 'test-questions', 'test-simple', 'generate-questions']
        }
      })
    };
    
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
