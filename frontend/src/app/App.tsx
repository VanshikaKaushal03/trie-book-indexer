import { useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { FileUploadStep } from "./components/FileUploadStep";
import { ExcludedWordsStep } from "./components/ExcludedWordsStep";
import { GenerateStep } from "./components/GenerateStep";
import { OutputViewer } from "./components/OutputViewer";
import { ProgressIndicator } from "./components/ProgressIndicator";
import { HeroSection } from "./components/HeroSection";
import { Button } from "./components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth, apiFetch } from "../lib/auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type IndexerStep = "upload" | "exclude" | "generate" | "output";

const STEPS = ["Upload", "Exclude", "Generate", "View"];
const STEP_INDEX: Record<IndexerStep, number> = {
  upload: 0,
  exclude: 1,
  generate: 2,
  output: 3,
};

// ---------------------------------------------------------------------------
// ProtectedRoute — wraps any route that requires authentication
// ---------------------------------------------------------------------------

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// ---------------------------------------------------------------------------
// IndexerFlow — the multi-step upload → exclude → generate → output workflow
// ---------------------------------------------------------------------------

export function IndexerFlow() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<IndexerStep>("upload");
  const [pageFiles, setPageFiles] = useState<File[]>([]);
  const [excludedWords, setExcludedWords] = useState<Set<string>>(new Set());
  const [suggestedWords, setSuggestedWords] = useState<{ word: string; score: number }[]>([]);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<Set<string>>(new Set());
  const [indexData, setIndexData] = useState<Map<string, number[]>>(new Map());
  const [isGenerating, setIsGenerating] = useState(false);

  const loadSampleData = async () => {
    try {
      // Fetch exclude-words.txt
      const excludeRes = await fetch("/sample-files/exclude-words.txt");
      if (excludeRes.ok) {
        const excludeText = await excludeRes.text();
        const words = excludeText.split("\n").map(w => w.trim().toLowerCase()).filter(Boolean);
        setExcludedWords(new Set(words));
      }
      
      // Fetch Page1.txt, Page2.txt, etc. dynamically
      const fetchedFiles: File[] = [];
      let pageNum = 1;
      while (true) {
        const pageRes = await fetch(`/sample-files/Page${pageNum}.txt`);
        if (!pageRes.ok) break; // Stop when a page is not found (e.g. 404)
        
        const pageText = await pageRes.text();
        
        // Vite's dev server returns index.html for missing files (SPA fallback).
        // If we hit HTML instead of a text file, it means we ran out of pages.
        if (pageText.trim().startsWith("<!DOCTYPE html>") || pageText.trim().startsWith("<html")) break;
        
        fetchedFiles.push(new File([pageText], `Page${pageNum}.txt`, { type: "text/plain" }));
        pageNum++;
      }
      
      if (fetchedFiles.length > 0) {
        setPageFiles(fetchedFiles);
      }
    } catch (err) {
      console.error("Failed to load sample data:", err);
    }
  };

  const generateIndex = async (projectName: string) => {
    setIsGenerating(true);
    try {
      const filesWithContent = await Promise.all(
        pageFiles.map(async (file) => ({
          name: file.name,
          content: await file.text(),
        }))
      );

      const combinedExcludes = new Set([
        ...Array.from(excludedWords),
        ...Array.from(acceptedSuggestions),
      ]);

      const res = await apiFetch(
        "/api/indexer/process",
        {
          method: "POST",
          body: JSON.stringify({
            files: filesWithContent,
            exclude_words: Array.from(combinedExcludes),
            project_name: projectName,
          }),
        },
        user?.token
      );

      const data = await res.json();
      if (data.status === "success") {
        // Navigate directly to the saved project view — no intermediate output step
        if (data.project_id) {
          navigate(`/projects/${data.project_id}`);
        }
      } else {
        console.error("Backend error:", data.message);
      }
    } catch (err) {
      console.error("Failed to generate index:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const goNext = () => {
    const transitions: Record<IndexerStep, IndexerStep> = {
      upload: "exclude",
      exclude: "generate",
      generate: "output",
      output: "output",
    };
    setCurrentStep(transitions[currentStep]);
  };

  const goPrev = () => {
    const transitions: Record<IndexerStep, IndexerStep> = {
      upload: "upload",
      exclude: "upload",
      generate: "exclude",
      output: "generate",
    };
    setCurrentStep(transitions[currentStep]);
  };

  const canProceed = () => {
    if (currentStep === "upload") return pageFiles.length > 0;
    if (currentStep === "exclude") return true;
    if (currentStep === "generate") return pageFiles.length > 0;
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-zinc-950 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-96 h-96 bg-zinc-800 rounded-full filter blur-[120px]" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-slate-800 rounded-full filter blur-[120px]" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent mb-2">
            Smart Book Index Builder
          </h1>
        </motion.div>

        {currentStep !== "output" && (
          <ProgressIndicator currentStep={STEP_INDEX[currentStep]} steps={STEPS} />
        )}

        <div className="max-w-4xl mx-auto">
          <div
            className="rounded-2xl border border-zinc-500/20 p-8 md:p-12"
            style={{
              backdropFilter: "blur(40px)",
              background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.05) 100%)",
            }}
          >
            <AnimatePresence mode="wait">
              {currentStep === "upload" && (
                <FileUploadStep
                  key="upload"
                  files={pageFiles}
                  onFilesChange={setPageFiles}
                  onAddSample={loadSampleData}
                />
              )}
              {currentStep === "exclude" && (
                <ExcludedWordsStep
                  key="exclude"
                  excludedWords={excludedWords}
                  onExcludedWordsChange={setExcludedWords}
                  pageFiles={pageFiles}
                  suggestedWords={suggestedWords}
                  onSuggestedWordsChange={setSuggestedWords}
                  acceptedSuggestions={acceptedSuggestions}
                  onAcceptedSuggestionsChange={setAcceptedSuggestions}
                />
              )}
              {currentStep === "generate" && (
                <GenerateStep
                  key="generate"
                  isGenerating={isGenerating}
                  onGenerate={generateIndex}
                  canGenerate={pageFiles.length > 0}
                  pageCount={pageFiles.length}
                  excludedWordsCount={excludedWords.size + acceptedSuggestions.size}
                />
              )}
              {currentStep === "output" && (
                <OutputViewer
                  key="output"
                  indexData={indexData}
                  totalPages={pageFiles.length}
                  totalSuggested={suggestedWords.length}
                  acceptedSuggested={acceptedSuggestions.size}
                  manualExcludes={excludedWords.size}
                />
              )}
            </AnimatePresence>

            {currentStep !== "generate" && currentStep !== "output" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex justify-between mt-8 pt-6 border-t border-zinc-500/20"
              >
                <Button
                  onClick={goPrev}
                  disabled={currentStep === "upload"}
                  className="bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={goNext}
                  disabled={!canProceed()}
                  className="bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// App root — only the Hero. Real routing is in main.tsx via BrowserRouter.
// ---------------------------------------------------------------------------

export default function App() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <HeroSection
      onStart={() => navigate(isAuthenticated ? "/dashboard" : "/login")}
    />
  );
}
