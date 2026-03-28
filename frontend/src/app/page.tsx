"use client";

import Link from "next/link";
import { BookOpen, Brain, Trophy, ArrowRight, CheckCircle, Star, Users } from "lucide-react";
import { useLang } from "@/lib/lang";
import { LangToggle } from "@/components/ui/LangToggle";
import { Logo } from "@/components/ui/Logo";

const iconMap = {
  BookOpen: BookOpen,
  Brain: Brain,
  Trophy: Trophy,
};

const colorClasses = {
  blue:   { bg: "bg-blue-100",   text: "text-blue-600",   border: "border-blue-200"   },
  green:  { bg: "bg-green-100",  text: "text-green-600",  border: "border-green-200"  },
  orange: { bg: "bg-orange-100", text: "text-orange-600", border: "border-orange-200" },
};

export default function LandingPage() {
  const { tr } = useLang();

  const features = [
    { icon: "BookOpen", trTitle: "land_feat1_t", trDesc: "land_feat1_d", color: "blue" },
    { icon: "Brain",    trTitle: "land_feat2_t", trDesc: "land_feat2_d", color: "green" },
    { icon: "Trophy",   trTitle: "land_feat3_t", trDesc: "land_feat3_d", color: "orange" },
  ];

  const subjects = [
    { trName: "subject_mother_tongue", trDesc: "subject_desc_mt",   color: "blue",   icon: "📝" },
    { trName: "subject_mathematics",   trDesc: "subject_desc_math", color: "green",  icon: "📐" },
    { trName: "subject_history",       trDesc: "subject_desc_hist", color: "orange", icon: "🏛️" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo size={30} showName light={false} />
            <div className="flex items-center gap-4">
              <LangToggle />
              <Link href="/login" className="text-slate-600 hover:text-slate-900 text-sm font-medium">
                {tr("land_signin")}
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                {tr("land_signup")}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <CheckCircle className="w-4 h-4" />
            {tr("land_badge")}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            {tr("land_hero_title")}
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            {tr("land_hero_sub")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              {tr("land_cta_start")}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/exam"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold border-2 border-blue-200 hover:border-blue-400 transition-all"
            >
              {tr("land_cta_demo")}
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { value: "1500+", trKey: "land_stat_q" },
              { value: "10K+",  trKey: "land_stat_s" },
              { value: "27.5",  trKey: "land_stat_sc" },
            ].map((stat) => (
              <div key={stat.trKey} className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stat.value}</div>
                <div className="text-sm text-slate-500 mt-1">{tr(stat.trKey)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            {tr("land_feat_title")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = iconMap[feature.icon as keyof typeof iconMap];
              const colors = colorClasses[feature.color as keyof typeof colorClasses];
              return (
                <div
                  key={feature.icon}
                  className={`p-8 rounded-2xl border-2 ${colors.border} ${colors.bg} hover:shadow-lg transition-shadow`}
                >
                  <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center mb-6 shadow-sm">
                    <Icon className={`w-7 h-7 ${colors.text}`} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{tr(feature.trTitle)}</h3>
                  <p className="text-slate-600 leading-relaxed">{tr(feature.trDesc)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Subjects */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            {tr("land_subj_title")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subjects.map((subject) => {
              const colors = colorClasses[subject.color as keyof typeof colorClasses];
              return (
                <div
                  key={subject.trName}
                  className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-shadow"
                >
                  <div className="text-4xl mb-4">{subject.icon}</div>
                  <h3 className={`font-bold text-lg mb-2 ${colors.text}`}>{tr(subject.trName)}</h3>
                  <p className="text-slate-500 text-sm">{tr(subject.trDesc)}</p>
                  <div className="mt-4 flex items-center gap-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`h-1.5 rounded-full flex-1 ${colors.bg}`} />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">10 {tr("land_per_exam")}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Appeals Feature Banner */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-slate-800 to-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-400/10 text-yellow-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Star className="w-4 h-4" />
            {tr("land_unique")}
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">{tr("land_rights_t")}</h2>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">{tr("land_rights_d")}</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="text-slate-600 text-sm">{tr("land_footer")}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <Link href="/login" className="hover:text-slate-600">{tr("land_signin")}</Link>
            <Link href="/register" className="hover:text-slate-600">{tr("land_signup")}</Link>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-600 flex items-center gap-1"
              title="API Documentation"
            >
              <Users className="w-3.5 h-3.5" />
              API Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
