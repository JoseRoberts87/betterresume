"use client";

import { useEffect, useState } from "react";
import type { GapQuestion, GapQuestionResponse, GapAnalysis } from "@/lib/gap-questions";

interface GapQuestionsViewProps {
  jobId: string;
  onComplete?: (newScore: number) => void;
}

export default function GapQuestionsView({ jobId, onComplete }: GapQuestionsViewProps) {
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null);
  const [responses, setResponses] = useState<Record<string, GapQuestionResponse>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    async function fetchGapQuestions() {
      try {
        const response = await fetch(`/api/jobs/${jobId}/gap-questions`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to load gap questions");
          return;
        }

        setGapAnalysis(data.gapAnalysis);

        // Initialize responses
        const initialResponses: Record<string, GapQuestionResponse> = {};
        data.gapAnalysis.questions.forEach((q: GapQuestion) => {
          initialResponses[q.id] = {
            questionId: q.id,
            answer: "",
            hasExperience: false,
          };
        });
        setResponses(initialResponses);
      } catch (err) {
        setError("Failed to load gap questions");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchGapQuestions();
  }, [jobId]);

  const handleResponseChange = (
    questionId: string,
    field: keyof GapQuestionResponse,
    value: string | boolean | number
  ) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const validResponses = Object.values(responses).filter(
        (r) => r.hasExperience && r.answer.trim()
      );

      const response = await fetch(`/api/jobs/${jobId}/gap-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses: validResponses }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to submit responses");
        return;
      }

      if (onComplete) {
        onComplete(data.newScore);
      }
    } catch (err) {
      setError("Failed to submit responses");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-zinc-500">Loading gap questions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (!gapAnalysis || gapAnalysis.questions.length === 0) {
    return (
      <div className="rounded-md bg-green-50 p-6 text-center dark:bg-green-900/20">
        <div className="text-lg font-medium text-green-800 dark:text-green-400">
          No Gaps Found
        </div>
        <p className="mt-2 text-sm text-green-700 dark:text-green-500">
          Your profile covers all the requirements for this position.
        </p>
      </div>
    );
  }

  const questionsToShow = showAll
    ? gapAnalysis.questions
    : gapAnalysis.questions.slice(0, 5);

  const currentQuestion = gapAnalysis.questions[currentIndex];
  const answeredCount = Object.values(responses).filter(
    (r) => r.hasExperience && r.answer.trim()
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Gap Questions
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Answer these questions to potentially improve your match score.
            We found {gapAnalysis.totalGaps} gap{gapAnalysis.totalGaps !== 1 ? "s" : ""},
            {gapAnalysis.criticalGaps > 0 && (
              <span className="text-red-600 dark:text-red-400">
                {" "}{gapAnalysis.criticalGaps} critical
              </span>
            )}
          </p>
        </div>
        <div className="text-right text-sm text-zinc-500">
          {answeredCount} / {gapAnalysis.questions.length} answered
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div
          className="h-2 rounded-full bg-blue-600 transition-all"
          style={{
            width: `${(answeredCount / gapAnalysis.questions.length) * 100}%`,
          }}
        />
      </div>

      {/* Question Cards */}
      <div className="space-y-4">
        {questionsToShow.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            response={responses[question.id]}
            onChange={(field, value) => handleResponseChange(question.id, field, value)}
            number={index + 1}
          />
        ))}
      </div>

      {/* Show more/less toggle */}
      {gapAnalysis.questions.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2 text-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          {showAll
            ? "Show fewer questions"
            : `Show all ${gapAnalysis.questions.length} questions`}
        </button>
      )}

      {/* Submit button */}
      <div className="flex justify-end gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-700">
        <button
          onClick={() => onComplete?.(0)}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Skip for Now
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || answeredCount === 0}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : `Update Profile (${answeredCount} skills)`}
        </button>
      </div>
    </div>
  );
}

function QuestionCard({
  question,
  response,
  onChange,
  number,
}: {
  question: GapQuestion;
  response: GapQuestionResponse;
  onChange: (field: keyof GapQuestionResponse, value: string | boolean | number) => void;
  number: number;
}) {
  const priorityColors = {
    P1: "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20",
    P2: "border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20",
    P3: "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20",
    P4: "border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800",
  };

  const priorityLabels = {
    P1: { text: "Required", className: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400" },
    P2: { text: "Important", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400" },
    P3: { text: "Preferred", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400" },
    P4: { text: "Nice to have", className: "bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-400" },
  };

  return (
    <div className={`rounded-lg border p-4 ${priorityColors[question.priority]}`}>
      <div className="flex items-start gap-4">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">
          {number}
        </span>
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {question.skillName}
                </span>
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${priorityLabels[question.priority].className}`}>
                  {priorityLabels[question.priority].text}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                {question.question}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                {question.context}
              </p>
            </div>
          </div>

          {/* Has experience toggle */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name={`has-exp-${question.id}`}
                checked={response.hasExperience}
                onChange={() => onChange("hasExperience", true)}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                Yes, I have experience
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name={`has-exp-${question.id}`}
                checked={!response.hasExperience}
                onChange={() => onChange("hasExperience", false)}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                No experience
              </span>
            </label>
          </div>

          {/* Answer textarea - only show if has experience */}
          {response.hasExperience && (
            <div className="space-y-2">
              <textarea
                value={response.answer}
                onChange={(e) => onChange("answer", e.target.value)}
                placeholder={question.suggestedAnswerFormat || "Describe your experience..."}
                rows={3}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Years of experience:
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={response.yearsOfExperience || ""}
                    onChange={(e) => onChange("yearsOfExperience", parseInt(e.target.value) || 0)}
                    className="w-16 rounded border border-zinc-300 px-2 py-1 text-center dark:border-zinc-600 dark:bg-zinc-800"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
