import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, FileText, Settings, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function UploadPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [questionCount, setQuestionCount] = useState("10");
  const [questionTypes, setQuestionTypes] = useState({
    multipleChoice: true,
    trueFalse: true,
  });
  const [difficulty, setDifficulty] = useState("medium");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type === "application/pdf"
    );

    // Filter out files that are too large (>10MB)
    const validFiles = droppedFiles.filter(file => file.size <= 10 * 1024 * 1024);
    const oversizedFiles = droppedFiles.filter(file => file.size > 10 * 1024 * 1024);

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      toast({
        title: "Files uploaded",
        description: `${validFiles.length} PDF file(s) added successfully.`,
      });
    }

    if (oversizedFiles.length > 0) {
      toast({
        title: "Files too large",
        description: `${oversizedFiles.length} file(s) exceeded 10MB limit and were skipped.`,
        variant: "destructive",
      });
    }

    if (droppedFiles.length === 0) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF files only.",
        variant: "destructive",
      });
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).filter(
      file => file.type === "application/pdf"
    );

    // Filter out files that are too large (>10MB)
    const validFiles = selectedFiles.filter(file => file.size <= 10 * 1024 * 1024);
    const oversizedFiles = selectedFiles.filter(file => file.size > 10 * 1024 * 1024);

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      toast({
        title: "Files uploaded",
        description: `${validFiles.length} PDF file(s) added successfully.`,
      });
    }

    if (oversizedFiles.length > 0) {
      toast({
        title: "Files too large",
        description: `${oversizedFiles.length} file(s) exceeded 10MB limit and were skipped.`,
        variant: "destructive",
      });
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const generateQuestions = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one PDF file.",
        variant: "destructive",
      });
      return;
    }

    if (!questionTypes.multipleChoice && !questionTypes.trueFalse) {
      toast({
        title: "No question types selected",
        description: "Please select at least one question type.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Convert files to base64
      const filePromises = files.map(file => new Promise<{name: string, content: string}>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve({ name: file.name, content: base64 });
        };
        reader.readAsDataURL(file);
      }));

      const processedFiles = await Promise.all(filePromises);

      // Call the API to generate questions
      console.log('Sending request to API with:', {
        filesCount: processedFiles.length,
        questionCount: parseInt(questionCount),
        questionTypes,
        difficulty,
        firstFileSize: processedFiles[0]?.length || 0
      });

      // For debugging, let's try with a smaller payload first
      const testPayload = {
        files: processedFiles.slice(0, 1), // Only send first file for testing
        questionCount: parseInt(questionCount),
        questionTypes,
        difficulty,
      };

      console.log('Test payload size:', JSON.stringify(testPayload).length, 'characters');

      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testPayload),
      });

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        
        if (response.status === 413) {
          throw new Error("Files are too large. Please try smaller PDF files (under 10MB each).");
        }
        throw new Error(`Server error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Questions generated successfully",
          description: `Generated ${result.questions.length} questions in ${(result.processingTime / 1000).toFixed(1)}s`,
        });

        navigate("/review", {
          state: {
            questions: result.questions,
            files: files.map(f => f.name),
            questionCount: parseInt(questionCount),
            questionTypes,
            difficulty
          }
        });
      } else {
        throw new Error(result.message || "Failed to generate questions");
      }
    } catch (error) {
      console.error("Error generating questions:", error);
      toast({
        title: "Error generating questions",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold text-foreground">AI Quiz Generator</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transform your PDF chapters into engaging quizzes with AI-powered question generation
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload PDF Chapters
                </CardTitle>
                <CardDescription>
                  Upload one or more PDF files to generate questions from
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-primary/50"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("file-input")?.click()}
                >
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Drop PDF files here</h3>
                  <p className="text-muted-foreground mb-2">
                    or click to browse your files
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Maximum file size: 10MB per file
                  </p>
                  <Button variant="outline">Choose Files</Button>
                  <input
                    id="file-input"
                    type="file"
                    multiple
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </div>

                {/* File List */}
                {files.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Uploaded Files:</h4>
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024 / 1024).toFixed(1)} MB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Settings Section */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Question Settings
                </CardTitle>
                <CardDescription>
                  Customize your quiz generation preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Number of Questions */}
                <div className="space-y-2">
                  <Label htmlFor="question-count">Number of Questions</Label>
                  <Input
                    id="question-count"
                    type="number"
                    min="1"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(e.target.value)}
                    placeholder="Enter number of questions"
                  />
                </div>

                {/* Question Types */}
                <div className="space-y-3">
                  <Label>Question Types</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="multiple-choice"
                        checked={questionTypes.multipleChoice}
                        onCheckedChange={(checked) =>
                          setQuestionTypes(prev => ({ ...prev, multipleChoice: !!checked }))
                        }
                      />
                      <Label htmlFor="multiple-choice">Multiple Choice</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="true-false"
                        checked={questionTypes.trueFalse}
                        onCheckedChange={(checked) =>
                          setQuestionTypes(prev => ({ ...prev, trueFalse: !!checked }))
                        }
                      />
                      <Label htmlFor="true-false">True/False</Label>
                    </div>
                  </div>
                </div>

                {/* Difficulty Level */}
                <div className="space-y-3">
                  <Label>Difficulty Level</Label>
                  <RadioGroup value={difficulty} onValueChange={setDifficulty}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="easy" id="easy" />
                      <Label htmlFor="easy">Easy</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="medium" />
                      <Label htmlFor="medium">Medium</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="hard" id="hard" />
                      <Label htmlFor="hard">Hard</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Generate Button */}
          <div className="mt-8 text-center">
            <Button
              size="lg"
              className="px-8 py-6 text-lg"
              onClick={generateQuestions}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Generating Questions...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Questions
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
