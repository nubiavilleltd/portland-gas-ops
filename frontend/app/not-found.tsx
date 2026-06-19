import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg">
      <div className="text-center">
        <p className="text-6xl font-bold text-brand-purple">404</p>
        <h1 className="mt-4 text-xl font-semibold text-brand-text-primary">Page not found</h1>
        <p className="mt-2 text-sm text-brand-text-secondary">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block px-5 py-2.5 bg-brand-purple text-white text-sm font-medium rounded-lg hover:bg-brand-purple-dark transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
