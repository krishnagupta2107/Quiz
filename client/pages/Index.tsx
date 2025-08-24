import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowRight, FileText, Sparkles, Users, Download } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <Sparkles className="h-12 w-12 text-primary" />
              </div>
              <h1 className="text-5xl font-bold text-foreground">QuizGen</h1>
            </div>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Transform your educational PDFs into engaging quizzes with AI-powered question generation. 
              Perfect for teachers, trainers, and educators who want to create comprehensive assessments quickly.
            </p>
            <Button size="lg" onClick={() => navigate("/")} className="px-8 py-6 text-lg">
              Get Started
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Smart PDF Processing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Upload multiple PDF chapters and our AI automatically extracts key concepts 
                  and learning objectives to generate relevant questions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  AI-Powered Generation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Generate unlimited multiple-choice and true/false questions with customizable 
                  difficulty levels and detailed answer explanations.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  Easy Export
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Review, edit, and export your questions in multiple formats. 
                  Perfect for integration with your existing teaching tools.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* How It Works */}
          <Card className="shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="text-center text-2xl">How It Works</CardTitle>
              <CardDescription className="text-center">
                Generate professional quizzes in just a few simple steps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-primary">1</span>
                  </div>
                  <h3 className="font-semibold mb-2">Upload PDFs</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload your educational PDF chapters or documents
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-primary">2</span>
                  </div>
                  <h3 className="font-semibold mb-2">Configure Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    Set question count, types, and difficulty level
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-primary">3</span>
                  </div>
                  <h3 className="font-semibold mb-2">Review & Export</h3>
                  <p className="text-sm text-muted-foreground">
                    Review generated questions and export in your preferred format
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Create Amazing Quizzes?</h2>
            <p className="text-muted-foreground mb-6">
              Join educators worldwide who are saving time and creating better assessments
            </p>
            <Button size="lg" onClick={() => navigate("/")} className="px-8 py-6 text-lg">
              Start Generating Questions
              <Sparkles className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
