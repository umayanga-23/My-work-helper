export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface TaskDependencyRef {
  taskId: string;
  taskKey?: string;
  title: string;
  status: TaskStatus;
}

export interface Task {
  id: string;
  userId: string;
  projectId?: string;
  categoryId?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  dueTime?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  categoryName?: string;
  categoryColor?: string;
  projectName?: string;
  taskKey?: string;
  parentTaskId?: string;
  parentTaskTitle?: string;
  parentTaskKey?: string;
  dependsOnTaskId?: string;
  dependsOnTaskTitle?: string;
  dependsOnTaskKey?: string;
  subtasks?: Task[];
  resources?: TaskResource[];
  gitCommits?: TaskGitCommit[];
  /** Many-to-many: tasks this task must wait for */
  blockedBy?: TaskDependencyRef[];
  /** Many-to-many: tasks that are waiting for this task */
  blocks?: TaskDependencyRef[];
  /** Derived: true when at least one predecessor is not COMPLETED */
  isBlocked?: boolean;
  recurringTaskId?: string;
  estimatedDuration?: number;
  recurringTaskTitle?: string;
}

export type RecurrenceType = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type RecurringTaskStatus = 'ACTIVE' | 'PAUSED' | 'ENDED';

export interface RecurringTask {
  id: string;
  userId: string;
  title: string;
  description?: string;
  projectId?: string;
  projectName?: string;
  categoryId?: string;
  categoryName?: string;
  categoryColor?: string;
  priority: TaskPriority;
  dueTime?: string;
  estimatedDuration?: number;
  recurrenceType: RecurrenceType;
  recurrenceConfig?: string;
  startDate: string;
  endDate?: string;
  status: RecurringTaskStatus;
  lastGeneratedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringTaskRequest {
  title: string;
  description?: string;
  projectId?: string;
  categoryId?: string;
  priority?: TaskPriority;
  dueTime?: string;
  estimatedDuration?: number;
  recurrenceType: RecurrenceType;
  recurrenceConfig?: string;
  startDate: string;
  endDate?: string;
}


export interface ProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectIssue {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  issueType: 'BUG' | 'FEATURE_REQUEST' | 'TECHNICAL_DEBT' | 'IMPROVEMENT';
  taskId?: string;
  taskKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskGitCommit {
  id: string;
  taskId?: string;
  projectId?: string;
  taskKey?: string;
  commitHash: string;
  message: string;
  authorName?: string;
  commitUrl?: string;
  timestamp: string;
  eventType: string;
  createdAt: string;
}

export type ResourceType = 'WEBSITE' | 'NOTE' | 'DOCUMENT' | 'DRIVE_LINK' | 'PROJECT' | 'IDEA' | 'LEARNING_TOPIC' | 'GITHUB';

export interface TaskResource {
  id: string;
  taskId: string;
  resourceType: ResourceType;
  resourceId: string;
  title?: string;
  url?: string;
  createdAt: string;
}

export type CategoryType = 'TASK' | 'WEBSITE' | 'NOTE' | 'DOCUMENT' | 'DRIVE_LINK' | 'IDEA' | 'CREDENTIAL' | 'GENERAL';

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: CategoryType;
  color: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Website {
  id: string;
  userId: string;
  projectId?: string;
  categoryId?: string;
  name: string;
  url: string;
  faviconUrl?: string;
  description?: string;
  color?: string;
  isFavorite: boolean;
  visitCount?: number;
  tags?: string;
  linkedTaskCount?: number;
  lastVisitedAt?: string;
  createdAt: string;
  updatedAt: string;
  categoryName?: string;
}

export interface Note {
  id: string;
  userId: string;
  projectId?: string;
  categoryId?: string;
  title: string;
  content: string;
  tags?: string[];
  isFavorite: boolean;
  favorite?: boolean;
  isArchived: boolean;
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
  categoryName?: string;
  projectName?: string;
}

export interface DocumentItem {
  id: string;
  userId: string;
  projectId?: string;
  categoryId?: string;
  name: string;
  originalFileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  description?: string;
  tags?: string;
  isFavorite?: boolean;
  favorite?: boolean;
  linkedTaskCount?: number;
  createdAt: string;
  updatedAt: string;
  categoryName?: string;
  projectName?: string;
  downloadUrl?: string;
}

export type ResourcePlatform =
  | 'GOOGLE_DRIVE'
  | 'GOOGLE_DOCS'
  | 'GOOGLE_SHEETS'
  | 'GOOGLE_SLIDES'
  | 'CHATGPT'
  | 'YOUTUBE'
  | 'LINKEDIN'
  | 'FACEBOOK'
  | 'GITHUB'
  | 'WEB_RESOURCE';

export interface DriveLink {
  id: string;
  userId: string;
  projectId?: string;
  categoryId?: string;
  name: string;
  url: string;
  resourceType?: ResourcePlatform | string;
  description?: string;
  tags?: string;
  isFavorite: boolean;
  favorite?: boolean;
  linkedTaskCount?: number;
  createdAt: string;
  updatedAt: string;
  categoryName?: string;
  projectName?: string;
}

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  progress: number;
  projectKey?: string;
  githubRepo?: string;
  githubToken?: string;
  createdAt: string;
  updatedAt: string;
  taskCount?: number;
  completedTaskCount?: number;
}

export interface LearningResource {
  id: string;
  userId: string;
  skillId?: string;
  topicId?: string;
  title: string;
  url: string;
  resourceType: ResourcePlatform;
  createdAt: string;
}

export interface SkillCertificate {
  id: string;
  userId: string;
  skillId: string;
  title: string;
  issuer?: string;
  issueDate?: string;
  credentialUrl?: string;
  certificateUrl?: string;
  createdAt: string;
}

export interface SkillProject {
  id: string;
  userId: string;
  skillId: string;
  projectId: string;
  projectName: string;
  projectStatus: string;
  projectProgressPercent: number;
  createdAt: string;
}

export interface StudySession {
  id: string;
  userId: string;
  skillId?: string;
  skillName?: string;
  topicId?: string;
  topicTitle?: string;
  durationMinutes: number;
  sessionDate: string;
  notes?: string;
  createdAt: string;
}

export interface StudyStats {
  currentStreakDays: number;
  totalStudyMinutes: number;
  totalStudyHours: number;
  todayStudyMinutes: number;
  totalMasteredTopics: number;
  totalSkillsCount: number;
  recentSessions: StudySession[];
}

export interface Skill {
  id: string;
  userId: string;
  name: string;
  category: string;
  proficiencyPercent: number;
  targetLevel?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  topics?: LearningTopic[];
  resources?: LearningResource[];
  certificates?: SkillCertificate[];
  projects?: SkillProject[];
  totalStudyMinutes?: number;
}

export type TopicStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'MASTERED';

export interface LearningTopic {
  id: string;
  userId: string;
  skillId?: string;
  title: string;
  description?: string;
  notes?: string;
  cheatsheet?: string;
  status: TopicStatus;
  progressPercent: number;
  createdAt: string;
  updatedAt: string;
  resources?: LearningResource[];
}

export type IdeaStatus = 'IDEA' | 'EXPLORING' | 'PLANNED' | 'CONVERTED_TO_PROJECT' | 'ARCHIVED';

export interface Idea {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category?: string;
  status: IdeaStatus;
  convertedProjectId?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export type CardType = 
  | 'WEBSITE_COLLECTION'
  | 'NOTES_COLLECTION'
  | 'DOCUMENTS'
  | 'DRIVE_LINKS'
  | 'PROJECT'
  | 'TASKS'
  | 'LEARNING'
  | 'CUSTOM_LINK'
  | 'OTHER';

export interface DashboardCard {
  id: string;
  userId: string;
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  type: CardType;
  config?: Record<string, any>;
  position: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VaultCredential {
  id: string;
  userId: string;
  category?: string;
  serviceName: string;
  username: string;
  encryptedPassword?: string;
  iv?: string;
  salt?: string;
  url?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  projectId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, any> | string;
  createdAt: string;
}

export type ThemeMode = 'dark' | 'light' | 'system';

export interface UserSettings {
  id?: string;
  userId?: string;
  theme: ThemeMode;
  defaultTaskPriority: TaskPriority;
  dashboardLayout?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface GlobalSearchResult {
  id: string;
  title: string;
  description?: string;
  type: 'TASK' | 'WEBSITE' | 'NOTE' | 'DOCUMENT' | 'DRIVE_LINK' | 'PROJECT' | 'LEARNING' | 'IDEA';
  url?: string;
  metadata?: Record<string, any>;
}

export interface ProductivitySummary {
  todayTotalTasks: number;
  todayCompletedTasks: number;
  todayPendingTasks: number;
  completionRate: number;
  weeklyCompletedCount: number;
  monthlyCompletedCount: number;
  totalProjects: number;
  activeProjects: number;
  totalNotes: number;
  totalWebsites: number;
  totalDocuments: number;
}

export interface AnalyticsSummary {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  totalNotes: number;
  totalWebsites: number;
  totalDocuments: number;
  totalDriveLinks: number;
  totalProjects: number;
  totalSkills: number;
  totalIdeas: number;
  tasksByCategory: Record<string, number>;
  tasksByPriority: Record<string, number>;
  weeklyTrends: Array<{
    date: string;
    dayOfWeek: string;
    completedCount: number;
    createdCount: number;
  }>;
}

// ==========================================
// 🚀 LEARNING & SKILL TRACKER 2.0 TYPES
// ==========================================

export type LearningTaskType = 
  | 'LESSON' 
  | 'ENGLISH_LESSON' 
  | 'RECALL' 
  | 'SPEAKING' 
  | 'VOCABULARY_REVIEW' 
  | 'MISTAKE_REVISION' 
  | 'PROJECT_PRACTICE';

export interface DailyLearningTask {
  id: string;
  title: string;
  type: LearningTaskType;
  durationMinutes: number;
  status: 'TODO' | 'COMPLETED';
  targetId?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  orderIndex: number;
}

export interface LearningLesson {
  id: string;
  pathId: string;
  title: string;
  description?: string;
  levelStage?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'MASTERY';
  orderIndex?: number;
  durationMinutes?: number;
  estimatedMinutes?: number;
  learningObjectives?: string;
  objectives?: string[] | string;
  contentMarkdown?: string;
  coreConcepts?: string;
  codeExamples?: string;
  mentalModelDiagram?: string;
  guidedPracticeSteps?: string;
  practiceExercises?: any;
  realWorldExercise?: string;
  activeRecallPrompt?: string;
  expectedKeyPoints?: string;
  quizQuestionsJson?: string;
  quizQuestions?: any;
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'MASTERED';
  practiceScore?: number;
  activeRecallScore?: number;
  masteryScore?: number;
  lastAttemptDate?: string;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  category: string;
  targetLevel?: string;
  levelStage?: string;
  overallProgressPercent: number;
  totalLessonsCount: number;
  completedLessonsCount: number;
  isUnlocked?: boolean;
  lessons: LearningLesson[];
}

export interface ActiveRecallResponse {
  accuracyScore: number;
  clarityScore: number;
  depthScore: number;
  overallScore: number;
  missingConcepts: string[];
  incorrectConcepts: string[];
  strongPoints: string[];
  actionableFeedback: string;
  remedialLessonAdvice: string;
  masteryLevel: string;
}

export interface LearningDashboard {
  todayPlan: DailyLearningTask[];
  currentStreakDays: number;
  weeklyStudyMinutes: number;
  overallMasteryScore: number;
  activePaths: LearningPath[];
  weakTopics: string[];
  recentAchievements: string[];
  englishQuickStatus?: EnglishDashboard;
  conceptMasteryRadar: Record<string, number>;
}

// ==========================================
// 🇬🇧 ENGLISH JOURNEY ACADEMY TYPES
// ==========================================

export type CefrLevel = 'L0' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export interface EnglishUserLevel {
  id: string;
  cefrLevel: CefrLevel;
  isUnlocked: boolean;
  isPassed: boolean;
  grammarScore: number;
  speakingScore: number;
  listeningScore: number;
  writingScore: number;
  overallScore: number;
  completedModulesCount: number;
  totalModulesCount: number;
}

export interface EnglishModule {
  id: string;
  cefrLevel: CefrLevel;
  moduleNumber: number;
  title: string;
  topicArea: string;
  description: string;
  whyBeforeHow?: string;
  sinhalaExplanation?: string;
  grammarRule?: string;
  sentencePatternsJson?: string;
  vocabularyListJson?: string;
  interactiveDialogueJson?: string;
  speakingChallengePrompt?: string;
  commonMistakesAlert?: string;
  exerciseQuizJson?: string;
  practiceDrillsJson?: string;
  listeningLabJson?: string;
  readingLabJson?: string;
  writingLabJson?: string;
  realWorldTaskJson?: string;
  status: 'LOCKED' | 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'MASTERED';
  score: number;
  speakingScore: number;
}

export type PracticeType =
  | 'MULTIPLE_CHOICE'
  | 'FILL_BLANK'
  | 'SENTENCE_ORDER'
  | 'SINHALA_TO_ENGLISH'
  | 'ERROR_SPOT'
  | 'TRUE_FALSE'
  | 'mcq'
  | 'fill_in_blank'
  | 'sentence_reorder'
  | 'sinhala_to_english'
  | 'error_spotting';

export interface PracticeDrillItem {
  id: string;
  type: PracticeType;
  question: string;
  sinhalaPrompt?: string;
  options?: string[];
  correctAnswer: string | number | string[];
  acceptableAnswers?: string[];
  explanation: string;
  whyExplanation?: string;
  hint?: string;
  commonMistake?: string;
}

export interface ListeningLabActivity {
  id: string;
  title: string;
  transcript: string;
  audioText?: string;
  audioPromptText?: string;
  audioSpeedOptions?: number[];
  questions?: Array<{
    id?: string;
    question: string;
    options: string[];
    answerIndex: number;
    explanation?: string;
  }>;
  comprehensionQuestions?: Array<{
    id?: string;
    question: string;
    options: string[];
    answerIndex: number;
    explanation?: string;
  }>;
}

export interface ReadingLabActivity {
  id: string;
  title: string;
  passage: string;
  topic: string;
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    answerIndex: number;
    explanation: string;
  }>;
}

export interface WritingLabActivity {
  id: string;
  title: string;
  prompt: string;
  sinhalaContext?: string;
  guidelines: string[];
  sampleResponse: string;
  evaluationCriteria: string[];
}

export interface RealWorldTask {
  id: string;
  title: string;
  domain?: 'IT' | 'UNIVERSITY' | 'PROFESSIONAL' | string;
  scenario: string;
  instructions?: string;
  taskPrompt?: string;
  sinhalaGuidance?: string;
  keyPhrases?: string[];
  expectedKeywords?: string[];
  modelAnswer?: string;
  modelResponse?: string;
}

export interface RemedialActionPlan {
  cefrLevel: CefrLevel;
  failedCompetencies: string[];
  rootMistakes: string[];
  suggestedModuleIds: string[];
  immediateDrillQuestions: PracticeDrillItem[];
  actionAdvice: string;
}

export interface EnglishVocabulary {
  id: string;
  word: string;
  phonetic?: string;
  partOfSpeech?: string;
  sinhalaMeaning: string;
  englishMeaning: string;
  collocations?: string;
  exampleSentence: string;
  cefrLevel: CefrLevel;
  boxLevel: number;
  repetitionsCount: number;
  nextReviewDate: string;
  retentionScore: number;
  isDue: boolean;
}

export interface EnglishMistake {
  id: string;
  cefrLevel: CefrLevel;
  mistakeCategory: string;
  wrongSentence: string;
  correctedSentence: string;
  grammarRule: string;
  sinhalaExplanation: string;
  remedialExercisePrompt?: string;
  practiceCount: number;
  isResolved: boolean;
}

export interface EnglishDashboard {
  currentLevel: CefrLevel;
  allLevels: EnglishUserLevel[];
  dueVocabularyCount: number;
  totalVocabularyMastered: number;
  openMistakesCount: number;
  currentStreakDays: number;
  overallSpeakingScore: number;
  overallGrammarScore: number;
  todayRecommendedTasks: DailyLearningTask[];
}

export interface SpeakingEvaluationResponse {
  fluencyScore: number;
  pronunciationScore: number;
  grammarAccuracyScore: number;
  vocabularyRangeScore: number;
  overallSpeakingScore: number;
  transcribedText: string;
  detectedMistakes: string[];
  betterPhrasingSuggestions: string[];
  detailedFeedback: string;
  audioPlaybackUrl?: string;
}

export interface MasteryGateAssessmentResponse {
  cefrLevel: CefrLevel;
  passed: boolean;
  grammarScore: number;
  speakingScore: number;
  listeningScore: number;
  writingScore: number;
  overallScore: number;
  feedback: string;
  remedialActionPlan: string[];
  unlockedNextLevel?: string;
}

