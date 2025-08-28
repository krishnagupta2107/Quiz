import type { Handler, HandlerEvent } from "@netlify/functions";

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
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
