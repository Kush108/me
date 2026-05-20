import { NextRequest, NextResponse } from "next/server";
import { MY_PROFILE } from "@/lib/profile";
import { isAuthenticated } from "@/lib/auth";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  const { jobTitle, company, jobDescription } = await req.json();

  if (!jobTitle || !jobDescription) {
    return NextResponse.json(
      { error: "Missing job title or description" },
      { status: 400 }
    );
  }

  const systemPrompt = `You are a professional resume and cover letter writer. 
You write in a confident, technical, specific, and human tone — not corporate fluff. 
You NEVER use phrases like "I am writing to express my interest" or "I am excited to apply."
You NEVER use bullet point lists in cover letters — only clean paragraphs.
You output ONLY valid JSON with no markdown formatting, no backticks, no preamble.`;

  const userPrompt = `
I am applying for this job:
JOB TITLE: ${jobTitle}
COMPANY: ${company || "Unknown"}
JOB DESCRIPTION:
${String(jobDescription).substring(0, 3000)}

HERE IS MY PROFILE:
Name: ${MY_PROFILE.name}
Summary: ${MY_PROFILE.summary}
Skills: ${MY_PROFILE.skills.join(", ")}
Experience: ${MY_PROFILE.experience}
Education: ${MY_PROFILE.education}
Certifications: ${MY_PROFILE.certifications.join(", ")}
Projects: ${MY_PROFILE.projects}

TASK: Generate two things tailored specifically to this job:

1. TAILORED_SUMMARY: A 3-4 sentence professional summary (for the top of my resume) that directly mirrors the language and priorities in the job description. Use specific keywords from the posting. Do NOT be generic. Make it sound like I was built for this exact role.

2. COVER_LETTER: A 4-paragraph cover letter (no salutation or sign-off needed — I will add those). 
   - Para 1: Why I want THIS specific role at THIS company (be specific, not generic).
   - Para 2: Directly connect my MSP experience and certifications to the core requirements of this posting.
   - Para 3: One concrete example from my work that demonstrates I can do what they need.
   - Para 4: Forward-looking close — what I bring, what I want to develop.
   Keep it under 400 words total. Sound human and direct, not robotic.

Respond ONLY with this JSON structure (no markdown, no backticks):
{
  "tailoredSummary": "...",
  "coverLetter": "...",
  "keywordsMatched": ["keyword1", "keyword2"],
  "missingSkills": ["skill1"],
  "matchNotes": "1-2 sentence honest assessment of fit"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1200,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message.content || "{}";
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json(parsed);
  } catch (e) {
    console.error("OpenAI error:", e);
    return NextResponse.json({ error: "Tailoring failed" }, { status: 500 });
  }
}
