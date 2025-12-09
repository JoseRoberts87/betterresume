"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CareerData, Basics, WorkExperience, Education, Project, Skill } from "@/types/json-resume";

type WizardStep = "basics" | "work" | "education" | "projects" | "skills" | "review";

const STEPS: { id: WizardStep; label: string }[] = [
  { id: "basics", label: "Basic Info" },
  { id: "work", label: "Work Experience" },
  { id: "education", label: "Education" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "review", label: "Review" },
];

export default function WizardForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>("basics");
  const [isSaving, setIsSaving] = useState(false);
  const [careerData, setCareerData] = useState<CareerData>({
    basics: {},
    work: [],
    education: [],
    projects: [],
    skills: [],
  });

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id);
    }
  };

  const goPrev = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ careerData }),
      });

      if (response.ok) {
        router.push("/dashboard/profile");
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <div className="flex justify-between">
        {STEPS.map((step, index) => (
          <button
            key={step.id}
            onClick={() => setCurrentStep(step.id)}
            className={`flex flex-col items-center gap-2 ${
              index <= currentStepIndex
                ? "text-zinc-900 dark:text-zinc-50"
                : "text-zinc-400 dark:text-zinc-600"
            }`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                index < currentStepIndex
                  ? "bg-green-500 text-white"
                  : index === currentStepIndex
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-200 dark:bg-zinc-800"
              }`}
            >
              {index < currentStepIndex ? "✓" : index + 1}
            </div>
            <span className="hidden text-xs sm:block">{step.label}</span>
          </button>
        ))}
      </div>

      {/* Step Content */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        {currentStep === "basics" && (
          <BasicsStep
            data={careerData.basics || {}}
            onChange={(basics) => setCareerData({ ...careerData, basics })}
          />
        )}
        {currentStep === "work" && (
          <WorkStep
            data={careerData.work || []}
            onChange={(work) => setCareerData({ ...careerData, work })}
          />
        )}
        {currentStep === "education" && (
          <EducationStep
            data={careerData.education || []}
            onChange={(education) => setCareerData({ ...careerData, education })}
          />
        )}
        {currentStep === "projects" && (
          <ProjectsStep
            data={careerData.projects || []}
            onChange={(projects) => setCareerData({ ...careerData, projects })}
          />
        )}
        {currentStep === "skills" && (
          <SkillsStep
            data={careerData.skills || []}
            onChange={(skills) => setCareerData({ ...careerData, skills })}
          />
        )}
        {currentStep === "review" && <ReviewStep data={careerData} />}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={goPrev}
          disabled={currentStepIndex === 0}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Previous
        </button>
        {currentStep === "review" ? (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isSaving ? "Saving..." : "Save Profile"}
          </button>
        ) : (
          <button
            onClick={goNext}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

// Step Components

function BasicsStep({
  data,
  onChange,
}: {
  data: Basics;
  onChange: (data: Basics) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Basic Information
      </h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Let&apos;s start with your contact details and professional summary.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Full Name
          </label>
          <input
            type="text"
            value={data.name || ""}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Professional Title
          </label>
          <input
            type="text"
            value={data.label || ""}
            onChange={(e) => onChange({ ...data, label: e.target.value })}
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            placeholder="Senior Software Engineer"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email
          </label>
          <input
            type="email"
            value={data.email || ""}
            onChange={(e) => onChange({ ...data, email: e.target.value })}
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            placeholder="john@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Phone
          </label>
          <input
            type="tel"
            value={data.phone || ""}
            onChange={(e) => onChange({ ...data, phone: e.target.value })}
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Professional Summary
        </label>
        <textarea
          value={data.summary || ""}
          onChange={(e) => onChange({ ...data, summary: e.target.value })}
          rows={4}
          className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          placeholder="Brief overview of your experience and what you bring to employers..."
        />
      </div>
    </div>
  );
}

function WorkStep({
  data,
  onChange,
}: {
  data: WorkExperience[];
  onChange: (data: WorkExperience[]) => void;
}) {
  const addWork = () => {
    onChange([
      ...data,
      { id: crypto.randomUUID(), company: "", position: "", highlights: [] },
    ]);
  };

  const updateWork = (index: number, work: WorkExperience) => {
    const updated = [...data];
    updated[index] = work;
    onChange(updated);
  };

  const removeWork = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Work Experience
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Add your professional experience, starting with the most recent.
          </p>
        </div>
        <button
          onClick={addWork}
          className="rounded-md bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
        >
          + Add
        </button>
      </div>

      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          No work experience added yet. Click &quot;+ Add&quot; to get started.
        </p>
      ) : (
        <div className="space-y-6">
          {data.map((work, index) => (
            <div
              key={work.id || index}
              className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-500">
                  Position {index + 1}
                </span>
                <button
                  onClick={() => removeWork(index)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Company
                  </label>
                  <input
                    type="text"
                    value={work.company}
                    onChange={(e) =>
                      updateWork(index, { ...work, company: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Position
                  </label>
                  <input
                    type="text"
                    value={work.position}
                    onChange={(e) =>
                      updateWork(index, { ...work, position: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Start Date
                  </label>
                  <input
                    type="month"
                    value={work.startDate || ""}
                    onChange={(e) =>
                      updateWork(index, { ...work, startDate: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    End Date
                  </label>
                  <input
                    type="month"
                    value={work.endDate || ""}
                    onChange={(e) =>
                      updateWork(index, { ...work, endDate: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    placeholder="Present"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Key Achievements (one per line)
                </label>
                <textarea
                  value={work.highlights?.join("\n") || ""}
                  onChange={(e) =>
                    updateWork(index, {
                      ...work,
                      highlights: e.target.value.split("\n").filter(Boolean),
                    })
                  }
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  placeholder="Led team of 5 engineers&#10;Increased revenue by 20%&#10;Implemented CI/CD pipeline"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EducationStep({
  data,
  onChange,
}: {
  data: Education[];
  onChange: (data: Education[]) => void;
}) {
  const addEducation = () => {
    onChange([...data, { id: crypto.randomUUID(), institution: "" }]);
  };

  const updateEducation = (index: number, edu: Education) => {
    const updated = [...data];
    updated[index] = edu;
    onChange(updated);
  };

  const removeEducation = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Education
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Add your educational background.
          </p>
        </div>
        <button
          onClick={addEducation}
          className="rounded-md bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
        >
          + Add
        </button>
      </div>

      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          No education added yet. Click &quot;+ Add&quot; to get started.
        </p>
      ) : (
        <div className="space-y-6">
          {data.map((edu, index) => (
            <div
              key={edu.id || index}
              className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-500">
                  Education {index + 1}
                </span>
                <button
                  onClick={() => removeEducation(index)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Institution
                  </label>
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) =>
                      updateEducation(index, {
                        ...edu,
                        institution: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Degree Type
                  </label>
                  <input
                    type="text"
                    value={edu.studyType || ""}
                    onChange={(e) =>
                      updateEducation(index, {
                        ...edu,
                        studyType: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    placeholder="Bachelor's, Master's, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Field of Study
                  </label>
                  <input
                    type="text"
                    value={edu.area || ""}
                    onChange={(e) =>
                      updateEducation(index, { ...edu, area: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    placeholder="Computer Science"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Start Date
                  </label>
                  <input
                    type="month"
                    value={edu.startDate || ""}
                    onChange={(e) =>
                      updateEducation(index, {
                        ...edu,
                        startDate: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    End Date
                  </label>
                  <input
                    type="month"
                    value={edu.endDate || ""}
                    onChange={(e) =>
                      updateEducation(index, { ...edu, endDate: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectsStep({
  data,
  onChange,
}: {
  data: Project[];
  onChange: (data: Project[]) => void;
}) {
  const addProject = () => {
    onChange([...data, { id: crypto.randomUUID(), name: "" }]);
  };

  const updateProject = (index: number, project: Project) => {
    const updated = [...data];
    updated[index] = project;
    onChange(updated);
  };

  const removeProject = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Projects
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Add personal, freelance, or open-source projects.
          </p>
        </div>
        <button
          onClick={addProject}
          className="rounded-md bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
        >
          + Add
        </button>
      </div>

      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          No projects added yet. Click &quot;+ Add&quot; to get started.
        </p>
      ) : (
        <div className="space-y-6">
          {data.map((project, index) => (
            <div
              key={project.id || index}
              className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-500">
                  Project {index + 1}
                </span>
                <button
                  onClick={() => removeProject(index)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={project.name}
                    onChange={(e) =>
                      updateProject(index, { ...project, name: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    URL
                  </label>
                  <input
                    type="url"
                    value={project.url || ""}
                    onChange={(e) =>
                      updateProject(index, { ...project, url: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    placeholder="https://github.com/..."
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Description
                  </label>
                  <textarea
                    value={project.description || ""}
                    onChange={(e) =>
                      updateProject(index, {
                        ...project,
                        description: e.target.value,
                      })
                    }
                    rows={2}
                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Technologies (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={project.technologies?.join(", ") || ""}
                    onChange={(e) =>
                      updateProject(index, {
                        ...project,
                        technologies: e.target.value
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean),
                      })
                    }
                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    placeholder="React, Node.js, PostgreSQL"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SkillsStep({
  data,
  onChange,
}: {
  data: Skill[];
  onChange: (data: Skill[]) => void;
}) {
  const addSkill = () => {
    onChange([...data, { id: crypto.randomUUID(), name: "" }]);
  };

  const updateSkill = (index: number, skill: Skill) => {
    const updated = [...data];
    updated[index] = skill;
    onChange(updated);
  };

  const removeSkill = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Skills
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            List your technical and soft skills.
          </p>
        </div>
        <button
          onClick={addSkill}
          className="rounded-md bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
        >
          + Add
        </button>
      </div>

      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          No skills added yet. Click &quot;+ Add&quot; to get started.
        </p>
      ) : (
        <div className="space-y-4">
          {data.map((skill, index) => (
            <div
              key={skill.id || index}
              className="flex items-center gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
            >
              <div className="flex-1">
                <input
                  type="text"
                  value={skill.name}
                  onChange={(e) =>
                    updateSkill(index, { ...skill, name: e.target.value })
                  }
                  className="block w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  placeholder="Skill name"
                />
              </div>
              <select
                value={skill.category || "technical"}
                onChange={(e) =>
                  updateSkill(index, {
                    ...skill,
                    category: e.target.value as Skill["category"],
                  })
                }
                className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="technical">Technical</option>
                <option value="soft">Soft Skill</option>
                <option value="tool">Tool</option>
                <option value="domain">Domain</option>
              </select>
              <select
                value={skill.proficiency || "intermediate"}
                onChange={(e) =>
                  updateSkill(index, {
                    ...skill,
                    proficiency: e.target.value as Skill["proficiency"],
                  })
                }
                className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
              <button
                onClick={() => removeSkill(index)}
                className="text-red-600 hover:text-red-700"
              >
                X
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewStep({ data }: { data: CareerData }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Review Your Profile
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Review your information before saving.
        </p>
      </div>

      {data.basics?.name && (
        <div>
          <h3 className="text-sm font-medium text-zinc-500">Basic Info</h3>
          <p className="text-zinc-900 dark:text-zinc-100">
            {data.basics.name}
            {data.basics.label && ` - ${data.basics.label}`}
          </p>
          {data.basics.email && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {data.basics.email}
            </p>
          )}
        </div>
      )}

      {data.work && data.work.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-zinc-500">
            Work Experience ({data.work.length})
          </h3>
          <ul className="mt-1 space-y-1">
            {data.work.map((w, i) => (
              <li key={i} className="text-zinc-900 dark:text-zinc-100">
                {w.position} at {w.company}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.education && data.education.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-zinc-500">
            Education ({data.education.length})
          </h3>
          <ul className="mt-1 space-y-1">
            {data.education.map((e, i) => (
              <li key={i} className="text-zinc-900 dark:text-zinc-100">
                {e.studyType} {e.area && `in ${e.area}`} - {e.institution}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.projects && data.projects.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-zinc-500">
            Projects ({data.projects.length})
          </h3>
          <ul className="mt-1 space-y-1">
            {data.projects.map((p, i) => (
              <li key={i} className="text-zinc-900 dark:text-zinc-100">
                {p.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.skills && data.skills.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-zinc-500">
            Skills ({data.skills.length})
          </h3>
          <div className="mt-1 flex flex-wrap gap-2">
            {data.skills.map((s, i) => (
              <span
                key={i}
                className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
              >
                {s.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
