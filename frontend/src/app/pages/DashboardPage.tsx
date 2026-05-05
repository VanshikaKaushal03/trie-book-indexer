import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen,
  Plus,
  Calendar,
  FileText,
  Hash,
  LogOut,
  Loader2,
  FolderOpen,
  Sparkles,
  ChevronRight,
  Pencil,
  Trash2,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuth, apiFetch } from "../../lib/auth";
import { FloatingParticles } from "../components/FloatingParticles";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProjectSummary {
  id: string;
  name: string;
  created_at: string | null;
  stats: {
    total_words?: number;
    total_pages?: number;
    total_excluded?: number;
  };
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Inline rename input
// ---------------------------------------------------------------------------
function InlineRename({
  initialName,
  onSave,
  onCancel,
}: {
  initialName: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onSave(value.trim());
    if (e.key === "Escape") onCancel();
  };

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKey}
        maxLength={100}
        className="h-8 text-sm bg-zinc-900/80 border-zinc-700 text-white focus:ring-zinc-600 flex-1 min-w-0"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={(e) => { e.stopPropagation(); onSave(value.trim()); }}
        className="text-emerald-400 hover:text-emerald-300 transition-colors flex-shrink-0"
        title="Save"
      >
        <Check className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onCancel(); }}
        className="text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0"
        title="Cancel"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete confirmation inline banner
