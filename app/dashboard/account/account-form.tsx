"use client";

import { useActionState, useState } from "react";
import { updateAccount, deleteAccount } from "@/lib/actions/account";
import Spinner from "@/components/Spinner";

export default function AccountForm({
  email,
  initialFullName,
  initialPhotoUrl,
}: {
  email: string;
  initialFullName: string;
  initialPhotoUrl: string;
}) {
  const [state, action, pending] = useActionState(updateAccount, undefined);
  const [preview, setPreview] = useState(initialPhotoUrl);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="mt-8 flex flex-col gap-10">
      <form action={action} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">ایمیل</label>
          <input
            value={email}
            disabled
            className="w-full rounded-lg border border-card-border bg-background px-4 py-2 text-muted"
          />
        </div>

        <div>
          <label htmlFor="photo" className="mb-1 block text-sm font-medium">
            عکس پروفایل
          </label>
          <div className="flex items-center gap-4">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt=""
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-brand-light" />
            )}
            <input
              id="photo"
              name="photo"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 3 * 1024 * 1024) {
                  alert("حجم عکس باید کمتر از ۳ مگابایت باشد.");
                  e.target.value = "";
                  return;
                }
                setPreview(URL.createObjectURL(file));
              }}
              className="text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-brand-light file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand"
            />
          </div>
        </div>

        <div>
          <label htmlFor="full_name" className="mb-1 block text-sm font-medium">
            نام و نام خانوادگی
          </label>
          <input
            id="full_name"
            name="full_name"
            required
            defaultValue={initialFullName}
            className="w-full rounded-lg border border-card-border bg-card px-4 py-2 outline-none focus:border-brand"
          />
        </div>

        {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
        {state?.success && (
          <p className="text-sm text-brand">تغییرات ذخیره شد.</p>
        )}

        <button
          disabled={pending}
          type="submit"
          className="inline-flex items-center justify-center gap-2 mt-2 self-start rounded-full bg-brand px-6 py-3 font-semibold text-background hover:bg-brand-dark disabled:opacity-60"
        >
          {pending && <Spinner />}
        {pending ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </button>
      </form>

      <div className="rounded-2xl border border-red-900/40 bg-red-950/10 p-5">
        <h2 className="font-bold text-red-400">حذف حساب</h2>
        <p className="mt-2 text-sm text-muted">
          با حذف حساب، تمام اطلاعات تو (پروفایل، زمان‌های آزاد، رزروها) برای
          همیشه پاک می‌شه. این کار غیرقابل بازگشته.
        </p>

        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={confirmDelete}
            onChange={(e) => setConfirmDelete(e.target.checked)}
            className="accent-red-500"
          />
          مطمئنم و می‌خوام حسابم کاملاً حذف بشه
        </label>

        <form
          action={deleteAccount}
          onSubmit={(e) => {
            if (!confirmDelete || !confirm("آخرین تأیید: حساب برای همیشه حذف بشه؟")) {
              e.preventDefault();
            }
          }}
        >
          <button
            type="submit"
            disabled={!confirmDelete}
            className="mt-4 rounded-full border border-red-500 px-6 py-3 font-semibold text-red-400 hover:bg-red-950/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            حذف کامل حساب
          </button>
        </form>
      </div>
    </div>
  );
}
