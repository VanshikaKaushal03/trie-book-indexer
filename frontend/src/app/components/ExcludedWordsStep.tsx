import { motion } from "motion/react";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Plus, Sparkles, Check } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { useAuth, apiFetch } from "../../lib/auth";

interface ExcludedWordsStepProps {
  excludedWords: Set<string>;
  onExcludedWordsChange: (words: Set<string>) => void;
  pageFiles: File[];
  suggestedWords: {word: string, score: number}[];
  onSuggestedWordsChange: (words: {word: string, score: number}[]) => void;
  acceptedSuggestions: Set<string>;
  onAcceptedSuggestionsChange: (words: Set<string>) => void;
}

export function ExcludedWordsStep({ 
  excludedWords, 
  onExcludedWordsChange,
  pageFiles,
  suggestedWords,
  onSuggestedWordsChange,
  acceptedSuggestions,
  onAcceptedSuggestionsChange
}: ExcludedWordsStepProps) {
  const [inputWord, setInputWord] = useState("");
  const [percentile, setPercentile] = useState("10");
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
  const { user } = useAuth();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const text = await file.text();
        const words = text.split(/[\s,\n]+/).filter(w => w.trim());
        const newSet = new Set([...excludedWords, ...words.map(w => w.toLowerCase().trim())]);
        onExcludedWordsChange(newSet);
      }
    },
    accept: {
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
  });

  const suggestWords = async () => {
    setIsSuggesting(true);
    try {
      const filesWithContent = await Promise.all(
        pageFiles.map(async (file) => ({
          name: file.name,
          content: await file.text(),
        }))
      );

      const response = await apiFetch(
        "/api/indexer/suggest-exclusions",
        {
          method: "POST",
          body: JSON.stringify({ files: filesWithContent }),
        },
        user?.token
      );

      const data = await response.json();
      if (data.status === "success") {
        onSuggestedWordsChange(data.suggestions);
        const count = Math.ceil((parseInt(percentile) / 100) * data.suggestions.length);
        const topN = data.suggestions.slice(0, count).map((s: any) => s.word);
        setCurrentSuggestions(topN);
      }
    } catch (error) {
      console.error("Failed to suggest words:", error);
    } finally {
      setIsSuggesting(false);
    }
  };

  const acceptAllSuggestions = () => {
    const newSet = new Set([...Array.from(acceptedSuggestions), ...currentSuggestions]);
    onAcceptedSuggestionsChange(newSet);
    setCurrentSuggestions([]);
  };

  const removeSuggestedWord = (word: string) => {
    setCurrentSuggestions(currentSuggestions.filter(w => w !== word));
  };

  const addWord = () => {
    if (inputWord.trim()) {
      const newSet = new Set(excludedWords);
      newSet.add(inputWord.toLowerCase().trim());
      onExcludedWordsChange(newSet);
      setInputWord("");
    }
  };

  const removeWord = (word: string) => {
    const newSet = new Set(excludedWords);
    newSet.delete(word);
    onExcludedWordsChange(newSet);
  };

  const removeAcceptedSuggestion = (word: string) => {
    const newSet = new Set(acceptedSuggestions);
    newSet.delete(word);
    onAcceptedSuggestionsChange(newSet);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h3 className="text-3xl bg-gradient-to-r from-zinc-300 to-slate-300 bg-clip-text text-transparent mb-2">
          Exempt Words
        </h3>
        <p className="text-zinc-200/70">
          Refine your index by excluding common or irrelevant terms
        </p>
      </div>

      {/* TF-IDF Suggestions Section */}
      <Card className="bg-white/5 border-zinc-500/20 backdrop-blur-xl p-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles className="w-24 h-24 text-slate-400" />
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 relative z-10">
          <div>
            <h4 className="text-xl text-slate-300 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Suggested Exclusions
            </h4>
            <p className="text-zinc-300/60 text-sm">Based on TF-IDF analysis of your pages</p>
          </div>
          
          <div className="flex items-center gap-3">
            <select 
              value={percentile}
              onChange={(e) => setPercentile(e.target.value)}
              className="bg-black/40 border border-zinc-500/30 rounded-md px-3 py-1.5 text-zinc-100 text-sm focus:outline-none focus:border-slate-400"
            >
              <option value="5">Bottom 5%</option>
              <option value="10">Bottom 10%</option>
              <option value="15">Bottom 15%</option>
              <option value="20">Bottom 20%</option>
              <option value="25">Bottom 25%</option>
            </select>
            
            <Button 
              onClick={suggestWords} 
              disabled={isSuggesting || pageFiles.length === 0}
              className="bg-slate-600/20 hover:bg-slate-600/30 text-slate-300 border border-slate-500/30"
            >
              {isSuggesting ? "Analyzing..." : "Suggest Words"}
            </Button>
          </div>
        </div>

        {currentSuggestions.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4"
          >
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2">
              {currentSuggestions.map((word) => (
                <Badge
                  key={word}
                  variant="outline"
                  className="bg-slate-500/10 border-slate-500/30 text-slate-100 px-3 py-1.5"
                >
                  {word}
                  <button onClick={() => removeSuggestedWord(word)} className="ml-2 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={acceptAllSuggestions}
                size="sm"
                className="bg-slate-600 hover:bg-slate-500 text-white"
              >
                <Check className="w-4 h-4 mr-2" />
                Accept All Suggestions
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-8 border border-dashed border-zinc-500/20 rounded-lg">
            <p className="text-zinc-300/40 italic">Click "Suggest Words" to see TF-IDF recommendations</p>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Card */}
        <div
          {...getRootProps()}
          className={`
            relative overflow-hidden rounded-2xl p-8 border-2 border-dashed transition-all duration-300 cursor-pointer h-full
            ${isDragActive
              ? 'border-slate-400 bg-slate-500/10 shadow-lg shadow-slate-500/20'
              : 'border-zinc-500/30 bg-white/5 hover:border-zinc-400/50 hover:bg-white/10'
            }
          `}
          style={{
            backdropFilter: 'blur(20px)',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
          }}
        >
          <input {...getInputProps()} />
          <div className="text-center">
            <Upload className="w-12 h-12 mx-auto mb-3 text-zinc-400" strokeWidth={1.5} />
            <p className="text-lg text-zinc-200 mb-1">
              {isDragActive ? 'Drop file here...' : 'Upload Exclude List'}
            </p>
            <p className="text-zinc-300/50 text-sm">.txt files supported</p>
          </div>
        </div>

        {/* Manual Add Card */}
        <Card className="bg-white/5 border-zinc-500/20 backdrop-blur-xl p-6">
          <div className="flex gap-2 mb-4">
            <Input
              value={inputWord}
              onChange={(e) => setInputWord(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addWord()}
              placeholder="Type word to exclude..."
              className="flex-1 bg-black/20 border-zinc-500/30 text-zinc-100 placeholder:text-zinc-300/30 focus:border-slate-400/50"
            />
            <Button
              onClick={addWord}
              className="bg-zinc-600 hover:bg-zinc-500"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          <p className="text-zinc-300/50 text-xs mb-2 italic">Press Enter to add quickly</p>
        </Card>
      </div>

      {/* Combined Excluded Words Display */}
      {(excludedWords.size > 0 || acceptedSuggestions.size > 0) && (
        <Card className="bg-black/20 border-zinc-500/20 p-6">
          <div className="space-y-6">
            {acceptedSuggestions.size > 0 && (
              <div>
                <p className="text-slate-400 text-sm font-medium mb-3 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Accepted Suggestions ({acceptedSuggestions.size})
                </p>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2">
                  {Array.from(acceptedSuggestions).sort().map((word) => (
                    <Badge
                      key={word}
                      variant="secondary"
                      className="bg-slate-500/20 border-slate-400/30 text-slate-100 hover:bg-slate-500/30 px-3 py-1.5"
                    >
                      {word}
                      <button onClick={() => removeAcceptedSuggestion(word)} className="ml-2">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {excludedWords.size > 0 && (
              <div>
                <p className="text-zinc-300 text-sm font-medium mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Manually Added ({excludedWords.size})
                </p>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2">
                  {Array.from(excludedWords).sort().map((word) => (
                    <Badge
                      key={word}
                      variant="secondary"
                      className="bg-zinc-500/20 border-zinc-400/30 text-zinc-100 hover:bg-zinc-500/30 px-3 py-1.5"
                    >
                      {word}
                      <button onClick={() => removeWord(word)} className="ml-2">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </motion.div>
  );
}
