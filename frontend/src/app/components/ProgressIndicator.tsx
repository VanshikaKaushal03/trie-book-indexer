import { motion } from "motion/react";
import { Check } from "lucide-react";

interface ProgressIndicatorProps {
  currentStep: number;
  steps: string[];
}

export function ProgressIndicator({ currentStep, steps }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-12">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <div key={step} className="flex items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center"
            >
              <div
                className={`
                  relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                  ${isActive
                    ? 'bg-gradient-to-br from-zinc-500 to-slate-500 shadow-lg shadow-zinc-500/50'
                    : isCompleted
                    ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                    : 'bg-white/5 border-2 border-zinc-500/30'
                  }
                `}
              >
                {isCompleted ? (
                  <Check className="w-6 h-6 text-white" />
                ) : (
                  <span className={`${isActive ? 'text-white' : 'text-zinc-300/50'}`}>
                    {index + 1}
                  </span>
                )}

                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-zinc-500 to-slate-500"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  />
                )}
              </div>
              <p className={`mt-2 text-xs ${isActive ? 'text-zinc-200' : 'text-zinc-300/50'}`}>
                {step}
              </p>
            </motion.div>

            {index < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-2 transition-all duration-300 ${
                isCompleted ? 'bg-green-500' : 'bg-zinc-500/30'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
