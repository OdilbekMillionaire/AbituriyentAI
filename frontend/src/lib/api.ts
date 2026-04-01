import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

const TOKEN_KEY = "abituriyent_token";

// ── Axios instance ────────────────────────────────────────────────────────────

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 65000, // 65s — covers Render free-tier cold start (~50s)
});

// ── Request interceptor: attach JWT ──────────────────────────────────────────

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 ────────────────────────────────────────

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      removeToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ── Token helpers ─────────────────────────────────────────────────────────────

export function setToken(token: string): void {
  Cookies.set(TOKEN_KEY, token, { expires: 1, sameSite: "strict" });
  // Also store in localStorage for quick client-side reads
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(TOKEN_KEY) || Cookies.get(TOKEN_KEY) || null;
  }
  return Cookies.get(TOKEN_KEY) || null;
}

export function removeToken(): void {
  Cookies.remove(TOKEN_KEY);
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

// ── API endpoint functions ────────────────────────────────────────────────────

// Auth
export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post("/auth/register", data),
  login: (username: string, password: string) =>
    api.post(
      "/auth/login",
      new URLSearchParams({ username, password }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    ),
  getMe: () => api.get("/auth/me"),
  firebaseAuth: (idToken: string, displayName?: string | null) =>
    api.post("/auth/firebase", { id_token: idToken, display_name: displayName ?? null }),
};

// Exams
export const examsApi = {
  start: (subject: "all" | "mother_tongue" | "mathematics" | "history" = "all", mode: "practice" | "simulyatsiya" = "practice") =>
    api.get(`/exams/start?subject=${subject}&mode=${mode}`),
  submit: (sessionId: number, answers: { question_id: number; selected_option: string | null }[]) =>
    api.post("/exams/submit", { session_id: sessionId, answers }),
  getResults: (sessionId: number) =>
    api.get(`/exams/results/${sessionId}`),
  getReview: (sessionId: number) =>
    api.get(`/exams/${sessionId}/review`),
  getPercentile: (sessionId: number) =>
    api.get(`/exams/${sessionId}/percentile`),
  getHistory: (skip = 0, limit = 20) =>
    api.get(`/exams/history?skip=${skip}&limit=${limit}`),
};

// Lessons
export const lessonsApi = {
  list: (subject?: string) =>
    api.get(`/lessons${subject ? `?subject=${subject}` : ""}`),
  getById: (id: number) =>
    api.get(`/lessons/${id}`),
  complete: (id: number, quizScore?: number, language?: string) =>
    api.post(`/lessons/${id}/complete`, { quiz_score: quizScore ?? 0, language: language ?? "uzbek" }),
  getQuiz: (id: number, language = "uzbek") =>
    api.get(`/lessons/${id}/quiz?language=${language}`, { timeout: 30000 }),
};

// Gamification / User
export const userApi = {
  getProfile: () => api.get("/user/profile"),
  getLeaderboard: (limit = 20) => api.get(`/user/leaderboard?limit=${limit}`),
  dailyCheckin: () => api.post("/user/daily-checkin"),
  getStats: () => api.get("/user/stats"),
  getWeakAreas: () => api.get("/user/weak-areas"),
  getProgressHistory: () => api.get("/user/progress-history"),
  exchangeChaqa: () => api.post("/user/exchange-chaqa"),
  awardCoins: (coins: number, source: string) => api.post("/user/award-coins", { coins, source }),
};

// Appeals
export const appealsApi = {
  appealQuestion: (questionId: number, useAi = true, language = "uz") =>
    api.post(`/appeals/question/${questionId}?use_ai=${useAi}&language=${language}`),
  listQuestions: (subject?: string) =>
    api.get(`/appeals/questions${subject ? `?subject=${subject}` : ""}`),
};

// AI Lesson Generator
export const aiLessonsApi = {
  generate: (body: {
    subject: string;
    topic: string;
    format_type: "text" | "visual" | "audio";
    difficulty: "easy" | "medium" | "hard";
    language: string;
    length: "short" | "medium" | "deep";
  }) => api.post("/ai-lessons/generate", body),

  generateQuiz: (body: {
    lesson_content: string;
    topic: string;
    subject: string;
    language: string;
    num_questions?: number;
  }) => api.post("/ai-lessons/quiz", body),

  getTopics: (subject: string) =>
    api.get(`/ai-lessons/topics/${subject}`),

  getAllTopics: () => api.get("/ai-lessons/topics"),
};

// Study Plan
export const studyPlanApi = {
  get: (examDate: string) => api.get(`/study-plan?exam_date=${examDate}`),
  getAiAdvice: (examDate: string, language: string) =>
    api.get(`/study-plan/ai-advice?exam_date=${examDate}&language=${language}`, { timeout: 60000 }),
};

// Bookmarks
export const bookmarksApi = {
  toggle: (questionId: number) => api.post(`/bookmarks/${questionId}`),
  list: () => api.get("/bookmarks"),
  ids: () => api.get("/bookmarks/ids"),
};

// Drill / Spaced Repetition
export const drillApi = {
  getDue: (subject?: string, limit = 10) =>
    api.get(`/drill/due?limit=${limit}${subject ? `&subject=${subject}` : ""}`),
  answer: (cardId: number, selectedOption: string) =>
    api.post("/drill/answer", { card_id: cardId, selected_option: selectedOption }),
  getStats: () => api.get("/drill/stats"),
};

// Educational Games
export const gamesApi = {
  flashcards: (subject: string, limit = 15) =>
    api.get(`/games/flashcards?subject=${subject}&limit=${limit}`),
  kimBolmoqchi: (subject: string) =>
    api.get(`/games/kim-bolmoqchi?subject=${subject}`),
  matching: (subject: string, topic: string, language: string) =>
    api.get(`/games/matching?subject=${subject}&topic=${encodeURIComponent(topic)}&language=${language}`, { timeout: 45000 }),
  crossword: (body: { subject: string; topic: string; language: string }) =>
    api.post("/games/crossword", body, { timeout: 60000 }),
  hangman: (subject: string, language: string) =>
    api.get(`/games/hangman?subject=${subject}&language=${language}`, { timeout: 30000 }),
  trueFalse: (subject: string, language: string, count = 10) =>
    api.get(`/games/true-false?subject=${subject}&language=${language}&count=${count}`, { timeout: 30000 }),
  fillBlank: (subject: string, language: string, count = 8) =>
    api.get(`/games/fill-blank?subject=${subject}&language=${language}&count=${count}`, { timeout: 35000 }),
};

// Abituriyent Canvas
export const canvasApi = {
  generate: (body: { subject: string; topic: string; language: string }) =>
    api.post("/canvas/generate", body, { timeout: 90000 }),
};

// AI Tutor (Gemini)
export const aiApi = {
  chat: (body: {
    question: string;
    subject: string;
    lesson_id?: number | null;
    language?: "uz" | "ru";
  }) => api.post("/ai/chat", body),

  getHint: (questionId: number, language: "uz" | "ru" = "uz") =>
    api.post("/ai/hint", { question_id: questionId, language }),

  generateQuestion: (body: {
    subject: string;
    topic: string;
    difficulty?: "EASY" | "MEDIUM" | "HARD";
    is_competency_based?: boolean;
  }) => api.post("/ai/generate-question", body),
};
