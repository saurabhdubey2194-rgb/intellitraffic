import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, File, Image as ImageIcon, Video, Music, X, AlertCircle, Loader2, CheckCircle2, ArrowRight, FileSearch, Globe } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

export default function AnalyzePage() {
  const [, navigate] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const selected = e.dataTransfer.files?.[0];
    if (selected) {
      validateAndSetFile(selected);
    }
  }, []);

  const validateAndSetFile = (selected: File) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'text/plain', 'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(selected.type) && 
        !selected.type.startsWith('image/') && 
        !selected.type.startsWith('video/') && 
        !selected.type.startsWith('audio/') &&
        !selected.name.endsWith('.url')) {
      toast.error("Unsupported file type. Please upload images, videos, audio, or documents.");
      return;
    }

    if (selected.size > 50 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 50MB.");
      return;
    }
    setFile(selected);
  };
  
  const uploadMutation = trpc.analysis.upload.useMutation({
    onSuccess: (data) => {
      toast.success("Upload complete. Analysis starting...");
      navigate(`/analysis/${data.jobId}`);
    },
    onError: (err: any) => {
      setUploading(false);
      toast.error(err.message || "Upload failed");
    }
  });

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      validateAndSetFile(selected);
    }
  };

  const removeFile = () => setFile(null);

  const startAnalysis = async () => {
    if (!file) return;
    
    setUploading(true);
    setProgress(10);
    
    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        setProgress(50);
        
        let type: "image" | "video" | "audio" | "text" | "url" | "document" = "image";
        if (file.type.startsWith("video/")) type = "video";
        else if (file.type.startsWith("audio/")) type = "audio";
        else if (file.type.startsWith("text/")) type = "text";
        else if (file.type.includes("pdf") || file.type.includes("word") || file.type.includes("officedocument")) type = "document";
        else if (file.name.endsWith(".url")) type = "url";
        
        uploadMutation.mutate({
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
          base64,
          type,
        });
        setProgress(90);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploading(false);
      toast.error("Failed to process file");
    }
  };

  const getFileIcon = () => {
    if (!file) return <Upload className="h-10 w-10" />;
    if (file.type.startsWith("image/")) return <ImageIcon className="h-10 w-10 text-blue-500" />;
    if (file.type.startsWith("video/")) return <Video className="h-10 w-10 text-purple-500" />;
    if (file.type.startsWith("audio/")) return <Music className="h-10 w-10 text-amber-500" />;
    if (file.type.includes("pdf") || file.type.includes("word")) return <FileSearch className="h-10 w-10 text-emerald-500" />;
    if (file.name.endsWith(".url")) return <Globe className="h-10 w-10 text-sky-500" />;
    return <File className="h-10 w-10 text-muted-foreground" />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Authenticity Analysis</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Upload media to detect manipulations, deepfakes, and generative AI artifacts.
        </p>
      </div>

      <Card 
        className={`border-dashed border-2 transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-500/5' : 'border-border/60 bg-muted/30'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="pt-10 pb-10">
          {!file ? (
            <div className="flex flex-col items-center justify-center text-center space-y-4 min-h-[200px]">
              <div className="h-20 w-20 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Upload className="h-10 w-10 text-blue-500" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-medium">Drag and drop media files</p>
                <p className="text-sm text-muted-foreground">
                  Support for Images, Video (MP4/WebM), and Audio (MP3/WAV) up to 50MB
                </p>
              </div>
              <label className="cursor-pointer">
                <Button variant="secondary" className="pointer-events-none">
                  Select Files
                </Button>
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={onFileChange}
                  accept="image/*,video/*,audio/*,text/plain"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-background border border-border/40">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                    {getFileIcon()}
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium truncate max-w-[200px] md:max-w-md">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type}
                    </p>
                  </div>
                </div>
                {!uploading && (
                  <Button variant="ghost" size="icon" onClick={removeFile}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {uploading ? (
                <div className="space-y-4">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Uploading & Pre-processing...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Securely encrypting and transmitting to analysis cluster
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button onClick={startAnalysis} className="flex-1 bg-blue-600 hover:bg-blue-500 h-12 text-base shadow-lg shadow-blue-600/20">
                    Start Full Forensic Analysis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={removeFile} className="h-12">
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Alert className="bg-blue-500/5 border-blue-500/20">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <AlertTitle>Privacy Notice</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            All files are processed in an isolated environment and automatically deleted after 24 hours unless added to a case.
          </AlertDescription>
        </Alert>
        <Alert className="bg-emerald-500/5 border-emerald-500/20">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <AlertTitle>Multi-Model Verification</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            We use a combination of GAN artifact detection, facial inconsistency analysis, and frequency domain forensic checks.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
