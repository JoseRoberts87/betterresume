import { createClient } from "./server";

const BUCKET_NAME = "documents";

export async function uploadDocument(
  userId: string,
  file: File
): Promise<{ path: string; error: Error | null }> {
  const supabase = await createClient();

  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return { path: "", error: new Error(error.message) };
  }

  return { path: data.path, error: null };
}

export async function downloadDocument(
  path: string
): Promise<{ data: Blob | null; error: Error | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(path);

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data, error: null };
}

export async function deleteDocument(
  path: string
): Promise<{ error: Error | null }> {
  const supabase = await createClient();

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

  if (error) {
    return { error: new Error(error.message) };
  }

  return { error: null };
}

export async function listUserDocuments(
  userId: string
): Promise<{ files: string[]; error: Error | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(userId, {
      limit: 100,
      offset: 0,
    });

  if (error) {
    return { files: [], error: new Error(error.message) };
  }

  return {
    files: data.map((file) => `${userId}/${file.name}`),
    error: null,
  };
}

export function getPublicUrl(path: string): string {
  // Note: This only works if bucket is public
  // For private buckets, use createSignedUrl instead
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${path}`;
}

export async function createSignedUrl(
  path: string,
  expiresIn: number = 3600
): Promise<{ url: string | null; error: Error | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, expiresIn);

  if (error) {
    return { url: null, error: new Error(error.message) };
  }

  return { url: data.signedUrl, error: null };
}
