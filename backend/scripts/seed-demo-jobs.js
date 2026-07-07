/**
 * Seed demo data for JobVista.
 *
 * Populates the database with a demo recruiter, a few companies, and a set of
 * realistic IT job openings so the live homepage always has content, even when
 * the external job APIs (Remotive/Arbeitnow) are unavailable.
 *
 * Usage (from the backend/ folder):
 *   MONGO_URI="<your-mongodb-connection-string>" node scripts/seed-demo-jobs.js
 * or, if MONGO_URI is already in your .env:
 *   node scripts/seed-demo-jobs.js
 *
 * The script is idempotent: it upserts the demo recruiter and companies by a
 * stable key and replaces only the jobs created by the demo recruiter, so it is
 * safe to run multiple times and will never touch real recruiter data.
 */

import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import { User } from "../models/user.model.js";
import { Company } from "../models/company.model.js";
import { Job } from "../models/job.model.js";

const DEMO_RECRUITER_EMAIL = "demo.recruiter@jobvista.dev";

const companies = [
  {
    name: "TechNova Solutions",
    description:
      "A product engineering company building large-scale SaaS platforms for global clients.",
    website: "https://technova.example.com",
    location: "Bengaluru, India",
  },
  {
    name: "CloudScale Systems",
    description:
      "Cloud-native infrastructure and DevOps tooling for high-growth startups.",
    website: "https://cloudscale.example.com",
    location: "Remote (India)",
  },
  {
    name: "PixelForge Labs",
    description:
      "A design-led studio crafting delightful web and mobile experiences.",
    website: "https://pixelforge.example.com",
    location: "Pune, India",
  },
  {
    name: "DataHarbor Analytics",
    description:
      "Data platform and ML products that turn raw events into decisions.",
    website: "https://dataharbor.example.com",
    location: "Hyderabad, India",
  },
  {
    name: "FinEdge Technologies",
    description:
      "Fintech company building secure, scalable payment and lending systems.",
    website: "https://finedge.example.com",
    location: "Gurugram, India",
  },
];

