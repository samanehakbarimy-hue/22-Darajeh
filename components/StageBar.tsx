/**
 * Where someone is in becoming a specialist.
 *
 * Named for what the person is telling us at each step, not for what the site
 * is doing with it — nobody filling in a form thinks of themselves as being
 * registered. The same bar appears on the signup page and on the profile page
 * they land on afterwards, so the second screen is visibly the middle of
 * something rather than a form arriving out of nowhere.
 */
const STAGES = ["درباره‌ی تو", "پروفایل", "تجربه"];

export default function StageBar({ current }: { current: number }) {
  return (
    <ol className="mt-8 flex items-start">
      {STAGES.map((label, i) => {
        const done = i < current;
        const here = i === current;
        return (
          <li
            key={label}
            className={`flex items-start ${i < STAGES.length - 1 ? "flex-1" : ""}`}
          >
            <div className="flex w-24 shrink-0 flex-col items-center gap-2">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  here || done
                    ? "bg-brand text-brand-on"
                    : "border border-card-border bg-card text-muted"
                }`}
              >
                {done ? "✓" : (i + 1).toLocaleString("fa-IR")}
              </span>
              <span
                className={`text-center text-xs leading-5 ${
                  here ? "font-medium text-foreground" : "text-muted"
                }`}
              >
                {label}
              </span>
            </div>
            {/* Half the circle's height down, so the line meets the circles
                rather than floating between them and their labels. */}
            {i < STAGES.length - 1 && (
              <div className="mx-1 mt-4 h-px flex-1 bg-card-border" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
