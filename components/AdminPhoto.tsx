"use client";

import { useActionState, useState } from "react";
import { setSpecialistPhoto } from "@/lib/actions/admin";
import SubmitButton from "@/components/SubmitButton";

/**
 * Replacing a specialist's photo from the admin page.
 *
 * Folded away behind a link, because it is not part of reviewing somebody —
 * it is the occasional job of fixing a picture that came off LinkedIn at
 * 100x100 and looks soft everywhere it is shown. Open on every specialist by
 * default, it would be four file pickers down a page nobody wants.
 *
 * It needs its own state rather than the plain form action the other admin
 * buttons use: sharp refuses HEIC and anything that is not really an image,
 * and "nothing happened" is a bad answer to a file that could not be read.
 */
export default function AdminPhoto({
  mentorId,
  name,
}: {
  mentorId: string;
  name: string;
}) {
  const [state, action] = useActionState(setSpecialistPhoto, undefined);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div className="mt-1">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="py-1.5 text-xs text-muted underline-offset-4 hover:text-brand-deep hover:underline"
        >
          تغییر عکس
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="mt-2">
      <input type="hidden" name="mentor_id" value={mentorId} />

      <label
        htmlFor={`photo-${mentorId}`}
        className="mb-1.5 block text-xs text-muted"
      >
        عکس تازه برای {name}
      </label>

      <input
        id={`photo-${mentorId}`}
        name="photo"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        required
        className="block w-full text-xs text-muted file:mr-3 file:rounded-full file:border file:border-card-border file:bg-background file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-foreground hover:file:border-brand"
      />

      {state?.error && (
        <p className="mt-2 text-xs text-danger">{state.error}</p>
      )}
      {state?.saved && (
        <p className="mt-2 text-xs text-success">عکس عوض شد.</p>
      )}

      <div className="mt-2 flex items-center gap-3">
        <SubmitButton variant="outline" pendingLabel="…" className="px-4 py-1.5 text-xs">
          ذخیره عکس
        </SubmitButton>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-muted hover:text-foreground"
        >
          بی‌خیال
        </button>
      </div>
    </form>
  );
}
