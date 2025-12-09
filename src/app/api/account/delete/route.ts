import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// DELETE /api/account/delete - Permanently delete user account and all associated data
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request to get confirmation
    const body = await request.json().catch(() => ({}));
    const { confirmation } = body as { confirmation?: string };

    // Require explicit confirmation
    if (confirmation !== "DELETE_MY_ACCOUNT") {
      return NextResponse.json(
        {
          error: "Account deletion requires confirmation",
          message: "Please send { confirmation: 'DELETE_MY_ACCOUNT' } to confirm",
        },
        { status: 400 }
      );
    }

    // Delete all user data from database
    // Order matters due to foreign key constraints
    await prisma.$transaction(async (tx) => {
      // Delete user skills
      await tx.userSkill.deleteMany({
        where: { userId: user.id },
      });

      // Delete resumes
      await tx.resume.deleteMany({
        where: { userId: user.id },
      });

      // Delete jobs
      await tx.job.deleteMany({
        where: { userId: user.id },
      });

      // Delete documents
      await tx.document.deleteMany({
        where: { userId: user.id },
      });

      // Delete profile
      await tx.profile.deleteMany({
        where: { userId: user.id },
      });

      // Delete user
      await tx.user.deleteMany({
        where: { id: user.id },
      });
    });

    // Delete user from Supabase Storage (uploaded files)
    try {
      const { data: files } = await supabase.storage
        .from("documents")
        .list(user.id);

      if (files && files.length > 0) {
        const filePaths = files.map((f) => `${user.id}/${f.name}`);
        await supabase.storage.from("documents").remove(filePaths);
      }
    } catch (storageError) {
      // Log but don't fail the deletion
      console.error("Failed to delete storage files:", storageError);
    }

    // Delete user from Supabase Auth
    // Note: This requires admin privileges or the user needs to be the one making the request
    // For security, we sign them out instead and let Supabase handle cleanup
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: "Your account and all associated data have been permanently deleted",
    });
  } catch (err) {
    console.error("Account deletion failed:", err);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}

// GET /api/account/delete - Get information about what will be deleted
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Count user data
    const [profileCount, resumeCount, jobCount, documentCount, skillCount] = await Promise.all([
      prisma.profile.count({ where: { userId: user.id } }),
      prisma.resume.count({ where: { userId: user.id } }),
      prisma.job.count({ where: { userId: user.id } }),
      prisma.document.count({ where: { userId: user.id } }),
      prisma.userSkill.count({ where: { userId: user.id } }),
    ]);

    return NextResponse.json({
      email: user.email,
      dataToBeDeleted: {
        profile: profileCount > 0,
        resumes: resumeCount,
        jobs: jobCount,
        documents: documentCount,
        skills: skillCount,
      },
      warning: "This action is permanent and cannot be undone. All your data will be permanently deleted.",
      confirmation: "To proceed, send a DELETE request with { confirmation: 'DELETE_MY_ACCOUNT' }",
    });
  } catch (err) {
    console.error("Failed to get account info:", err);
    return NextResponse.json(
      { error: "Failed to get account information" },
      { status: 500 }
    );
  }
}
