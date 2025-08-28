import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowRight, FileText, Sparkles, Users, Download } from "lucide-react";

const Index = () => {
  const testAPI = async (endpoint: string) => {
    try {
      console.log(`Testing ${endpoint}...`);
      const response = await fetch(endpoint);
      const data = await response.json();
      console.log(`${endpoint} response:`, data);
      alert(`${endpoint}: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error(`Error testing ${endpoint}:`, error);
      alert(`Error testing ${endpoint}: ${error}`);
    }
  };

  const testPostAPI = async () => {
    try {
      console.log('Testing POST /api/test-simple...');
      const response = await fetch('/api/test-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'data' }),
      });
      const data = await response.json();
      console.log('POST /api/test-simple response:', data);
      alert(`POST /api/test-simple: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('Error testing POST /api/test-simple:', error);
      alert(`Error testing POST /api/test-simple: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">QuizGen</h1>
            <p className="text-xl text-muted-foreground">
              AI-powered quiz generation from PDF content
            </p>
          </div>

          {/* API Test Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>API Testing</CardTitle>
              <CardDescription>
                Test the Netlify functions to ensure they're working correctly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => testAPI('/api/ping')} variant="outline">
                  Test /api/ping
                </Button>
                <Button onClick={() => testAPI('/api/demo')} variant="outline">
                  Test /api/demo
                </Button>
                <Button onClick={() => testAPI('/api/test-questions')} variant="outline">
                  Test /api/test-questions
                </Button>
                <Button onClick={testPostAPI} variant="outline">
                  Test POST /api/test-simple
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Upload PDFs</CardTitle>
                <CardDescription>
                  Upload your PDF chapters and let AI generate questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <a href="/upload">Get Started</a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Review Questions</CardTitle>
                <CardDescription>
                  Review and customize generated questions before finalizing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <a href="/review">Review Questions</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
