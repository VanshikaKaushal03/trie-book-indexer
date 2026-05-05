import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Loader2, Pencil, Check, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { OutputViewer } from "../components/OutputViewer";
import { useAuth, apiFetch } from "../../lib/auth";

interface FullProject {
  id: string;
  name: string;
  created_at: string | null;
  stats: {
    total_words: number;
    total_pages: number;
    total_excluded: number;
  };
  index: { word: string; pages: number[] }[];
}

export function ProjectViewPage() {
  const { id } = useParams<{ id: string }>();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<FullProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rename state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [isSavingName, setIsSavingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function fetchProject() {
      try {
        const res = await apiFetch(`/api/projects/${id}`, {}, user?.token);
        if (res.status === 401) {
          logout();
          navigate("/login");
          return;
        }
        if (res.status === 404) {
          if (!cancelled) setError("Project not found");
          return;
        }
        const data = await res.json();
        if (!cancelled) setProject(data.project);
      } catch {
        if (!cancelled) setError("Failed to load project");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchProject();
    return () => { cancelled = true; };
  }, [id, user?.token, logout, navigate]);

  const startEditing = () => {
    setEditNameValue(project?.name ?? "");
    setRenameError(null);
    setIsEditingName(true);
    setTimeout(() => { nameInputRef.current?.focus(); nameInputRef.current?.select(); }, 50);
  };

  const cancelEditing = () => { setIsEditingName(false); setRenameError(null); };

  const saveRename = async () => {
    const newName = editNameValue.trim();
    if (!newName || newName === project?.name) { cancelEditing(); return; }
    setIsSavingName(true);
    try {
      const res = await apiFetch(
        `/api/projects/${id}`,
        { method: "PATCH", body: JSON.stringify({ name: newName }) },
        user?.token
      );
      const data = await res.json();
      if (data.status === "success") {
        setProject((prev) => prev ? { ...prev, name: data.name } : prev);
        setIsEditingName(false);
      } else {
        setRenameError(data.message || "Failed to rename");
      }
    } catch {
      setRenameError("Failed to connect to server");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") saveRename();
    if (e.key === "Escape") cancelEditing();
  };

  // Convert API array → Map for OutputViewer
  const indexMap = new Map<string, number[]>(
    (project?.index ?? []).map(({ word, pages }) => [word, pages])
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-zinc-950 flex flex-col items-center justify-center gap-4">
        <p className="text-rose-400 text-lg">{error}</p>
        <Button onClick={() => navigate("/dashboard")} className="bg-white text-black hover:bg-zinc-200">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-zinc-950 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-zinc-800 rounded-full filter blur-[120px]" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-slate-800 rounded-full filter blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-10">
        {/* Back navigation */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Button
            id="back-to-dashboard-btn"
            onClick={() => navigate("/dashboard")}
            className="bg-zinc-900 text-zinc-400 border border-zinc-700 hover:bg-zinc-800 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </motion.div>

        {/* Project header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {/* Name row */}
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            {isEditingName ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Input
                  ref={nameInputRef}
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  onKeyDown={handleNameKeyDown}
                  maxLength={100}
                  className="text-2xl bg-zinc-900/60 border-zinc-700 text-white focus:ring-zinc-600 h-12 flex-1 min-w-0"
                />
                <button
                  onClick={saveRename}
                  disabled={isSavingName}
                  className="text-emerald-400 hover:text-emerald-300 transition-colors p-2"
                  title="Save name"
                >
                  {isSavingName ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                </button>
                <button
                  onClick={cancelEditing}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors p-2"
                  title="Cancel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-3xl bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                  {project?.name}
                </h1>
                <button
                  id="rename-project-btn"
                  onClick={startEditing}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/60 transition-all"
                  title="Rename project"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {renameError && (
            <p className="text-rose-400 text-sm mt-1">{renameError}</p>
          )}

          {project?.created_at && !isEditingName && (
            <p className="text-zinc-500 text-sm">
              Created{" "}
              {new Date(project.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </motion.div>

        {/* Read-only badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 bg-zinc-900/60 border border-zinc-700/60 rounded-full px-3 py-1 text-xs text-zinc-400 mb-6"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-pulse" />
          Read-only view
        </motion.div>

        {/* Reuse OutputViewer */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <OutputViewer
            indexData={indexMap}
            totalPages={project?.stats?.total_pages ?? 0}
            totalSuggested={0}
            acceptedSuggested={0}
            manualExcludes={project?.stats?.total_excluded ?? 0}
          />
        </motion.div>
      </div>
    </div>
  );
}
