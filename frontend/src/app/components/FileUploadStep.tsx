import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { FileUpload } from "./ui/file-upload";

interface FileUploadStepProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  onAddSample: () => void;
}

export function FileUploadStep({ files, onFilesChange, onAddSample }: FileUploadStepProps) {
  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex flex-col items-center text-center mb-8">
        <h3 className="text-3xl bg-gradient-to-r from-zinc-300 to-slate-300 bg-clip-text text-transparent mb-2">
          Upload Book Pages
        </h3>
        <p className="text-zinc-200/70 mb-4">
          Add text files for each page (e.g., Page1.txt, Page2.txt)
        </p>
        <Button 
          onClick={onAddSample}
          className="bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:from-zinc-500 hover:to-slate-500 shadow-lg shadow-zinc-500/20"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Add Sample Data
        </Button>
      </div>

      <div className="w-full">
        <FileUpload
          files={files}
          onChange={onFilesChange}
          onRemove={removeFile}
          accept={{ "text/plain": [".txt"] }}
          multiple={true}
        />
      </div>
    </motion.div>
  );
}
