"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, User, Trophy, BookOpen, TrendingUp,
  Star, Flame, Zap, Settings, Clock,
} from "lucide-react";
import { useUserProfile, useExamHistory } from "@/lib/queries";
import { isAuthenticated } from "@/lib/api";
import { useLang } from "@/lib/lang";
import { formatScore, formatDateTime, SUBJECT_INFO } from "@/lib/utils";
import { SubjectBadge } from "@/components/ui/SubjectBadge";
import type { ExamResult } from "@/types";

const LEVEL_NAMES: Record<number, { uz: string; ru: string; en: string; qq: string }> = {
  1:  { uz: "Yangi abituriyent", ru: "Новый абитуриент", en: "New Student",     qq: "Jańa abituriyent" },
  2:  { uz: "O'rganuvchi",       ru: "Ученик",           en: "Learner",         qq: "Úyreniwshi" },
  3:  { uz: "Izlanuvchi",        ru: "Исследователь",    en: "Explorer",        qq: "Izleniwshi" },
  4:  { uz: "Bilimdon",          ru: "Знаток",           en: "Scholar",         qq: "Bilimlı" },
  5:  { uz: "Ustoz",             ru: "Мастер",           en: "Master",          qq: "Ustaz" },
  6:  { uz: "Ekspert",           ru: "Эксперт",          en: "Expert",          qq: "Ekspert" },
  7:  { uz: "Olim",              ru: "Учёный",           en: "Academic",        qq: "Ǵalım" },
  8:  { uz: "Professor",         ru: "Профессор",        en: "Professor",       qq: "Professor" },
  9:  { uz: "Akademik",          ru: "Академик",         en: "Academician",     qq: "Akademik" },
  10: { uz: "BMBA Ustasi",       ru: "Мастер БМБА",      en: "BMBA Master",     qq: "BMBA Ustazı" },
};

function getLevelName(level: number, lang: string): string {
  const entry = LEVEL_NAMES[Math.min(level, 10)];
  if (!entry) return `Level ${level}`;
  if (lang === "ru") return entry.ru;
  if (lang === "en") return entry.en;
  if (lang === "qq") return entry.qq;
  return entry.uz;
}

function StatCard({ icon, value, label, color }: {
  icon: React.ReactNode; value: string | number; label: string; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${color}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { tr, lang } = useLang();
  const { data: profile, isLoading } = useUserProfile();
  const { data: examHistory } = useExamHistory();

  useEffect(() => {
    if (!isAuthenticated()) router.push("/login");
  }, [router]);

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">{tr("loading")}</div>
      </div>
    );
  }

  const xpPct = Math.min(100, Math.round((profile.xp_in_current_level / 500) * 100));
  const bestScore = examHistory?.length
    ? Math.max(...examHistory.map((e) => e.total_score))
    : 0;
  const avgScore = examHistory?.length
    ? examHistory.reduce((s, e) => s + e.total_score, 0) / examHistory.length
    : 0;

  const achievements = [
    { icon: "🏆", label: tr("profile_exams_taken"), value: examHistory?.length ?? 0, threshold: 1 },
    { icon: "🔥", label: "Streak", value: profile.streak_days, threshold: 3 },
    { icon: "🥈", label: "Chaqa", value: profile.xp, threshold: 500 },
    { icon: "📚", label: tr("profile_lessons_done"), value: profile.level * 3, threshold: 5 },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard" className="text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <User className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-slate-900">{tr("profile_title")}</span>
          <Link href="/settings" className="ml-auto text-slate-400 hover:text-slate-600">
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* ── Profile card ── */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-3xl font-bold text-white">
                {profile.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate">{profile.username}</h2>
              <p className="text-blue-200 text-sm truncate">{profile.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  {tr("level")} {profile.level} — {getLevelName(profile.level, lang)}
                </span>
              </div>
            </div>
          </div>

          {/* Level progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-blue-200 mb-1">
              <span>{profile.xp_in_current_level} Chaqa</span>
              <span>500 Chaqa</span>
            </div>
            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${xpPct}%` }}
              />
            </div>
            <p className="text-xs text-blue-200 mt-1">{profile.xp_to_next_level} Chaqa {tr("xp_next_level")}</p>
          </div>

          {/* Streak + Coins */}
          <div className="flex flex-wrap gap-2 sm:gap-4 mt-4">
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg">
              <Flame className="w-4 h-4 text-orange-300" />
              <span className="text-sm font-bold">{profile.streak_days}</span>
              <span className="text-xs text-blue-200">{tr("streak_day")}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg">
              <span className="text-base">🥈</span>
              <span className="text-sm font-bold">{profile.coins}</span>
              <span className="text-xs text-blue-200">Chaqa</span>
            </div>
            {(profile.oxforder_tanga ?? 0) > 0 && (
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg">
                <span className="text-base">🪙</span>
                <span className="text-sm font-bold">{profile.oxforder_tanga}</span>
                <span className="text-xs text-blue-200">Tanga</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={<Trophy className="w-5 h-5 text-yellow-600" />}
            value={examHistory?.length ?? 0}
            label={tr("profile_exams_taken")}
            color="bg-yellow-50"
          />
          <StatCard
            icon={<Star className="w-5 h-5 text-blue-600" />}
            value={formatScore(bestScore)}
            label={tr("profile_best_score")}
            color="bg-blue-50"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-green-600" />}
            value={formatScore(avgScore)}
            label={tr("profile_avg_score")}
            color="bg-green-50"
          />
          <StatCard
            icon={<BookOpen className="w-5 h-5 text-purple-600" />}
            value={profile.level * 3}
            label={tr("profile_lessons_done")}
            color="bg-purple-50"
          />
        </div>

        {/* ── Achievements ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            {tr("profile_achievements")}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {achievements.map((a) => (
              <div
                key={a.label}
                className={`rounded-xl p-3 border transition-colors ${
                  a.value >= a.threshold
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-slate-50 border-slate-100 opacity-50"
                }`}
              >
                <div className="text-2xl mb-1">{a.icon}</div>
                <div className="font-bold text-slate-800 text-sm">{a.value}</div>
                <div className="text-xs text-slate-500">{a.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Recent exams ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            {tr("profile_recent_exams")}
          </h3>
          {!examHistory?.length ? (
            <p className="text-sm text-slate-400 text-center py-4">{tr("profile_no_exams")}</p>
          ) : (
            <div className="space-y-2">
              {examHistory.slice(0, 5).map((exam) => (
                <Link
                  key={exam.session_id}
                  href={`/exam/results/${exam.session_id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      exam.percentage >= 55 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {exam.percentage >= 55 ? "✓" : "✗"}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">
                        {formatScore(exam.total_score)} / {formatScore(exam.max_possible_score)}
                      </div>
                      <div className="text-xs text-slate-400">
                        {exam.submitted_at ? formatDateTime(exam.submitted_at) : ""}
                      </div>
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${exam.percentage >= 55 ? "text-green-600" : "text-red-500"}`}>
                    {exam.percentage.toFixed(0)}%
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Joined date ── */}
        <p className="text-center text-xs text-slate-400">
          {tr("profile_joined")} {formatDateTime(profile.created_at)}
        </p>
      </main>
    </div>
  );
}
