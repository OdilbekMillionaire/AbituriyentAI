"use client";
import Link from "next/link";
import { ArrowLeft, Gamepad2 } from "lucide-react";
import { useLang } from "@/lib/lang";
import { useUserProfile } from "@/lib/queries";

function ChaqaCoin({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <circle cx="10" cy="10" r="9.5" fill="#94a3b8" stroke="#64748b" strokeWidth="1"/>
      <circle cx="10" cy="10" r="7" fill="#e2e8f0"/>
      <text x="10" y="14" textAnchor="middle" fontSize="8" fontWeight="800" fill="#475569" fontFamily="system-ui, sans-serif">C</text>
    </svg>
  );
}

const GAMES = [
  {
    href: "/games/kim-bolmoqchi",
    emoji: "🎯",
    titleKey: "game_kim",
    descKey: "game_kim_desc",
    gradient: "from-yellow-400 via-orange-500 to-red-500",
    glow: "shadow-orange-500/30",
    coins: 50,
    time: "15 min",
    badge: "HOT",
    badgeColor: "bg-red-500",
  },
  {
    href: "/games/lightning",
    emoji: "⚡",
    titleKey: "game_lightning",
    descKey: "game_lightning_desc",
    gradient: "from-yellow-400 via-amber-500 to-orange-500",
    glow: "shadow-yellow-500/30",
    coins: 30,
    time: "2 min",
    badge: "YANGI",
    badgeColor: "bg-violet-600",
  },
  {
    href: "/games/countdown",
    emoji: "⏱️",
    titleKey: "game_countdown",
    descKey: "game_countdown_desc",
    gradient: "from-rose-500 via-pink-500 to-fuchsia-500",
    glow: "shadow-rose-500/30",
    coins: 25,
    time: "1 min",
    badge: "YANGI",
    badgeColor: "bg-violet-600",
  },
  {
    href: "/games/chain",
    emoji: "🔗",
    titleKey: "game_chain",
    descKey: "game_chain_desc",
    gradient: "from-cyan-500 via-sky-500 to-blue-600",
    glow: "shadow-cyan-500/30",
    coins: 20,
    time: "∞",
    badge: "YANGI",
    badgeColor: "bg-violet-600",
  },
  {
    href: "/games/last-stand",
    emoji: "🛡️",
    titleKey: "game_laststand",
    descKey: "game_laststand_desc",
    gradient: "from-violet-500 via-purple-500 to-indigo-600",
    glow: "shadow-violet-500/30",
    coins: 40,
    time: "∞",
    badge: "YANGI",
    badgeColor: "bg-violet-600",
  },
  {
    href: "/games/flashcards",
    emoji: "🃏",
    titleKey: "game_flashcards",
    descKey: "game_flashcards_desc",
    gradient: "from-blue-500 via-blue-600 to-indigo-600",
    glow: "shadow-blue-500/30",
    coins: 10,
    time: "5 min",
    badge: null,
    badgeColor: "",
  },
  {
    href: "/games/speed-quiz",
    emoji: "🚀",
    titleKey: "game_speedquiz",
    descKey: "game_speedquiz_desc",
    gradient: "from-orange-500 via-red-500 to-pink-600",
    glow: "shadow-red-500/30",
    coins: 25,
    time: "4 min",
    badge: "TEZKOR",
    badgeColor: "bg-orange-500",
  },
  {
    href: "/games/true-false",
    emoji: "⚡",
    titleKey: "game_truefalse",
    descKey: "game_truefalse_desc",
    gradient: "from-amber-400 via-yellow-500 to-orange-400",
    glow: "shadow-yellow-500/30",
    coins: 20,
    time: "2 min",
    badge: null,
    badgeColor: "",
  },
  {
    href: "/games/fill-blank",
    emoji: "✏️",
    titleKey: "game_fillblank",
    descKey: "game_fillblank_desc",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    glow: "shadow-emerald-500/30",
    coins: 20,
    time: "5 min",
    badge: null,
    badgeColor: "",
  },
  {
    href: "/games/matching",
    emoji: "🔗",
    titleKey: "game_matching",
    descKey: "game_matching_desc",
    gradient: "from-green-500 via-emerald-500 to-teal-600",
    glow: "shadow-green-500/30",
    coins: 20,
    time: "5 min",
    badge: null,
    badgeColor: "",
  },
  {
    href: "/games/scramble",
    emoji: "🔀",
    titleKey: "game_scramble",
    descKey: "game_scramble_desc",
    gradient: "from-cyan-500 via-sky-500 to-blue-600",
    glow: "shadow-cyan-500/30",
    coins: 15,
    time: "3 min",
    badge: null,
    badgeColor: "",
  },
  {
    href: "/games/crossword",
    emoji: "📝",
    titleKey: "game_crossword",
    descKey: "game_crossword_desc",
    gradient: "from-purple-500 via-violet-500 to-indigo-600",
    glow: "shadow-purple-500/30",
    coins: 30,
    time: "10 min",
    badge: null,
    badgeColor: "",
  },
  {
    href: "/games/hangman",
    emoji: "🔤",
    titleKey: "game_hangman",
    descKey: "game_hangman_desc",
    gradient: "from-rose-500 via-pink-500 to-fuchsia-500",
    glow: "shadow-rose-500/30",
    coins: 15,
    time: "3 min",
    badge: null,
    badgeColor: "",
  },
  {
    href: "/games/memory",
    emoji: "🧠",
    titleKey: "game_memory",
    descKey: "game_memory_desc",
    gradient: "from-violet-500 via-purple-500 to-fuchsia-600",
    glow: "shadow-violet-500/30",
    coins: 10,
    time: "3 min",
    badge: null,
    badgeColor: "",
  },
];

