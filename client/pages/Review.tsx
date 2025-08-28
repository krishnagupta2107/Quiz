import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Edit3, CheckCircle, XCircle, FileText, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

interface Question {
  id: string;
  type: "multiple-choice" | "true-false";
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  difficulty: string;
}

export default function ReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  useEffect(() => {
    // Get questions from the API response
    const settings = location.state;
    if (!settings) {
      navigate("/");
      return;
    }

    if (settings.questions) {
      setQuestions(settings.questions);
    } else {
      // Fallback to redirect if no questions
      navigate("/");
    }
  }, [location.state, navigate]);

  const updateQuestion = (id: string, field: string, value: any) => {
    setQuestions(prev => prev.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId && q.options 
        ? { ...q, options: q.options.map((opt, i) => i === optionIndex ? value : opt) }
        : q
    ));
  };

  const exportQuestions = async () => {
    setIsExporting(true);
    
    // Simulate export process
    setTimeout(() => {
      const dataStr = JSON.stringify(questions, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `quiz-questions-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast({
        title: "Export successful",
        description: "Questions have been exported successfully.",
      });
      
      setIsExporting(false);
    }, 1500);
  };

  const exportToPDF = async () => {
    setIsExportingPDF(true);
    
    try {
      // Create new PDF document
      const doc = new jsPDF();
      
      // Set title
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("AI Quiz Generator - Generated Questions", 20, 30);
      
      // Add generation info
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);
      doc.text(`Total Questions: ${questions.length}`, 20, 55);
      doc.text(`Source Files: ${location.state.files?.length || 0}`, 20, 65);
      
      let yPosition = 85;
      
      // Add each question
      questions.forEach((question, index) => {
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Question header
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`Question ${index + 1}`, 20, yPosition);
        
        // Question type and difficulty badges
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`${question.type} • ${question.difficulty}`, 20, yPosition + 8);
        
        // Question text
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        const questionLines = doc.splitTextToSize(question.question, 170);
        doc.text(questionLines, 20, yPosition + 20);
        
        yPosition += 25 + (questionLines.length * 5);
        
        // Options (for multiple choice)
        if (question.options && question.options.length > 0) {
          question.options.forEach((option, optIndex) => {
            const optionText = `${String.fromCharCode(65 + optIndex)}. ${option}`;
            doc.text(optionText, 25, yPosition);
            yPosition += 8;
          });
        }
        
        // Correct answer
        doc.setFont("helvetica", "bold");
        doc.text(`Correct Answer: ${question.correctAnswer}`, 20, yPosition + 5);
        
        // Explanation
        if (question.explanation) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          const explanationLines = doc.splitTextToSize(`Explanation: ${question.explanation}`, 170);
          doc.text(explanationLines, 20, yPosition + 15);
          yPosition += 20 + (explanationLines.length * 4);
        }
        
        yPosition += 15;
      });
      
      // Save the PDF
      const fileName = `quiz-questions-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast({
        title: "PDF Export successful",
        description: "Questions have been exported to PDF successfully.",
      });
      
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "PDF Export failed",
        description: "There was an error generating the PDF.",
        variant: "destructive",
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  if (!location.state) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Upload
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                  <CheckCircle className="h-8 w-8 text-accent" />
                  Review Generated Questions
                </h1>
                <p className="text-muted-foreground">
                  Review and edit your generated questions before export
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportToPDF} disabled={isExportingPDF}>
                {isExportingPDF ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Export PDF
                  </>
                )}
              </Button>
              <Button onClick={exportQuestions} disabled={isExporting}>
                {isExporting ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export JSON
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Summary Card */}
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Generation Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{questions.length}</div>
                  <div className="text-sm text-muted-foreground">Total Questions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">
                    {questions.filter(q => q.type === "multiple-choice").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Multiple Choice</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">
                    {questions.filter(q => q.type === "true-false").length}
                  </div>
                  <div className="text-sm text-muted-foreground">True/False</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{location.state.files?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Source Files</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions List */}
          <div className="space-y-6">
            {questions.map((question, index) => (
              <Card key={question.id} className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Question {index + 1}
                      <Badge variant="outline" className="ml-2">
                        {question.type === "multiple-choice" ? "Multiple Choice" : "True/False"}
                      </Badge>
                      <Badge variant="secondary" className="ml-2 capitalize">
                        {question.difficulty}
                      </Badge>
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingQuestion(
                        editingQuestion === question.id ? null : question.id
                      )}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingQuestion === question.id ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor={`question-${question.id}`}>Question</Label>
                        <Textarea
                          id={`question-${question.id}`}
                          value={question.question}
                          onChange={(e) => updateQuestion(question.id, "question", e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      {question.type === "multiple-choice" && question.options && (
                        <div>
                          <Label>Options</Label>
                          <div className="space-y-2 mt-2">
                            {question.options.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <Badge variant={question.correctAnswer === optIndex ? "default" : "outline"}>
                                  {String.fromCharCode(65 + optIndex)}
                                </Badge>
                                <Input
                                  value={option}
                                  onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                                  className="flex-1"
                                />
                                {question.correctAnswer === optIndex && (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {question.type === "true-false" && (
                        <div>
                          <Label htmlFor={`answer-${question.id}`}>Correct Answer</Label>
                          <div className="flex gap-2 mt-2">
                            <Button
                              variant={question.correctAnswer === "True" ? "default" : "outline"}
                              onClick={() => updateQuestion(question.id, "correctAnswer", "True")}
                            >
                              True
                            </Button>
                            <Button
                              variant={question.correctAnswer === "False" ? "default" : "outline"}
                              onClick={() => updateQuestion(question.id, "correctAnswer", "False")}
                            >
                              False
                            </Button>
                          </div>
                        </div>
                      )}

                      <div>
                        <Label htmlFor={`explanation-${question.id}`}>Explanation</Label>
                        <Textarea
                          id={`explanation-${question.id}`}
                          value={question.explanation}
                          onChange={(e) => updateQuestion(question.id, "explanation", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-lg mb-3">{question.question}</h3>
                      </div>

                      {question.type === "multiple-choice" && question.options && (
                        <div className="space-y-2">
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2 p-2 rounded border">
                              <Badge variant={question.correctAnswer === optIndex ? "default" : "outline"}>
                                {String.fromCharCode(65 + optIndex)}
                              </Badge>
                              <span className={question.correctAnswer === optIndex ? "font-medium" : ""}>
                                {option}
                              </span>
                              {question.correctAnswer === optIndex && (
                                <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {question.type === "true-false" && (
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {question.correctAnswer === "True" ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className={question.correctAnswer === "True" ? "font-medium" : "text-muted-foreground"}>
                              True
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {question.correctAnswer === "False" ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className={question.correctAnswer === "False" ? "font-medium" : "text-muted-foreground"}>
                              False
                            </span>
                          </div>
                        </div>
                      )}

                      <Separator />

                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Explanation:</Label>
                        <p className="text-sm mt-1">{question.explanation}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
