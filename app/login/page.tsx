import LoginForm from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-bold">ورود</h1>
      <p className="mt-2 text-sm text-muted">وارد حساب جاب‌آموز شو.</p>
      <LoginForm next={next ?? ""} confirmFailed={error === "confirm_failed"} />
    </div>
  );
}
