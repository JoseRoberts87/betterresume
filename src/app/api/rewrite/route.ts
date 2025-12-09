import { createClient } from "@/lib/supabase/server";
import {
  rewriteContentWithRetry,
  generateProfessionalSummary,
  type RewriteRequest,
} from "@/lib/content-rewriter";
import { NextResponse } from "next/server";
import type { ExtractedSkill } from "@/types/job";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, content, type, context } = body as {
      action: "rewrite" | "generate-summary";
      content?: string;
      type?: RewriteRequest["type"];
      context?: {
        jobTitle?: string;
        company?: string;
        targetRole?: string;
        targetSkills?: ExtractedSkill[];
        currentRole?: string;
        yearsExperience?: number;
        topSkills?: string[];
      };
    };

    if (action === "rewrite") {
      if (!content || !type) {
        return NextResponse.json(
          { error: "Missing content or type" },
          { status: 400 }
        );
      }

      const result = await rewriteContentWithRetry({
        type,
        content,
        context: {
          jobTitle: context?.jobTitle,
          company: context?.company,
          targetRole: context?.targetRole,
          targetSkills: context?.targetSkills,
        },
      });

      return NextResponse.json({ result });
    }

    if (action === "generate-summary") {
      if (!context?.currentRole || !context?.topSkills) {
        return NextResponse.json(
          { error: "Missing required context for summary generation" },
          { status: 400 }
        );
      }

      const result = await generateProfessionalSummary(
        context.currentRole,
        context.yearsExperience || 0,
        context.topSkills,
        context.targetRole
      );

      return NextResponse.json({ result });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (err) {
    console.error("Rewrite failed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
