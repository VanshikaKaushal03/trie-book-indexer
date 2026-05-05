import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { User, Lock, ArrowRight, Loader2 } from "lucide-react";

interface AuthStepProps {
  onAuthSuccess: (user: { username: string; id: string }) => void;
}

export function AuthStep({ onAuthSuccess }: AuthStepProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const endpoint = isLogin ? "/api/login" : "/api/signup";
    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.status === "success") {
        if (isLogin) {
          onAuthSuccess(data.user);
        } else {
          // After signup, switch to login
          setIsLogin(true);
          setPassword("");
          setError("Account created! Please login.");
        }
      } else {
        setError(data.message || "Something went wrong");
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="text-center">
        <h2 className="text-3xl font-medium text-white mb-2">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h2>
        <p className="text-zinc-400">
          {isLogin
            ? "Enter your credentials to access the indexer"
            : "Sign up to start building your book index"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto">
        <div className="relative">
          <User className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
          <Input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="pl-10 bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:ring-zinc-700"
            required
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:ring-zinc-700"
            required
          />
        </div>

        {error && (
          <p className={`text-sm ${error.includes("created") ? "text-emerald-400" : "text-rose-400"} text-center`}>
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-white text-black hover:bg-zinc-200 h-12 text-lg font-medium shadow-[0_0_20px_rgba(255,255,255,0.15)]"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <>
              {isLogin ? "Sign In" : "Sign Up"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </form>

      <div className="text-center">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-zinc-500 hover:text-white transition-colors text-sm"
        >
          {isLogin
            ? "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </motion.div>
  );
}
