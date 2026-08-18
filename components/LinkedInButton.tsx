import { signInWithLinkedIn } from "@/lib/actions/auth";

export default function LinkedInButton({
  role,
  label,
}: {
  role?: "mentor" | "seeker";
  label: string;
}) {
  return (
    <form action={signInWithLinkedIn.bind(null, role)}>
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-full border border-card-border px-6 py-3 font-medium hover:bg-card"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5 text-[#0A66C2]"
        >
          <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z" />
        </svg>
        {label}
      </button>
    </form>
  );
}
