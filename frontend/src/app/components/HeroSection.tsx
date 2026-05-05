import { motion } from "motion/react";
import { Sparkles, Upload, Wand2, FileSearch, BookMarked } from "lucide-react";
import { Button } from "./ui/button";
import { GlareCard } from "./ui/glare-card";
import { FloatingParticles } from "./FloatingParticles";

interface HeroSectionProps {
  onStart: () => void;
}

// ---------------------------------------------------------------------------
// Workflow steps shown on the glare cards
// ---------------------------------------------------------------------------
const WORKFLOW_STEPS = [
  {
    step: "01",
    icon: Upload,
    title: "Upload Your Pages",
    description:
      "Drop in your book's text pages one by one. Supports plain .txt files — any length, any subject.",
    accent: "from-zinc-600 to-slate-700",
  },
  {
    step: "02",
    icon: FileSearch,
    title: "Smart Word Exclusion",
    description:
      "Our TF-IDF engine surfaces the most common filler words. Accept suggestions or add your own — the index stays clean.",
    accent: "from-slate-600 to-zinc-700",
  },
  {
    step: "03",
    icon: Wand2,
    title: "Trie-Powered Indexing",
    description:
      "Every word is inserted into a Trie data structure, mapping it to the exact pages it appears on — alphabetically sorted in milliseconds.",
    accent: "from-zinc-700 to-slate-600",
  },
  {
    step: "04",
    icon: BookMarked,
    title: "Download & Revisit",
    description:
      "Your index is saved to your account. Download it as a .txt file or reopen any past project from your personal dashboard.",
    accent: "from-slate-700 to-zinc-600",
  },
];

// ---------------------------------------------------------------------------
// HeroSection
// ---------------------------------------------------------------------------
export function HeroSection({ onStart }: HeroSectionProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-zinc-950 to-zinc-950">
      <FloatingParticles />

      {/* ── Hero copy ── */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 pt-28 pb-16 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-block mb-6"
        >
          <Sparkles className="w-20 h-20 text-slate-400" strokeWidth={1.5} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-6xl md:text-7xl mb-6 bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent max-w-4xl"
        >
          Build a Smart Word Index
          <br />
          from Your Book
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xl text-zinc-200 mb-12 max-w-2xl leading-relaxed"
        >
          Upload your book pages, specify common words to exclude, and generate
          a beautifully organised index that maps every word to its page numbers
          — instantly.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Button
            id="hero-start-btn"
            onClick={onStart}
            className="group relative px-8 py-6 bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.3)] shadow-2xl shadow-zinc-500/50 hover:shadow-slate-500/50 transition-all duration-300"
          >
            <span className="relative z-10 flex items-center gap-2 text-lg">
              Start Indexing
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-slate-600 to-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md" />
          </Button>
        </motion.div>
      </div>

      {/* ── How it works ── */}
      <div className="relative z-10 px-6 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="text-center mb-14"
        >
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 mb-3">
            How it works
          </p>
          <h2 className="text-3xl md:text-4xl bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
            Four steps to a perfect index
          </h2>
        </motion.div>

        {/* Cards row — horizontally scrollable on small screens */}
        <div className="flex flex-wrap justify-center gap-6 max-w-[1400px] mx-auto">
          {WORKFLOW_STEPS.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 + i * 0.12 }}
            >
              <GlareCard className="flex flex-col justify-between p-8">
                {/* Step number + icon */}
                <div className="flex items-start justify-between mb-6">
                  <span className="text-5xl font-mono text-zinc-700 leading-none select-none">
                    {step.step}
                  </span>
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${step.accent} flex items-center justify-center shadow-lg flex-shrink-0`}
                  >
                    <step.icon className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Text */}
                <div>
                  <h3 className="text-white text-xl font-semibold mb-3 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Bottom accent line */}
                <div
                  className={`mt-8 h-0.5 rounded-full bg-gradient-to-r ${step.accent} opacity-40`}
                />
              </GlareCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