// ---------------------------------------------------------------------------
function DeleteConfirm({
  projectName,
  onConfirm,
  onCancel,
}: {
  projectName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="mt-3 p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 flex items-start gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-rose-300 text-xs mb-2">
          Delete <span className="font-medium">"{projectName}"</span>? This cannot be undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="text-xs px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-md transition-colors font-medium"
          >
            Delete
          </button>
          <button
            onClick={onCancel}
            className="text-xs px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Project Card
// ---------------------------------------------------------------------------
function ProjectCard({
  project,
  onClick,
  onRename,
  onDelete,
}: {
  project: ProjectSummary;
  onClick: () => void;
  onRename: (newName: string) => Promise<string | null>; // returns error msg or null
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);

  const handleSaveRename = async (newName: string) => {
    if (!newName || newName === project.name) { setIsEditing(false); return; }
    setIsRenaming(true);
    const err = await onRename(newName);
    setIsRenaming(false);
    if (err) {
      setRenameError(err);
      setTimeout(() => setRenameError(null), 3500);
    } else {
      setIsEditing(false);
    }
  };

  return (
    <motion.div
      layout
      className="rounded-2xl border border-zinc-500/20 p-5 transition-all duration-200 hover:border-zinc-400/40 group"
      style={{
        backdropFilter: "blur(20px)",
        background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
      }}
      whileHover={{ scale: 1.01, y: -1 }}
    >
      {/* Top row */}
      <div className="flex items-start gap-3 mb-4">
        {/* Book icon */}
        <div
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-600 to-slate-700 flex items-center justify-center flex-shrink-0 shadow-lg cursor-pointer mt-0.5"
          onClick={onClick}
        >
          <BookOpen className="w-4 h-4 text-white" />
        </div>

        {/* Name / edit area */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <InlineRename
              initialName={project.name}
              onSave={handleSaveRename}
              onCancel={() => { setIsEditing(false); setRenameError(null); }}
            />
          ) : (
            <div className="flex items-start justify-between gap-1">
              <button
                onClick={onClick}
                className="text-white font-medium text-left truncate max-w-[170px] hover:text-zinc-200 transition-colors leading-snug"
                title={project.name}
              >
                {project.name}
              </button>
              {/* Action icons — appear on hover */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  id={`rename-btn-${project.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(false);
                    setIsEditing(true);
                  }}
                  className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/60 transition-all"
                  title="Rename project"
                >
                  {isRenaming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pencil className="w-3.5 h-3.5" />}
                </button>
                <button
                  id={`delete-btn-${project.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(false);
                    setShowDeleteConfirm((v) => !v);
                  }}
                  className="p-1 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                  title="Delete project"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onClick}
                  className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/60 transition-all"
                  title="Open project"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          <p className="text-zinc-500 text-xs flex items-center gap-1 mt-1">
            <Calendar className="w-3 h-3" />
            {formatDate(project.created_at)}
          </p>
        </div>
      </div>

      {/* Rename error */}
      <AnimatePresence>
        {renameError && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-rose-400 text-xs mb-3 px-1"
          >
            {renameError}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <DeleteConfirm
            projectName={project.name}
            onConfirm={() => { setShowDeleteConfirm(false); onDelete(); }}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}
      </AnimatePresence>

      {/* Stats row */}
      {!showDeleteConfirm && (
        <div className="grid grid-cols-3 gap-2">
          <StatPill icon={<Hash className="w-3 h-3" />} label="Words" value={project.stats?.total_words ?? 0} />
          <StatPill icon={<FileText className="w-3 h-3" />} label="Pages" value={project.stats?.total_pages ?? 0} />
          <StatPill icon={<FileText className="w-3 h-3" />} label="Excluded" value={project.stats?.total_excluded ?? 0} />
        </div>
      )}
    </motion.div>
  );
}

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex flex-col items-center bg-white/5 rounded-lg py-2 px-1">
      <div className="flex items-center gap-1 text-zinc-500 mb-0.5">
        {icon}
        <span className="text-[9px] uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-white font-mono text-sm">{value.toLocaleString()}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard Page
// ---------------------------------------------------------------------------
export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchProjects() {
      try {
        const res = await apiFetch("/api/projects", {}, user?.token);
        if (res.status === 401) { logout(); navigate("/login"); return; }
        const data = await res.json();
        if (!cancelled) setProjects(data.projects ?? []);
      } catch {
        if (!cancelled) setError("Failed to load projects");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchProjects();
    return () => { cancelled = true; };
  }, [user?.token, logout, navigate]);

  const handleRename = async (projectId: string, newName: string): Promise<string | null> => {
    try {
      const res = await apiFetch(
        `/api/projects/${projectId}`,
        { method: "PATCH", body: JSON.stringify({ name: newName }) },
        user?.token
      );
      const data = await res.json();
      if (data.status === "success") {
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? { ...p, name: data.name } : p))
        );
        return null; // no error
      }
      return data.message || "Failed to rename project";
    } catch {
      return "Failed to connect to server";
    }
  };

  const handleDelete = async (projectId: string) => {
    try {
      const res = await apiFetch(
        `/api/projects/${projectId}`,
        { method: "DELETE" },
        user?.token
      );
      const data = await res.json();
      if (data.status === "success") {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
      }
    } catch {
      // Silently fail — the card will still show; user can retry
    }
  };

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-zinc-950 relative overflow-hidden">
      <FloatingParticles />
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-zinc-800 rounded-full filter blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-slate-800 rounded-full filter blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-10"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-700 to-slate-700 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                My Projects
              </h1>
              <p className="text-zinc-500 text-sm">
                Welcome back, <span className="text-zinc-300">{user?.username}</span>
              </p>
            </div>
          </div>

          <Button
            id="logout-btn"
            onClick={handleLogout}
            className="bg-zinc-900 text-zinc-400 border border-zinc-700 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </Button>
        </motion.div>

        {/* New Project CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Button
            id="new-project-btn"
            onClick={() => navigate("/index")}
            className="bg-white text-black hover:bg-zinc-200 shadow-[0_0_24px_rgba(255,255,255,0.15)] h-12 px-6 text-base font-medium"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Project
          </Button>
        </motion.div>

        {/* Projects content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-24 text-rose-400">{error}</div>
        ) : projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center py-24"
          >
            <div className="w-20 h-20 mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
              <FolderOpen className="w-9 h-9 text-zinc-600" />
            </div>
            <p className="text-zinc-400 text-lg mb-2">No projects yet</p>
            <p className="text-zinc-600 text-sm mb-6">Create your first book index to get started</p>
            <Button
              onClick={() => navigate("/index")}
              className="bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Project
            </Button>
          </motion.div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {projects.map((project, i) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <ProjectCard
                    project={project}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    onRename={(newName) => handleRename(project.id, newName)}
                    onDelete={() => handleDelete(project.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
