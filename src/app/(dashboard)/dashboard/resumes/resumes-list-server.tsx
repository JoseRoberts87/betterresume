import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ResumesList } from "./resumes-list";

export async function ResumesListServer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const resumes = await prisma.resume.findMany({
    where: { userId: user.id },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          company: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return <ResumesList resumes={resumes} />;
}
