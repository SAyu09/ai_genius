/**
 * Root template — provides page-transition animation via CSS.
 *
 * NOTE: We intentionally avoid framer-motion here because a root template
 * re-mounts on every navigation, and framer-motion's layout effects fire
 * before the Next.js router is fully initialised, causing:
 *   "Internal Next.js error: Router action dispatched before initialization"
 *
 * A pure-CSS `@keyframes` animation avoids this entirely while still giving
 * users a smooth fade-in on every route change.
 */
export default function RootTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen animate-page-enter">
      {children}
    </div>
  );
}
