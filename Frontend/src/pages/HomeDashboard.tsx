import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckSquare,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plane,
  Code2,
  Terminal
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Task, Category } from '../types';
import { taskService } from '../services/taskService';
import { categoryService } from '../services/categoryService';
import { TaskModal } from '../components/tasks/TaskModal';
import { AiPlanTodayModal } from '../components/tasks/AiPlanTodayModal';
import { useLiveSync } from '../hooks/useLiveSync';
import { clsx } from 'clsx';

interface AmbitionSlide {
  image: string;
  category: 'aviation' | 'it';
  badge: string;
  title: string;
  quote: string;
  sub: string;
}

const ALL_AMBITION_SLIDES: AmbitionSlide[] = [
  {
    image: '/ambition-1.jpg',
    category: 'aviation',
    badge: 'Aviation Ambition • Flight Goal',
    title: 'Aim High, Fly Higher',
    quote: 'Every great flight begins with relentless focus, discipline, and daily execution.',
    sub: 'Boeing 777 Sunset Cruising • Infinite Horizon',
  },
  {
    image: '/it-1.jpg',
    category: 'it',
    badge: 'Software Engineering • Clean Code',
    title: 'Architecting Scalable Systems',
    quote: 'Code is craft. Build resilient solutions that power the future with precision.',
    sub: 'Full-Stack Architecture & Cloud Systems',
  },
  {
    image: '/ambition-2.jpg',
    category: 'aviation',
    badge: 'Flight Deck Mastery • Captain Mindset',
    title: 'Master The Cockpit',
    quote: 'Command your journey with calm precision. Navigate through turbulence into clear skies.',
    sub: 'Avionics, Systems & Technical Excellence',
  },
  {
    image: '/it-2.jpg',
    category: 'it',
    badge: 'Developer Focus • Deep Work',
    title: 'Engineering The Future',
    quote: 'Discipline in programming turns complex challenges into robust digital reality.',
    sub: 'High-Impact Software Development & Algorithms',
  },
  {
    image: '/ambition-3.jpg',
    category: 'aviation',
    badge: 'Peak Ascent • Limitless Altitude',
    title: 'Soar Above The Clouds',
    quote: 'The sky is not your limit; it is the starting point of what you are destined to achieve.',
    sub: 'Alpine Range Climb • Elevation & Vision',
  },
  {
    image: '/it-3.jpg',
    category: 'it',
    badge: 'Cloud & Infrastructure • DevOps',
    title: 'Global High-Tech Infrastructure',
    quote: 'Design resilient networks and distributed cloud architectures that never fail.',
    sub: 'Data Center Engineering & DevOps Mastery',
  },
  {
    image: '/ambition-4.jpg',
    category: 'aviation',
    badge: 'Runway Acceleration • Momentum',
    title: 'Full Throttle Takeoff',
    quote: 'Momentum is created when passion meets preparation. Commit full power to your goals.',
    sub: 'Twilight Runway Takeoff • Unstoppable Power',
  },
  {
    image: '/it-4.jpg',
    category: 'it',
    badge: 'Tech Innovation • Command Center',
    title: 'Code, Create, Elevate',
    quote: 'Transform ideas into working products through relentless focus and technical mastery.',
    sub: 'Creative Engineering & Systems Thinking',
  },
  {
    image: '/ambition-5.jpg',
    category: 'aviation',
    badge: 'Captain of Destiny • Daily Focus',
    title: 'Captain Your Future',
    quote: 'Great captains and engineers are forged in daily consistency, calm nerves, and clear forward vision.',
    sub: 'Golden Horizon • High-Altitude Clarity',
  },
];