export default function GamesPage() {
  const { tr } = useLang();
  const { data: profile } = useUserProfile();

  return (
    <div className="min-h-screen bg-slate-900">

      {/* Nav */}
      <nav className="bg-slate-900/80 backdrop-blur border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Gamepad2 className="w-5 h-5 text-violet-400" />
          <span className="font-bold text-white">{tr("games_title")}</span>

          {profile && (
            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-full px-3 py-1.5">
                <ChaqaCoin className="w-4 h-4" />
                <span className="text-sm font-bold text-white">{profile.coins}</span>
                <span className="text-xs text-slate-400">Chaqa</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-full px-3 py-1.5">
                <span className="text-sm">🪙</span>
                <span className="text-sm font-bold text-amber-300">{profile.oxforder_tanga ?? 0}</span>
                <span className="text-xs text-slate-400">Tanga</span>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 pt-10 pb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-5">
          <Gamepad2 className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-bold text-violet-300 uppercase tracking-widest">Ta&apos;lim o&apos;yinlari</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
          O&apos;yin orqali o&apos;rgan 🎮
        </h1>
        <p className="text-slate-400 text-base max-w-md mx-auto">
          BMBA fanlarini o&apos;yin formatida o&apos;rganib Chaqa yig&apos;ing
        </p>
      </div>

      {/* Featured game — kim bo'lmoqchi */}
      <div className="max-w-5xl mx-auto px-4 mb-6">
        <Link href="/games/kim-bolmoqchi"
          className="group relative block rounded-2xl overflow-hidden bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 p-6 hover:shadow-2xl hover:shadow-orange-500/30 transition-all"
        >
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="relative flex items-center gap-6">
            <div className="text-6xl sm:text-7xl">🎯</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">🔥 HOT</span>
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">15 min</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mb-1">{tr("game_kim")}</h2>
              <p className="text-orange-100 text-sm mb-3">{tr("game_kim_desc")}</p>
              <div className="flex items-center gap-2">
                <ChaqaCoin className="w-4 h-4" />
                <span className="text-white font-bold text-sm">+50 Chaqa</span>
              </div>
            </div>
            <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      {/* Grid */}
      <div className="max-w-5xl mx-auto px-4 pb-10">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Barcha o&apos;yinlar</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GAMES.filter(g => g.href !== "/games/kim-bolmoqchi").map((game) => (
            <Link key={game.href} href={game.href}
              className={`group relative bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden hover:border-slate-500 hover:shadow-xl ${game.glow} transition-all`}
            >
              {/* Color top bar */}
              <div className={`h-1 bg-gradient-to-r ${game.gradient}`} />

              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${game.gradient} flex items-center justify-center text-2xl shadow-lg`}>
                    {game.emoji}
                  </div>
                  {game.badge && (
                    <span className={`${game.badgeColor} text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider`}>
                      {game.badge}
                    </span>
                  )}
                </div>

                <h2 className="font-bold text-white text-base mb-1 group-hover:text-violet-300 transition-colors">
                  {tr(game.titleKey)}
                </h2>
                <p className="text-slate-400 text-xs mb-4 leading-relaxed">{tr(game.descKey)}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ChaqaCoin className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold text-slate-300">+{game.coins} Chaqa</span>
                  </div>
                  <span className="text-slate-500 text-xs">⏱ {game.time}</span>
                </div>
              </div>

              {/* Hover glow overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity pointer-events-none`} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