const logoFor = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=0D8ABC&color=fff&size=128&bold=true`;

// experienceLevel is in years; salary is in LPA; position is number of openings.
const jobs = [
  {
    title: "Frontend Developer (React)",
    company: "PixelForge Labs",
    description:
      "Build responsive, accessible interfaces in React and TypeScript. Collaborate with designers to ship polished features and improve Core Web Vitals across the product.",
    requirements: ["React", "TypeScript", "Tailwind CSS", "REST APIs", "Git"],
    experienceLevel: 1,
    salary: 8,
    location: "Pune, India",
    jobType: "Full-time",
    position: 3,
  },
  {
    title: "Backend Developer (Node.js)",
    company: "TechNova Solutions",
    description:
      "Design and build REST APIs with Node.js and Express. Own database modeling, authentication, and integrations with third-party services.",
    requirements: ["Node.js", "Express", "MongoDB", "JWT", "REST APIs"],
    experienceLevel: 2,
    salary: 12,
    location: "Bengaluru, India",
    jobType: "Full-time",
    position: 2,
  },
  {
    title: "Full Stack Engineer (MERN)",
    company: "TechNova Solutions",
    description:
      "Work across the stack shipping features end to end with React, Node.js, and MongoDB. Take ownership from design through deployment.",
    requirements: ["React", "Node.js", "Express", "MongoDB", "CI/CD"],
    experienceLevel: 2,
    salary: 14,
    location: "Remote (India)",
    jobType: "Full-time",
    position: 4,
  },
  {
    title: "Frontend Developer Intern",
    company: "PixelForge Labs",
    description:
      "A 6-month internship for students and fresh graduates. Build real product features in React under mentorship and learn modern frontend engineering.",
    requirements: ["JavaScript", "React", "HTML", "CSS", "Git"],
    experienceLevel: 0,
    salary: 4,
    location: "Remote (India)",
    jobType: "Internship",
    position: 5,
  },
  {
    title: "DevOps Engineer",
    company: "CloudScale Systems",
    description:
      "Own CI/CD pipelines, container orchestration, and cloud infrastructure. Improve reliability, observability, and deployment velocity.",
    requirements: ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD"],
    experienceLevel: 3,
    salary: 20,
    location: "Remote (India)",
    jobType: "Full-time",
    position: 2,
  },
  {
    title: "Data Engineer",
    company: "DataHarbor Analytics",
    description:
      "Build and maintain data pipelines and warehouses. Work with large datasets to power analytics and machine learning workflows.",
    requirements: ["Python", "SQL", "Airflow", "Spark", "AWS"],
    experienceLevel: 2,
    salary: 16,
    location: "Hyderabad, India",
    jobType: "Full-time",
    position: 2,
  },
  {
    title: "Machine Learning Engineer",
    company: "DataHarbor Analytics",
    description:
      "Design, train, and deploy ML models to production. Collaborate with data engineers to build reliable, scalable inference services.",
    requirements: ["Python", "PyTorch", "scikit-learn", "MLOps", "SQL"],
    experienceLevel: 3,
    salary: 24,
    location: "Hyderabad, India",
    jobType: "Full-time",
    position: 1,
  },
  {
    title: "Software Engineer (Backend)",
    company: "FinEdge Technologies",
    description:
      "Build secure, high-throughput payment services. Focus on correctness, performance, and clean, well-tested code.",
    requirements: ["Java", "Spring Boot", "PostgreSQL", "Kafka", "REST APIs"],
    experienceLevel: 2,
    salary: 18,
    location: "Gurugram, India",
    jobType: "Full-time",
    position: 3,
  },
  {
    title: "Android Developer",
    company: "PixelForge Labs",
    description:
      "Build and maintain native Android apps. Deliver smooth, performant experiences and collaborate closely with backend and design teams.",
    requirements: ["Kotlin", "Android SDK", "Jetpack Compose", "REST APIs"],
    experienceLevel: 2,
    salary: 13,
    location: "Pune, India",
    jobType: "Full-time",
    position: 1,
  },
  {
    title: "QA Automation Engineer",
    company: "TechNova Solutions",
    description:
      "Design and maintain automated test suites. Improve release quality with end-to-end, integration, and API tests.",
    requirements: ["JavaScript", "Playwright", "Cypress", "CI/CD", "API testing"],
    experienceLevel: 2,
    salary: 11,
    location: "Bengaluru, India",
    jobType: "Full-time",
    position: 2,
  },
  {
    title: "Cloud Engineer",
    company: "CloudScale Systems",
    description:
      "Design and operate cloud infrastructure on AWS. Automate provisioning and improve cost, security, and reliability.",
    requirements: ["AWS", "Terraform", "Linux", "Python", "Networking"],
    experienceLevel: 3,
    salary: 21,
    location: "Remote (India)",
    jobType: "Full-time",
    position: 1,
  },
  {
    title: "Full Stack Developer (Next.js)",
    company: "FinEdge Technologies",
    description:
      "Ship features across a Next.js and Node.js stack. Own performance, SEO, and clean API design for customer-facing products.",
    requirements: ["Next.js", "React", "Node.js", "PostgreSQL", "Prisma"],
    experienceLevel: 1,
    salary: 12,
    location: "Gurugram, India",
    jobType: "Full-time",
    position: 2,
  },
  {
    title: "Backend Developer Intern",
    company: "CloudScale Systems",
    description:
      "A hands-on internship building APIs and tooling with Node.js. Great for students who want production experience with real systems.",
    requirements: ["Node.js", "Express", "MongoDB", "Git", "REST APIs"],
    experienceLevel: 0,
    salary: 4,
    location: "Remote (India)",
    jobType: "Internship",
    position: 4,
  },
  {
    title: "Site Reliability Engineer (SRE)",
    company: "CloudScale Systems",
    description:
      "Keep production systems healthy and fast. Own monitoring, alerting, incident response, and reliability improvements.",
    requirements: ["Kubernetes", "Prometheus", "Grafana", "Go", "Linux"],
    experienceLevel: 4,
    salary: 28,
    location: "Remote (India)",
    jobType: "Full-time",
    position: 1,
  },
  {
    title: "Software Developer (Fresher)",
    company: "TechNova Solutions",
    description:
      "An entry-level role for 2024-2026 graduates. Learn modern engineering practices while contributing to real product features.",
    requirements: ["JavaScript", "Data Structures", "Git", "SQL", "Problem solving"],
    experienceLevel: 0,
    salary: 6,
    location: "Bengaluru, India",
    jobType: "Full-time",
    position: 6,
  },
];

async function seed() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error(
      "[seed] MONGO_URI is not set. Provide it via .env or as an environment variable."
    );
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("[seed] connected to MongoDB");

  // 1. Upsert a demo recruiter.
  const hashedPassword = await bcrypt.hash("DemoRecruiter@123", 10);
  const recruiter = await User.findOneAndUpdate(
    { email: DEMO_RECRUITER_EMAIL },
    {
      $set: {
        fullname: "JobVista Demo Recruiter",
        phoneNumber: 9000000000,
        password: hashedPassword,
        role: "recruiter",
      },
    },
    { new: true, upsert: true }
  );
  console.log(`[seed] recruiter ready: ${recruiter.email}`);

  // 2. Upsert companies owned by the demo recruiter.
  const companyByName = {};
  for (const c of companies) {
    const company = await Company.findOneAndUpdate(
      { name: c.name },
      {
        $set: {
          description: c.description,
          website: c.website,
          location: c.location,
          logo: logoFor(c.name),
          userId: recruiter._id,
        },
      },
      { new: true, upsert: true }
    );
    companyByName[c.name] = company._id;
  }
  console.log(`[seed] ${companies.length} companies ready`);

  // 3. Replace only the demo recruiter's jobs (idempotent, safe re-runs).
  const removed = await Job.deleteMany({ created_by: recruiter._id });
  if (removed.deletedCount) {
    console.log(`[seed] cleared ${removed.deletedCount} old demo jobs`);
  }

  const docs = jobs.map((j) => ({
    title: j.title,
    description: j.description,
    requirements: j.requirements,
    experienceLevel: j.experienceLevel,
    salary: j.salary,
    location: j.location,
    jobType: j.jobType,
    position: j.position,
    company: companyByName[j.company],
    created_by: recruiter._id,
  }));

  const inserted = await Job.insertMany(docs);
  console.log(`[seed] inserted ${inserted.length} demo jobs`);

  await mongoose.disconnect();
  console.log("[seed] done");
}

seed().catch(async (err) => {
  console.error("[seed] failed:", err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
