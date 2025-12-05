"use client";

import { useState } from "react";

// ---------------- NEW FUNCTIONS ADDED HERE ---------------- //

const getTopResult = (results) => {
  if (!results || results.length === 0) return null;
  return [...results].sort((a, b) => b.score - a.score)[0];
};

const getFinalVerdict = (label) => {
  const l = label.toLowerCase();

  if (l === "negative") return "Hate Speech";
  if (l === "positive") return "No Hate";
  return "Neutral";
};

const getVerdictColor = (verdict) => {
  if (verdict === "Hate Speech") return "text-rose-400";
  if (verdict === "No Hate") return "text-emerald-400";
  return "text-amber-400";
};

// ----------------------------------------------------------- //

export default function Home() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!text.trim()) {
      setError("Please enter some text to analyze");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze text");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score < 30) return "text-emerald-400";
    if (score < 60) return "text-amber-400";
    return "text-rose-400";
  };

  const getProgressColor = (score) => {
    if (score < 30) return "bg-emerald-500";
    if (score < 60) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <header className="text-center mb-16 opacity-0 animate-fadeIn">
          <h1 className="text-5xl font-light text-white mb-4 tracking-tight">
            Hate Speech Recognition
          </h1>
          <p className="text-lg text-slate-300 font-light max-w-2xl mx-auto leading-relaxed">
            Analyze any text and determine if it contains hate speech, neutral
            content, or safe, non-harmful language.
          </p>
        </header>

        {/* Main Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden opacity-0 animate-fadeIn animation-delay-200">
          <div className="p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Text Input */}
              <div className="relative">
                <label
                  htmlFor="text-input"
                  className="block text-sm font-medium text-slate-200 mb-3"
                >
                  Enter text for analysis
                </label>
                <textarea
                  id="text-input"
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setError("");
                  }}
                  placeholder="Type or paste the text you'd like to analyze..."
                  className="w-full h-40 px-4 py-3 rounded-xl border border-slate-600 bg-slate-900/50 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all duration-200 resize-none"
                  disabled={loading}
                />
                <div className="absolute bottom-3 right-3 text-xs text-slate-400">
                  {text.length} characters
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-3 rounded-lg animate-slideDown">
                  <svg
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293-1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="text-sm whitespace-pre-line">{error}</div>
                </div>
              )}

              {/* Button */}
              <button
                type="submit"
                disabled={loading || !text.trim()}
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-4 rounded-xl font-medium hover:from-indigo-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-600 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-indigo-900/50 hover:shadow-xl hover:shadow-indigo-800/50 active:scale-[0.98]"
              >
                {loading ? "Analyzing..." : "Analyze Text"}
              </button>
            </form>

            {/* RESULTS */}
            {result && (
              <div className="mt-8 pt-8 border-t border-slate-700 animate-slideUp">
                {/* FINAL VERDICT */}
                {(() => {
                  const top = getTopResult(result.results);
                  const verdict = getFinalVerdict(top.label);

                  return (
                    <div className="mb-8 p-6 rounded-xl bg-slate-900/70 border border-slate-700">
                      <h3 className="text-slate-300 text-sm mb-2">
                        Final Verdict
                      </h3>

                      <div
                        className={`text-4xl font-bold ${getVerdictColor(
                          verdict
                        )}`}
                      >
                        {verdict}
                      </div>

                      <p className="text-slate-400 text-sm mt-2">
                        Highest score → <b>{top.label}</b> (
                        {top.score.toFixed(2)}%)
                      </p>
                    </div>
                  );
                })()}

                {/* DETAILED RESULTS */}
                <h2 className="text-xl font-medium text-white mb-6">
                  Detailed Breakdown
                </h2>

                <div className="space-y-6">
                  {result.results.map((item, index) => (
                    <div
                      key={index}
                      className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 animate-fadeIn"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-slate-700/50 text-slate-200 border border-slate-600">
                          {item.label}
                        </span>

                        <div
                          className={`text-3xl font-light ${getScoreColor(
                            item.score
                          )}`}
                        >
                          {item.score.toFixed(1)}%
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="relative h-2 bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                          className={`absolute top-0 left-0 h-full ${getProgressColor(
                            item.score
                          )} transition-all duration-1000 ease-out rounded-full`}
                          style={{
                            width: `${item.score}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-xs text-slate-500">
                  Model: {result.model}
                </div>

                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong className="font-medium text-slate-200">
                      Note:
                    </strong>{" "}
                    This tool provides an estimate. Interpret results with
                    context.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-12 text-center text-sm text-slate-400 opacity-0 animate-fadeIn animation-delay-400">
          <p>
            Powered by advanced language models • Hate Speech Detection System
          </p>
        </footer>
      </div>
    </div>
  );
}
