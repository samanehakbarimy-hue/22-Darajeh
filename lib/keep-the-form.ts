import { unstable_rethrow } from "next/navigation";

type FormState = { error?: string } | undefined;

/**
 * Wraps a form's server action so that a request that dies — the network
 * dropping, the server not answering, Vercel cutting a function off at five
 * minutes — becomes an error line under the button, with everything the
 * person typed still on the screen.
 *
 * Without this, React hands the failure to the nearest error boundary, which
 * replaces the whole page with «از سمت ما بود، نه تو» and unmounts the form.
 * Somebody who spent ten minutes on a profile then loses all of it, and is
 * told it was our fault when it may have been their connection. That was a
 * real person's first experience of the site on 2026-09-29.
 *
 * Next's own redirect and not-found signals are thrown too, on purpose, and
 * must keep flying — unstable_rethrow is what tells them apart from a failure.
 */
export function keepTheForm<S extends FormState>(
  action: (prev: S, formData: FormData) => Promise<S>,
  message: string,
): (prev: S, formData: FormData) => Promise<S> {
  return async (prev, formData) => {
    try {
      return await action(prev, formData);
    } catch (error) {
      unstable_rethrow(error);
      return { error: message } as S;
    }
  };
}
