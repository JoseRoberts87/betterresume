import { createClient } from "@/lib/supabase/server";
import { parseDocument, isSupportedMimeType } from "@/lib/parsers";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    if (!isSupportedMimeType(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, DOCX, or TXT." },
        { status: 400 }
      );
    }

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse document
    const { text, error: parseError } = await parseDocument(buffer, file.type);

    if (parseError) {
      return NextResponse.json(
        { error: `Failed to parse document: ${parseError}` },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      // Continue even if storage fails - we have the parsed text
    }

    return NextResponse.json({
      success: true,
      filename: file.name,
      mimeType: file.type,
      storagePath: fileName,
      parsedText: text,
      textLength: text.length,
    });
  } catch (err) {
    console.error("Document upload error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
