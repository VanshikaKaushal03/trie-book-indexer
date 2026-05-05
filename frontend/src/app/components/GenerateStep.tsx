import { useState } from "react";
import { motion } from "motion/react";
import { Zap, Loader2, Pencil } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";

interface GenerateStepProps {
  isGenerating: boolean;
  onGenerate: (projectName: string) => void;
  canGenerate: boolean;
  pageCount: number;
  excludedWordsCount: number;
}

export function GenerateStep({
  isGenerating,
  onGenerate,
  canGenerate,
  pageCount,
  excludedWordsCount,
}: GenerateStepProps) {
  const [projectName, setProjectName] = useState("");

  const handleGenerate = () => {
    onGenerate(projectName.trim());
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
          Generate Index
        </h3>
        <p className="text-zinc-200/70">
          Name your project and process your pages
        </p>
      </div>

      <Card className="bg-white/5 border-zinc-500/20 backdrop-blur-xl p-8">
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-zinc-500/10 to-zinc-600/5 rounded-xl p-6 border border-zinc-400/20"
            >
              <p className="text-zinc-300/70 text-sm mb-1">Total Pages</p>
              <p className="text-4xl text-zinc-100">{pageCount}</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-slate-500/10 to-slate-600/5 rounded-xl p-6 border border-slate-400/20"
            >
              <p className="text-slate-300/70 text-sm mb-1">Excluded Words</p>
              <p className="text-4xl text-slate-100">{excludedWordsCount}</p>
            </motion.div>
          </div>

          {/* Project name input */}
          <div>
            <label className="block text-zinc-400 text-sm mb-2">
              Project Name <span className="text-zinc-600">(optional)</span>
            </label>
            <div className="relative">
              <Pencil className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              <Input
                id="project-name-input"
                type="text"
                placeholder="e.g. Introduction to Algorithms — Ch. 3"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                disabled={isGenerating}
                maxLength={100}
                className="pl-10 bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:ring-zinc-700"
              />
            </div>
            <p className="text-zinc-600 text-xs mt-1">
              Leave blank for an auto-generated name. HTML is stripped automatically.
            </p>
          </div>

          {/* Generate button */}
          <div className="relative">
            <motion.div
              animate={{
                boxShadow:
                  canGenerate && !isGenerating
                    ? [
                        "0 0 20px rgba(255, 255, 255, 0.3)",
                        "0 0 40px rgba(255, 255, 255, 0.5)",
                        "0 0 20px rgba(255, 255, 255, 0.3)",
                      ]
                    : "0 0 0px rgba(0, 0, 0, 0)",
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="rounded-xl"
            >
              <Button
                id="generate-index-btn"
                onClick={handleGenerate}
                disabled={!canGenerate || isGenerating}
                className="w-full py-8 text-xl bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:from-zinc-500 hover:to-slate-500 disabled:from-gray-700 disabled:to-gray-600 disabled:opacity-50 shadow-2xl transition-all duration-300"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6 mr-3" />
                    Generate Index
                  </>
                )}
              </Button>
            </motion.div>
          </div>

          {!canGenerate && !isGenerating && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-zinc-300/50 text-sm"
            >
              Please upload at least one page file to continue
            </motion.p>
          )}

          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {[
                "Parsing page files",
                "Filtering excluded words",
                "Building index map",
                "Sorting alphabetically",
                "Saving project",
              ].map((step, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.3 }}
                  className="flex items-center gap-3 text-zinc-200/70"
                >
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" />
                  {step}
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
