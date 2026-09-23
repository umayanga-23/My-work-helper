import { api } from './api';
import type { Task } from '../types';

export interface AiActionItem {
  type: string; // 'CREATE_TASK', 'CREATE_PROJECT', 'CREATE_NOTE'
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  categoryName?: string;
  projectId?: string;
  projectName?: string;
  parentTaskId?: string;
  estimatedDuration?: number;
  dependencySuggestion?: string;
  orderNumber?: number;
  dependsOnTaskId?: string;
}

export interface AiChatResponse {
  reply: string;
  conversationId: string;
  actionType?: string;
  proposedActions?: AiActionItem[];
}

export interface MorningBriefing {
  greeting: string;
  motivationQuote: string;
  summaryText: string;
  urgentTasksCount: number;
  pendingTasksCount: number;
  activeProjectsCount: number;
  currentStreakDays: number;
  topFocusTasks: Task[];
  strategicInsights: string[];
}

export interface PlanOrderItem {
  orderNumber: number;
  taskId: string;
  taskKey?: string;
  taskTitle: string;
  reason?: string;
  estimatedDuration?: number;
  priority?: string;
  status?: string;
  projectName?: string;
  dueDate?: string;
  dueTime?: string;
}

export interface TodayPlan {
  strategyRationale: string;
  estimatedTotalHours: number;
  estimatedWorkload?: string;
  reasonForOrder?: string;
  potentialConflicts?: string[];
  suggestedOrder?: PlanOrderItem[];
  recommendedTasks: Task[];
}

export interface DecomposeResult {
  parentTaskId: string;
  parentTaskTitle: string;
  strategyOverview: string;
  generatedSubtasks: AiActionItem[];
}

export interface NoteSummary {
  noteId: string;
  noteTitle: string;
  executiveSummary: string;
  keyTakeaways: string[];
  actionItems: string[];
  generatedTags: string[];
}

export interface KnowledgeQueryResponse {
  answer: string;
  matchedSources: string[];
  suggestedActions?: AiActionItem[];
}

export interface ProductivityAnalytics {
  totalFocusMinutesThisWeek: number;
  completedTasksThisWeek: number;
  peakProductivityTime: string;
  focusEfficiencyScore: number;
  flowStateDiagnosis: string;
  actionableRecommendations: string[];
  dailyFocusMinutes: Record<string, number>;
}

export interface ProjectPrd {
  projectId: string;
  projectName: string;
  executiveSummary: string;
  targetAudience: string;
  keyFeatures: string[];
  recommendedTechStack: string[];
  potentialRisks: string[];
  sprintMilestones: {
    milestoneName: string;
    objective: string;
    tasks: AiActionItem[];
  }[];
}

export interface IdeaExpansion {
  ideaId: string;
  ideaTitle: string;
  valueProposition: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  recommendedTechStack: string[];
  initialSprintTasks: AiActionItem[];
}

export interface DocumentChatResponse {
  answer: string;
  extractedKeyPoints: string[];
  suggestedTasks: AiActionItem[];
}

export const aiService = {
  async chat(message: string, conversationId?: string, history?: { role: string; content: string }[], pageContext?: string): Promise<AiChatResponse> {
    const response = await api.post('/ai/chat', { message, conversationId, history, pageContext }, { timeout: 45000 });
    return response.data?.data;
  },

  async getMorningBriefing(): Promise<MorningBriefing> {
    const response = await api.get('/ai/morning-briefing', { timeout: 45000 });
    return response.data?.data;
  },

  async planToday(): Promise<TodayPlan> {
    const response = await api.post('/ai/plan-today', {}, { timeout: 45000 });
    return response.data?.data;
  },

  async decomposeTask(taskId: string): Promise<DecomposeResult> {
    const response = await api.post(`/ai/decompose-task/${taskId}`);
    return response.data?.data;
  },

  async executeActions(actions: AiActionItem[]): Promise<Task[]> {
    const response = await api.post('/ai/execute-actions', actions);
    return response.data?.data || [];
  },

  async summarizeNote(noteId: string): Promise<NoteSummary> {
    const response = await api.post(`/ai/summarize-note/${noteId}`);
    return response.data?.data;
  },

  async queryKnowledgeBase(query: string): Promise<KnowledgeQueryResponse> {
    const response = await api.post('/ai/query-knowledge-base', { query });
    return response.data?.data;
  },

  async getProductivityInsights(): Promise<ProductivityAnalytics> {
    const response = await api.get('/ai/productivity-insights');
    return response.data?.data;
  },

  async generateProjectPrd(projectId: string): Promise<ProjectPrd> {
    const response = await api.post(`/ai/generate-project-prd/${projectId}`);
    return response.data?.data;
  },

  async expandIdea(ideaId: string): Promise<IdeaExpansion> {
    const response = await api.post(`/ai/expand-idea/${ideaId}`);
    return response.data?.data;
  },

  async convertIdeaToProject(ideaId: string): Promise<any> {
    const response = await api.post(`/ai/convert-idea-to-project/${ideaId}`);
    return response.data?.data;
  },

  async chatDocument(documentName: string, question: string, documentSummary?: string, documentId?: string): Promise<DocumentChatResponse> {
    const response = await api.post('/ai/chat-document', { documentName, question, documentSummary, documentId });
    return response.data?.data;
  },

  async testConnection(apiKey?: string, provider: string = 'GOOGLE_GEMINI'): Promise<{ success: boolean; message: string; provider?: string }> {
    const response = await api.post('/ai/test-connection', { apiKey, provider });
    return response.data?.data;
  }
};
