import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import {
  emptyProjectItem,
  emptyWorkItem,
  profileInitialState,
} from "@/utils/profileForm";
import {
  EXPERIENCE_LEVELS,
  PROFILE_STEPS,
  validateProfileStep,
} from "@/utils/profileValidation";
import { cn } from "@/lib/utils";

const textareaClassName =
  "flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const FieldError = ({ message }) =>
  message ? <p className="mt-1 text-sm text-destructive">{message}</p> : null;

const ChipInput = ({ label, hint, values, onChange, error, placeholder }) => {
  const [draft, setDraft] = useState("");

  const addValue = () => {
    const next = draft.trim();
    if (!next) return;
    const normalized = next.toLowerCase();
    if (!values.some((item) => item.toLowerCase() === normalized)) {
      onChange([...values, next]);
    }
    setDraft("");
  };

  const removeValue = (index) => {
    onChange(values.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="space-y-2">
      <div>
        <Label>{label}</Label>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addValue();
            }
          }}
          placeholder={placeholder}
        />
        <Button type="button" variant="outline" size="icon" onClick={addValue} aria-label={`Add ${label}`}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <FieldError message={error} />
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {values.map((item, index) => (
            <Badge key={`${item}-${index}`} variant="secondary" className="gap-1 pr-1">
              {item}
              <button
                type="button"
                onClick={() => removeValue(index)}
                className="rounded-full p-0.5 hover:bg-background/60"
                aria-label={`Remove ${item}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const WorkItemCard = ({ title, item, index, prefix, onChange, onRemove, errors }) => (
  <div className="space-y-3 rounded-lg border border-border bg-background p-4">
    <div className="flex items-center justify-between gap-2">
      <p className="text-sm font-medium">{title}</p>
      <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
        <Trash2 className="mr-1 h-4 w-4" />
        Remove
      </Button>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <Label htmlFor={`${prefix}-${index}-title`}>Title</Label>
        <Input
          id={`${prefix}-${index}-title`}
          value={item.title}
          onChange={(e) => onChange(index, "title", e.target.value)}
          placeholder="Software Engineer Intern"
        />
        <FieldError message={errors[`${prefix}.${index}.title`]} />
      </div>
      <div>
        <Label htmlFor={`${prefix}-${index}-company`}>Company</Label>
        <Input
          id={`${prefix}-${index}-company`}
          value={item.company}
          onChange={(e) => onChange(index, "company", e.target.value)}
          placeholder="Acme Corp"
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${prefix}-${index}-duration`}>Duration</Label>
        <Input
          id={`${prefix}-${index}-duration`}
          value={item.duration}
          onChange={(e) => onChange(index, "duration", e.target.value)}
          placeholder="Jun 2024 – Aug 2024"
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${prefix}-${index}-description`}>Description</Label>
        <textarea
          id={`${prefix}-${index}-description`}
          value={item.description}
          onChange={(e) => onChange(index, "description", e.target.value)}
          className={textareaClassName}
          placeholder="What you built or achieved"
        />
      </div>
    </div>
  </div>
);

const ProjectItemCard = ({ item, index, onChange, onRemove, errors }) => (
  <div className="space-y-3 rounded-lg border border-border bg-background p-4">
    <div className="flex items-center justify-between gap-2">
      <p className="text-sm font-medium">Project {index + 1}</p>
      <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
        <Trash2 className="mr-1 h-4 w-4" />
        Remove
      </Button>
    </div>
    <div className="grid gap-3">
      <div>
        <Label htmlFor={`project-${index}-title`}>Project name</Label>
        <Input
          id={`project-${index}-title`}
          value={item.title}
          onChange={(e) => onChange(index, "title", e.target.value)}
          placeholder="JobVista"
        />
        <FieldError message={errors[`projects.${index}.title`]} />
      </div>
      <div>
        <Label htmlFor={`project-${index}-link`}>Link</Label>
        <Input
          id={`project-${index}-link`}
          value={item.link}
          onChange={(e) => onChange(index, "link", e.target.value)}
          placeholder="https://github.com/you/project"
        />
        <FieldError message={errors[`projects.${index}.link`]} />
      </div>
      <div>
        <Label htmlFor={`project-${index}-description`}>Description</Label>
        <textarea
          id={`project-${index}-description`}
          value={item.description}
          onChange={(e) => onChange(index, "description", e.target.value)}
          className={textareaClassName}
          placeholder="What the project does and your role"
        />
      </div>
    </div>
  </div>
);

const ProfileForm = ({
  user,
  loading = false,
  showSkip = false,
  onSkip,
  onSubmit,
  submitLabel = "Save profile",
  className,
}) => {
  const [input, setInput] = useState(profileInitialState(user));
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setInput(profileInitialState(user));
    setStepIndex(0);
    setErrors({});
  }, [user]);

  const currentStep = PROFILE_STEPS[stepIndex];

  const updateField = (name, value) => {
    setInput((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const updateWorkItem = (listName, index, field, value) => {
    setInput((prev) => ({
      ...prev,
      [listName]: prev[listName].map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`${listName}.${index}.${field}`];
      return next;
    });
  };

  const addWorkItem = (listName) => {
    setInput((prev) => ({
      ...prev,
      [listName]: [...prev[listName], emptyWorkItem()],
    }));
  };

  const removeWorkItem = (listName, index) => {
    setInput((prev) => ({
      ...prev,
      [listName]: prev[listName].filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const updateProjectItem = (index, field, value) => {
    setInput((prev) => ({
      ...prev,
      projects: prev.projects.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`projects.${index}.${field}`];
      return next;
    });
  };

  const addProjectItem = () => {
    setInput((prev) => ({
      ...prev,
      projects: [...prev.projects, emptyProjectItem()],
    }));
  };

  const removeProjectItem = (index) => {
    setInput((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const validateCurrentStep = () => {
    const stepErrors = validateProfileStep(currentStep.id, input);
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    setStepIndex((prev) => Math.min(prev + 1, PROFILE_STEPS.length - 1));
  };

  const handleBack = () => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;
    onSubmit?.(input);
  };

  const renderStep = () => {
    switch (currentStep.id) {
      case "basics":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullname">Full name</Label>
              <Input
                id="fullname"
                value={input.fullname}
                onChange={(e) => updateField("fullname", e.target.value)}
                placeholder="Your full name"
              />
              <FieldError message={errors.fullname} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={input.email} readOnly disabled className="bg-muted" />
              <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed here.</p>
            </div>
            <div>
              <Label htmlFor="phoneNumber">Phone number</Label>
              <Input
                id="phoneNumber"
                value={input.phoneNumber}
                onChange={(e) => updateField("phoneNumber", e.target.value)}
                placeholder="10-digit mobile number"
                inputMode="numeric"
              />
              <FieldError message={errors.phoneNumber} />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={input.location}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="Bangalore, India"
              />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                value={input.bio}
                onChange={(e) => updateField("bio", e.target.value)}
                className={textareaClassName}
                placeholder="Final-year CSE student interested in frontend development"
              />
            </div>
          </div>
        );

      case "education":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{currentStep.hint}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="college">College</Label>
                <Input
                  id="college"
                  value={input.college}
                  onChange={(e) => updateField("college", e.target.value)}
                  placeholder="Your college or university"
                />
              </div>
              <div>
                <Label htmlFor="degree">Degree</Label>
                <Input
                  id="degree"
                  value={input.degree}
                  onChange={(e) => updateField("degree", e.target.value)}
                  placeholder="B.Tech"
                />
              </div>
              <div>
                <Label htmlFor="branch">Branch</Label>
                <Input
                  id="branch"
                  value={input.branch}
                  onChange={(e) => updateField("branch", e.target.value)}
                  placeholder="Computer Science"
                />
              </div>
              <div>
                <Label htmlFor="graduationYear">Graduation year</Label>
                <Input
                  id="graduationYear"
                  value={input.graduationYear}
                  onChange={(e) => updateField("graduationYear", e.target.value)}
                  placeholder="2026"
                  inputMode="numeric"
                />
                <FieldError message={errors.graduationYear} />
              </div>
              <div>
                <Label htmlFor="cgpa">CGPA</Label>
                <Input
                  id="cgpa"
                  value={input.cgpa}
                  onChange={(e) => updateField("cgpa", e.target.value)}
                  placeholder="8.5"
                />
                <FieldError message={errors.cgpa} />
              </div>
            </div>
          </div>
        );

      case "skills":
        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">{currentStep.hint}</p>
            <ChipInput
              label="Skills"
              hint="Press Enter or + to add each skill"
              values={input.skills}
              onChange={(skills) => updateField("skills", skills)}
              error={errors.skills}
              placeholder="React, Node.js, MongoDB"
            />
            <ChipInput
              label="Preferred job roles"
              values={input.preferredJobRoles}
              onChange={(preferredJobRoles) => updateField("preferredJobRoles", preferredJobRoles)}
              error={errors.preferredJobRoles}
              placeholder="Frontend Developer, SDE Intern"
            />
            <div>
              <Label>Experience level</Label>
              <Select value={input.experienceLevel} onValueChange={(value) => updateField("experienceLevel", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your experience level" />
                </SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={errors.experienceLevel} />
            </div>
          </div>
        );

      case "experience":
        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">{currentStep.hint}</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium">Work experience</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => addWorkItem("experience")}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add experience
                </Button>
              </div>
              {input.experience.length === 0 ? (
                <p className="text-sm text-muted-foreground">No experience added yet. Skip if you are a fresher.</p>
              ) : (
                input.experience.map((item, index) => (
                  <WorkItemCard
                    key={`experience-${index}`}
                    title={`Experience ${index + 1}`}
                    item={item}
                    index={index}
                    prefix="experience"
                    onChange={(itemIndex, field, value) => updateWorkItem("experience", itemIndex, field, value)}
                    onRemove={() => removeWorkItem("experience", index)}
                    errors={errors}
                  />
                ))
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium">Internships</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => addWorkItem("internships")}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add internship
                </Button>
              </div>
              {input.internships.length === 0 ? (
                <p className="text-sm text-muted-foreground">No internships added yet.</p>
              ) : (
                input.internships.map((item, index) => (
                  <WorkItemCard
                    key={`internship-${index}`}
                    title={`Internship ${index + 1}`}
                    item={item}
                    index={index}
                    prefix="internships"
                    onChange={(itemIndex, field, value) => updateWorkItem("internships", itemIndex, field, value)}
                    onRemove={() => removeWorkItem("internships", index)}
                    errors={errors}
                  />
                ))
              )}
            </div>
          </div>
        );

      case "projects":
        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">{currentStep.hint}</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium">Projects</h3>
                <Button type="button" variant="outline" size="sm" onClick={addProjectItem}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add project
                </Button>
              </div>
              {input.projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No projects added yet.</p>
              ) : (
                input.projects.map((item, index) => (
                  <ProjectItemCard
                    key={`project-${index}`}
                    item={item}
                    index={index}
                    onChange={updateProjectItem}
                    onRemove={() => removeProjectItem(index)}
                    errors={errors}
                  />
                ))
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-1">
              <div>
                <Label htmlFor="portfolio">Portfolio</Label>
                <Input
                  id="portfolio"
                  value={input.portfolio}
                  onChange={(e) => updateField("portfolio", e.target.value)}
                  placeholder="https://yourportfolio.com"
                />
                <FieldError message={errors.portfolio} />
              </div>
              <div>
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={input.linkedin}
                  onChange={(e) => updateField("linkedin", e.target.value)}
                  placeholder="https://linkedin.com/in/you"
                />
                <FieldError message={errors.linkedin} />
              </div>
              <div>
                <Label htmlFor="github">GitHub</Label>
                <Input
                  id="github"
                  value={input.github}
                  onChange={(e) => updateField("github", e.target.value)}
                  placeholder="https://github.com/you"
                />
                <FieldError message={errors.github} />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const progress = ((stepIndex + 1) / PROFILE_STEPS.length) * 100;
  const isLastStep = stepIndex === PROFILE_STEPS.length - 1;

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col", className)}>
      <div className="mb-6 space-y-4">
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-brand transition-all duration-300"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={stepIndex + 1}
            aria-valuemin={1}
            aria-valuemax={PROFILE_STEPS.length}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {PROFILE_STEPS.map((step, index) => (
            <span
              key={step.id}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                index === stepIndex
                  ? "bg-brand text-brand-foreground"
                  : index < stepIndex
                    ? "bg-brand-muted text-brand"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {step.title}
            </span>
          ))}
        </div>
        <div>
          <h2 className="text-lg font-semibold">{currentStep.title}</h2>
          {currentStep.hint && currentStep.id !== "education" && currentStep.id !== "skills" ? (
            <p className="text-sm text-muted-foreground">{currentStep.hint}</p>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 pb-24">{renderStep()}</div>

      <div className="sticky bottom-0 -mx-1 border-t border-border bg-card px-1 py-4">
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {stepIndex > 0 ? (
              <Button type="button" variant="outline" onClick={handleBack} disabled={loading}>
                Back
              </Button>
            ) : showSkip ? (
              <Button type="button" variant="outline" onClick={() => onSkip?.(input)} disabled={loading}>
                Skip for now
              </Button>
            ) : (
              <span />
            )}
          </div>
          <div className="flex gap-2">
            {!isLastStep ? (
              <Button type="button" className="w-full sm:w-auto bg-brand hover:bg-brand/90" onClick={handleNext} disabled={loading}>
                Next
              </Button>
            ) : (
              <Button type="submit" className="w-full sm:w-auto bg-brand hover:bg-brand/90" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {submitLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
};

export default ProfileForm;