export const HomeDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [aiPlanTodayOpen, setAiPlanTodayOpen] = useState(false);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const filteredSlides = ALL_AMBITION_SLIDES;

  // Auto rotation timer
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % filteredSlides.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused, filteredSlides.length]);

  const loadData = async () => {
    try {
      const [fetchedTasks, fetchedCats] = await Promise.all([
        taskService.getTasks(),
        categoryService.getCategories(),
      ]);
      setTasks(fetchedTasks || []);
      setCategories(fetchedCats || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  useEffect(() => {
    loadData();

    const handleCreated = () => loadData();
    window.addEventListener('workspace-resource-created', handleCreated);
    window.addEventListener('workspace-category-updated', handleCreated);
    return () => {
      window.removeEventListener('workspace-resource-created', handleCreated);
      window.removeEventListener('workspace-category-updated', handleCreated);
    };
  }, []);

  // Automatic live sync across devices
  useLiveSync(() => {
    loadData();
  }, { intervalMs: 12000 });

  const handleToggleTaskStatus = async (task: Task) => {
    const nextStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    const updated = await taskService.updateTaskStatus(task.id, nextStatus);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
  };

  const handleCreateTask = async (taskData: Partial<Task>) => {
    const created = await taskService.createTask(taskData);
    setTasks((prev) => [created, ...prev]);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % filteredSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + filteredSlides.length) % filteredSlides.length);
  };

  const activeAmbition = filteredSlides[currentSlide] || filteredSlides[0];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Expanded Ambition Vision Hero Banner (Aviation & IT) */}
      <div
        className="relative w-full h-[300px] sm:h-[340px] rounded-3xl overflow-hidden border border-[#DCE9E1] dark:border-[#20372B] shadow-lg group select-none transition-all z-0"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Background Rotating Images with Cross-Fade */}
        {filteredSlides.map((slide, idx) => (
          <div
            key={slide.image}
            className={clsx(
              'absolute inset-0 transition-opacity duration-1000 ease-in-out',
              idx === currentSlide ? 'opacity-100 z-1' : 'opacity-0 z-0 pointer-events-none'
            )}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-10000 ease-linear"
            />
          </div>
        ))}

        {/* Ambient Gradient Overlays for perfect readability & contrast */}
        <div className="absolute inset-0 z-2 bg-gradient-to-r from-black/90 via-black/65 to-black/30" />
        <div className="absolute inset-0 z-2 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />

        {/* Content Container */}
        <div className="absolute inset-0 z-10 p-6 sm:p-8 flex flex-col justify-between">
          {/* Top Bar on Hero: Ambition Badge & Actions */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[#86EFAC] text-xs font-semibold shadow-xs">
                {activeAmbition.category === 'aviation' ? (
                  <Plane className="w-3.5 h-3.5 text-[#5FBF8F] animate-pulse" />
                ) : (
                  <Code2 className="w-3.5 h-3.5 text-[#5FBF8F] animate-pulse" />
                )}
                <span>{activeAmbition.badge}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setAiPlanTodayOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-[var(--color-primary)]/50 hover:border-[var(--color-primary)] text-[var(--color-accent)] hover:text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Open AI Day Planner"
              >
                <Sparkles className="w-3.5 h-3.5 text-[var(--color-primary)] animate-pulse" />
                <span>AI Day Planner</span>
              </button>

              <button
                onClick={() => setTaskModalOpen(true)}
                className="px-4 py-1.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>
          </div>

          {/* Main Hero Ambition Message */}
          <div className="max-w-2xl space-y-2">
            <span className="text-[11px] uppercase font-bold tracking-widest text-[var(--color-accent)] flex items-center gap-1.5 drop-shadow-sm">
              {activeAmbition.category === 'it' ? <Terminal className="w-3.5 h-3.5 text-[var(--color-primary)]" /> : <Plane className="w-3.5 h-3.5 text-[var(--color-primary)]" />}
              {activeAmbition.sub}
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-lg">
              {activeAmbition.title}
            </h1>
            <p className="text-xs sm:text-sm text-white/90 font-medium leading-relaxed drop-shadow-md max-w-xl">
              "{activeAmbition.quote}"
            </p>
          </div>

          {/* Bottom Bar: Carousel Indicators & Prev/Next Arrows */}
          <div className="flex items-center justify-between pt-2">
            {/* Slide Navigation Dots */}
            <div className="flex items-center gap-1.5">
              {filteredSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={clsx(
                    'h-1.5 sm:h-2 rounded-full transition-all duration-300 cursor-pointer',
                    idx === currentSlide
                      ? 'w-6 sm:w-8 bg-[var(--color-primary)] shadow-xs'
                      : 'w-1.5 sm:w-2 bg-white/40 hover:bg-white/70'
                  )}
                  title={`View ambition slide ${idx + 1}`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
              <span className="text-[10px] text-white/80 font-medium ml-2 font-mono drop-shadow-xs">
                {currentSlide + 1} / {filteredSlides.length}
              </span>
            </div>

            {/* Prev / Next controls */}
            <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                onClick={prevSlide}
                className="p-2 rounded-xl bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 transition-all cursor-pointer"
                title="Previous ambition"
                aria-label="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextSlide}
                className="p-2 rounded-xl bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 transition-all cursor-pointer"
                title="Next ambition"
                aria-label="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Today's Tasks Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[var(--color-primary)]" />
            Today's Tasks
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTaskModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
            <Link
              to="/tasks"
              className="text-xs font-semibold text-[#237A57] dark:text-[#6DD6A0] hover:underline flex items-center gap-1"
            >
              View All Tasks <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#FFFFFF] dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-[#5FBF8F] mx-auto" />
              <h4 className="font-semibold text-[#17211B] dark:text-[#EAF7EF] text-sm">No tasks for today 🎉</h4>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">Enjoy your focus time or create a new task.</p>
            </div>
          ) : (
            tasks.map((task) => {
              const isCompleted = task.status === 'COMPLETED';
              return (
                <div
                  key={task.id}
                  className={clsx(
                    'p-4 rounded-2xl border transition-all duration-200 flex items-start gap-3.5 shadow-xs',
                    isCompleted
                      ? 'bg-[#E8F7EF]/50 dark:bg-[#13261C]/50 border-[#5FBF8F]/40 opacity-80'
                      : 'bg-[#FFFFFF] dark:bg-[#0E1C15] border-[#DCE9E1] dark:border-[#20372B] hover:border-[#5FBF8F] dark:hover:border-[#6DD6A0]'
                  )}
                >
                  {/* Checkbox with Primary Green */}
                  <button
                    onClick={() => handleToggleTaskStatus(task)}
                    className={clsx(
                      'mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all flex-shrink-0 cursor-pointer',
                      isCompleted
                        ? 'bg-[#5FBF8F] border-[#5FBF8F] text-white'
                        : 'border-[#DCE9E1] dark:border-[#20372B] hover:border-[#5FBF8F] bg-white dark:bg-[#0E1C15] text-transparent'
                    )}
                    title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                  >
                    <CheckSquare className="w-3.5 h-3.5 fill-current" />
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4
                        className={clsx(
                          'text-sm font-semibold transition-all truncate',
                          isCompleted
                            ? 'line-through text-[#66736B] dark:text-[#9BB5A5]'
                            : 'text-[#17211B] dark:text-[#EAF7EF]'
                        )}
                      >
                        {task.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-[#66736B] dark:text-[#9BB5A5] flex-wrap">
                      <span className="flex items-center gap-1 font-medium text-amber-500 dark:text-amber-400">
                        <Clock className="w-3 h-3" />
                        {task.dueTime ? `Due ${task.dueTime.slice(0, 5)}` : 'Today'}
                      </span>
                      {task.categoryName && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] border border-[#DCE9E1] dark:border-[#20372B]">
                          {task.categoryName}
                        </span>
                      )}
                      {task.projectName && (
                        <span className="text-[#237A57] dark:text-[#6DD6A0] font-medium">📁 {task.projectName}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Task Modal Container */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSave={handleCreateTask}
        categories={categories}
      />

      {/* AI Plan Today Modal */}
      <AiPlanTodayModal
        isOpen={aiPlanTodayOpen}
        onClose={() => setAiPlanTodayOpen(false)}
        onTasksCreated={() => loadData()}
      />
    </div>
  );
};
