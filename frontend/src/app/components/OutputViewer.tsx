import { motion } from "motion/react";
import { useState } from "react";
import { Download, Search, TrendingUp, FileText, Sparkles, Check, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";

interface OutputViewerProps {
  indexData: Map<string, number[]>;
  totalPages: number;
  totalSuggested: number;
  acceptedSuggested: number;
  manualExcludes: number;
}

export function OutputViewer({ 
  indexData, 
  totalPages,
  totalSuggested,
  acceptedSuggested,
  manualExcludes
}: OutputViewerProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = Array.from(indexData.entries())
    .filter(([word]) => word.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a[0].localeCompare(b[0]));

  const downloadIndex = () => {
    const content = filteredData
      .map(([word, pages]) => `${word} : ${pages.join(',')}`)
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalWords = indexData.size;
  const avgPagesPerWord = totalWords > 0
    ? (Array.from(indexData.values()).reduce((sum, pages) => sum + pages.length, 0) / totalWords).toFixed(1)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="inline-block mb-4"
        >
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-zinc-500 to-slate-500 rounded-full flex items-center justify-center shadow-2xl shadow-zinc-500/50">
            <FileText className="w-10 h-10 text-white" />
          </div>
        </motion.div>
        <h3 className="text-3xl bg-gradient-to-r from-zinc-300 to-slate-300 bg-clip-text text-transparent mb-2">
          Index Generated!
        </h3>
        <p className="text-zinc-200/70">
          Your book index is ready with optimized exclusions
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <StatsCard
          icon={<FileText className="w-5 h-5" />}
          label="Total Words"
          value={totalWords.toLocaleString()}
          color="zinc"
        />
        <StatsCard
          icon={<FileText className="w-5 h-5" />}
          label="Pages Indexed"
          value={totalPages.toString()}
          color="slate"
        />
        <StatsCard
          icon={<Sparkles className="w-5 h-5" />}
          label="Suggestions Pool"
          value={totalSuggested.toString()}
          color="stone"
        />
        <StatsCard
          icon={<Check className="w-5 h-5" />}
          label="Accepted"
          value={acceptedSuggested.toString()}
          color="slate"
        />
        <StatsCard
          icon={<Plus className="w-5 h-5" />}
          label="Manual Excludes"
          value={manualExcludes.toString()}
          color="zinc"
        />
      </div>

      <Card className="bg-white/5 border-zinc-500/20 backdrop-blur-xl p-6">
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300/50" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search words..."
              className="pl-10 bg-black/20 border-zinc-500/30 text-zinc-100 placeholder:text-zinc-300/30 focus:border-slate-400/50"
            />
          </div>
          <Button
            onClick={downloadIndex}
            className="bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:from-zinc-500 hover:to-slate-500 shadow-lg"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>

        <div className="max-h-[500px] overflow-y-auto pr-2 space-y-2">
          {filteredData.length > 0 ? (
            filteredData.map(([word, pages], index) => (
              <motion.div
                key={word}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.02, 0.5) }}
                className="group flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-zinc-500/5 to-slate-500/5 border border-zinc-400/10 hover:border-slate-400/30 hover:bg-white/5 transition-all duration-200"
              >
                <span className="text-zinc-100 font-medium">{word}</span>
                <span className="text-slate-400 font-mono text-sm">
                  {pages.join(', ')}
                </span>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 text-zinc-300/50">
              No words found matching "{searchTerm}"
            </div>
          )}
        </div>

        {filteredData.length > 0 && (
          <p className="text-center text-zinc-300/50 text-sm mt-4">
            Showing {filteredData.length} of {totalWords} words
          </p>
        )}
      </Card>
    </motion.div>
  );
}

function StatsCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colorClasses = {
    zinc: "from-zinc-500/10 to-zinc-600/5 border-zinc-400/20 text-zinc-300",
    slate: "from-slate-500/10 to-slate-600/5 border-slate-400/20 text-slate-300",
    stone: "from-stone-500/10 to-stone-600/5 border-stone-400/20 text-stone-300",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} rounded-xl p-4 border flex flex-col justify-center h-full`}
    >
      <div className="flex items-center gap-2 mb-2 opacity-70">
        {icon}
        <p className="text-[10px] uppercase tracking-wider font-bold">{label}</p>
      </div>
      <p className="text-xl text-white font-mono">{value}</p>
    </motion.div>
  );
}
