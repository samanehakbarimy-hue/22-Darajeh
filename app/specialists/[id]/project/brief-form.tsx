"use client";

import { useActionState, useRef, useState } from "react";
import { sendBrief } from "@/lib/actions/project-brief";
import { createClient } from "@/lib/supabase/client";
import Spinner from "@/components/Spinner";

const FIELD =
  "w-full rounded-xl border border-card-border bg-card px-4 py-3 text-sm leading-7 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

const MAX_BYTES = 20 * 1024 * 1024;

const ACCEPT =
  ".pdf,.png,.jpg,.jpeg,.webp,.zip,.doc,.docx,.xls,.xlsx,.txt";

function humanSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 1
    ? `${mb.toLocaleString("fa-IR", { maximumFractionDigits: 1 })} مگابایت`
    : `${Math.max(1, Math.round(bytes / 1024)).toLocaleString("fa-IR")} کیلوبایت`;
}

export default function BriefForm({ mentorId }: { mentorId: string }) {
  const [state, action, pending] = useActionState(sendBrief, undefined);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const pathRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  /**
   * The file goes straight from the browser to storage rather than through a
   * server action: Vercel caps an action body at a few megabytes, and a
   * drawing is routinely larger than that. The bucket is private and the
   * upload policy only permits a folder named after the person uploading.
   */
  async function upload(chosen: File) {
    setUploadError(null);

    if (chosen.size > MAX_BYTES) {
      setUploadError(
        `این فایل ${humanSize(chosen.size)} است و از ۲۰ مگابایت بیشتر می‌شود.`,
      );
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUploadError("انگار از حسابت خارج شدی. دوباره وارد شو.");
      setUploading(false);
      return;
    }

    // The original name is kept only as a label; the stored key is random, so
    // one person's filename can never collide with or overwrite another's.
    const key = `${user.id}/${crypto.randomUUID()}`;
    const { error } = await supabase.storage
      .from("project-files")
      .upload(key, chosen, { contentType: chosen.type || undefined });

    setUploading(false);

    if (error) {
      setUploadError("فرستادن فایل انجام نشد. نوع یا حجمش را بررسی کن.");
      return;
    }

    if (pathRef.current) pathRef.current.value = key;
    if (nameRef.current) nameRef.current.value = chosen.name.slice(0, 200);
    setFile(chosen);
  }

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="mentor_id" value={mentorId} />
      <input type="hidden" name="attachment_path" ref={pathRef} />
      <input type="hidden" name="attachment_name" ref={nameRef} />

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">کار چیست؟</span>
        <textarea
          name="brief"
          rows={9}
          required
          minLength={20}
          maxLength={4000}
          placeholder="چه چیزی ساخته یا بررسی شود، در چه مرحله‌ای هستی، چه چیزی از قبل آماده است، و تا کِی لازمش داری."
          className={FIELD}
        />
      </label>

      <div className="rounded-xl border border-card-border p-4">
        <p className="text-sm font-medium">
          فایل <span className="text-muted">(اختیاری)</span>
        </p>
        <p className="mt-1 text-xs leading-6 text-muted">
          نقشه، مدرک، رزومه یا هر چیزی که کار را روشن‌تر می‌کند. فقط همین متخصص
          می‌تواند بازش کند.
        </p>

        <label className="mt-3 inline-block cursor-pointer rounded-full border border-card-border px-4 py-2 text-sm hover:border-brand hover:text-brand">
          {file ? "فایل دیگری انتخاب کن" : "انتخاب فایل"}
          <input
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(event) => {
              const chosen = event.target.files?.[0];
              if (chosen) void upload(chosen);
            }}
          />
        </label>

        {uploading && (
          <p className="mt-2 flex items-center gap-2 text-xs text-muted">
            <Spinner /> در حال فرستادن فایل...
          </p>
        )}

        {file && !uploading && (
          <p className="mt-2 text-xs text-success">
            ✓ {file.name} ({humanSize(file.size)})
          </p>
        )}

        {uploadError && (
          <p className="mt-2 text-xs text-red-400">{uploadError}</p>
        )}
      </div>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <button
        disabled={pending || uploading}
        type="submit"
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-background hover:bg-brand-hover disabled:opacity-60"
      >
        {pending && <Spinner />}
        {pending ? "در حال فرستادن..." : "فرستادن درخواست"}
      </button>

      <p className="text-xs leading-6 text-muted">
        تا وقتی جواب نگرفتی می‌تونی پسش بگیری. پرداخت آنلاین هنوز فعال نیست، پس
        این فقط توافق روی کار و نرخ است.
      </p>
    </form>
  );
}
