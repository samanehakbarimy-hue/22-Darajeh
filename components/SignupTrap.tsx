/**
 * A field no person will ever fill in.
 *
 * Automated signups work by filling every input they find and submitting. This
 * one is off-screen, out of the tab order and hidden from screen readers, so a
 * person never meets it; a script fills it like any other. The signup action
 * treats a filled trap as a bot and stops before an account is created or a
 * confirmation email is sent — see `caughtInTrap` in lib/actions/auth.ts.
 *
 * It is not a CAPTCHA and will not stop somebody who writes a bot for this
 * site in particular. It costs a real visitor nothing, needs no third-party
 * account, and turns away the scripts that try every signup form they find.
 *
 * Clipped to one pixel rather than display:none or type="hidden": the simpler
 * scripts skip fields they can tell are hidden. And clipped in place rather
 * than pushed far off to the left, because on a right-to-left page anything
 * out to the left is scrollable, and the whole site would gain a sideways
 * scrollbar.
 */
export const TRAP_FIELD = "company_website";

export default function SignupTrap() {
  return (
    <div aria-hidden className="sr-only">
      <label>
        Website
        <input type="text" name={TRAP_FIELD} tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}
