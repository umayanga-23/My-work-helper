import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Search,
  CheckSquare,
  ArrowRight,
  Trash2,
  Edit,
  Sparkles
} from 'lucide-react';
import { ProjectModal } from '../components/projects/ProjectModal';
import { ProjectWorkspaceDetail } from '../components/projects/ProjectWorkspaceDetail';
import { AiProjectPrdModal } from '../components/projects/AiProjectPrdModal';
import { Project, ProjectStatus } from '../types';
import { projectService } from '../services/projectService';
import { useConfirm } from '../contexts/ConfirmDialogContext';
import { clsx } from 'clsx';

export const ProjectsPage: React.FC = () => {
  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectParam = searchParams.get('id');

  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState<string>('ALL');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projectParam || null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);
  const [prdProject, setPrdProject] = useState<Project | null>(null);
  const [workspaceVersion, setWorkspaceVersion] = useState(0);

  useEffect(() => {
    if (projectParam) {
      setSelectedProjectId(projectParam);
    }
  }, [projectParam]);

  const loadProjects = async () => {
    try {
      const statusParam = activeStatus !== 'ALL' ? (activeStatus as ProjectStatus) : undefined;
      const fetched = await projectService.getProjects({
        status: statusParam,
        search: search || undefined,
      });
      setProjects(fetched);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [search, activeStatus]);

  const handleDelete = async (e: React.MouseEvent, id: string, name?: string) => {
    e.stopPropagation();
    const ok = await confirm({
      title: 'Delete Project',
      message: `Are you sure you want to delete "${name || 'this project'}"?`,
      description: 'Linked tasks and resources will be safely unlinked from this project.',
      confirmText: 'Delete Project',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await projectService.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert('Failed to delete project. Please try again.');
    }
  };

  const handleSaveProject = async (projectData: Partial<Project>) => {
    if (editingProject) {
      const updated = await projectService.updateProject(editingProject.id, projectData);
      setProjects((prev) =>
        prev.map((p) => (p.id === editingProject.id ? updated : p))
      );
      setWorkspaceVersion((v) => v + 1);
    } else {
      const created = await projectService.createProject(projectData);
      setProjects((prev) => [created, ...prev]);
    }
    setEditingProject(undefined);
    setModalOpen(false);
  };

  const statusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'PLANNING': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'ON_HOLD': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'COMPLETED': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default: return 'bg-[#E8F7EF] dark:bg-[#13261C] text-[#66736B] dark:text-[#9BB5A5] border-[#DCE9E1] dark:border-[#20372B]';
    }
  };

  if (selectedProjectId) {
    return (
      <>
        <ProjectWorkspaceDetail
          key={`${selectedProjectId}-${workspaceVersion}`}
          projectId={selectedProjectId}
          onBack={() => {
            setSelectedProjectId(null);
            setSearchParams({});
          }}
          onEdit={(proj) => {
            setEditingProject(proj);
            setModalOpen(true);
          }}
        />
        <ProjectModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingProject(undefined);
          }}
          onSave={handleSaveProject}
          initialProject={editingProject}
        />
      </>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-purple-400" />
            Projects & Unified Workspaces
          </h1>
          <p className="text-xs sm:text-sm text-[#66736B] dark:text-[#9BB5A5]">
            Unified project command centers aggregating tasks, notes, documents, and resources.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingProject(undefined);
            setModalOpen(true);
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-[#5FBF8F]/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Project
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-3 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B]">
        <div className="flex items-center gap-1 p-1 bg-[#F3FBF7] dark:bg-[#08120D]/60 rounded-xl border border-[#DCE9E1] dark:border-[#20372B] overflow-x-auto">
          {['ALL', 'ACTIVE', 'PLANNING', 'ON_HOLD', 'COMPLETED'].map((st) => (
            <button
              key={st}
              onClick={() => setActiveStatus(st)}
              className={clsx(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
                activeStatus === st
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF]'
              )}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#8A9890] dark:text-[#6F8A7A] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search project names or descriptions..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-xs text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] outline-none focus:border-[#5FBF8F]"
          />
        </div>
      </div>

      {/* Grid of Project Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-full p-12 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] text-center space-y-3">
            <Briefcase className="w-12 h-12 text-[#66736B] dark:text-[#9BB5A5] mx-auto" />
            <h3 className="text-lg font-semibold text-[#17211B] dark:text-[#EAF7EF]">No projects found</h3>
            <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] max-w-sm mx-auto">
              Create your first project command center to link all workspace resources together.
            </p>
          </div>
        ) : (
          projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => setSelectedProjectId(proj.id)}
              className="p-5 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] hover:border-[#5FBF8F] transition-all duration-200 shadow-xl flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span
                    className={clsx(
                      'px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider',
                      statusBadge(proj.status)
                    )}
                  >
                    {proj.status}
                  </span>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProject(proj);
                        setModalOpen(true);
                      }}
                      className="p-1 text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] rounded"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, proj.id, proj.name)}
                      className="p-1 text-[#66736B] dark:text-[#9BB5A5] hover:text-rose-400 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-[#17211B] dark:text-[#EAF7EF] text-base group-hover:text-purple-400 transition-colors line-clamp-1 mb-1">
                  {proj.name}
                </h3>

                {proj.description && (
                  <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] line-clamp-2 mb-4">{proj.description}</p>
                )}

                {/* Progress Metric */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#66736B] dark:text-[#9BB5A5]">Progress Rate</span>
                    <span className="text-purple-400">{proj.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#E8F7EF] dark:bg-[#13261C] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-brand-400 rounded-full"
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between text-xs text-[#66736B] dark:text-[#9BB5A5] flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[11px]">
                    <CheckSquare className="w-3.5 h-3.5 text-[#8A9890] dark:text-[#6F8A7A]" />
                    {proj.completedTaskCount || 0}/{proj.taskCount || 0}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPrdProject(proj);
                    }}
                    className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 flex items-center gap-1 cursor-pointer"
                    title="Generate AI PRD & Milestones"
                  >
                    <Sparkles className="w-3 h-3" /> AI PRD
                  </button>
                </div>

                <span className="font-semibold text-purple-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 text-xs">
                  Workspace <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Project Modal */}
      <ProjectModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingProject(undefined);
        }}
        onSave={handleSaveProject}
        initialProject={editingProject}
      />

      {/* AI Project PRD Modal */}
      <AiProjectPrdModal
        isOpen={!!prdProject}
        onClose={() => setPrdProject(null)}
        project={prdProject}
        onMilestonesApplied={() => loadProjects()}
      />
    </div>
  );
};
