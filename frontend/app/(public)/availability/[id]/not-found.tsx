import Link from "next/link";
import { Home as HomeIcon } from "lucide-react";

export default function PropertyNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20">
      <div className="text-center glass-card p-12 max-w-md">
        <HomeIcon className="w-12 h-12 text-primary mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-foreground mb-3">Property Not Found</h1>
        <p className="text-foreground-secondary mb-8">
          This listing may have been archived, leased, or removed.
        </p>
        <Link href="/availability" className="btn-primary justify-center">
          Browse All Properties
        </Link>
      </div>
    </div>
  );
}
