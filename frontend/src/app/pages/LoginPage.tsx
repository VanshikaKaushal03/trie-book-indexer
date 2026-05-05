import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { User, Lock, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuth, apiFetch } from "../../lib/auth";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";

    try {
      const response = await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (data.status === "success") {
        if (isLogin) {
          login({ id: data.user.id, username: data.user.username, token: data.token });
          navigate("/dashboard");
        } else {
          setIsLogin(true);
          setPassword("");
          setMessage({ text: "Account created! Please sign in.", isError: false });
        }
      } else {
        setMessage({ text: data.message || "Something went wrong", isError: true });
      }
    } catch {
      setMessage({ text: "Failed to connect to server", isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-zinc-950" />
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-20 left-20 w-96 h-96 bg-zinc-800 rounded-full filter blur-[120px]" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-slate-800 rounded-full filter blur-[120px]" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(14)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-slate-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              filter: "blur(1px)",
            }}
            animate={{ y: [0, -25, 0], opacity: [0.15, 0.6, 0.15] }}
            transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
          />
        ))}
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Logo / brand */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-700 to-slate-700 mb-4 shadow-2xl shadow-zinc-900/60"
          >
            <Sparkles className="w-8 h-8 text-white" strokeWidth={1.5} />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-3xl bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent mb-1"
          >
            {isLogin ? "Welcome back" : "Create account"}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-zinc-500 text-sm"
          >
            {isLogin
              ? "Sign in to access your book indexes"
              : "Join to start building intelligent book indexes"}
          </motion.p>
        </div>

        {/* Glass card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-zinc-500/20 p-8"
          style={{
            backdropFilter: "blur(40px)",
            background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.03) 100%)",
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              <Input
                id="login-username"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:ring-zinc-700 h-12"
                required
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              <Input
                id="login-password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:ring-zinc-700 h-12"
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
            </div>

            {/* Feedback */}
            {message && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-sm text-center ${message.isError ? "text-rose-400" : "text-emerald-400"}`}
              >
                {message.text}
              </motion.p>
            )}

            <Button
              id="auth-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black hover:bg-zinc-200 h-12 text-base font-medium shadow-[0_0_20px_rgba(255,255,255,0.15)] mt-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In" : "Sign Up"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              id="auth-toggle-btn"
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setMessage(null);
                setPassword("");
              }}
              className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </motion.div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/")}
            className="text-zinc-600 hover:text-zinc-400 transition-colors text-xs"
          >
            ← Back to home
          </button>
        </div>
      </motion.div>
    </div>
  );
}
