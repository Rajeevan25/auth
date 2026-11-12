import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { DarkModeToggle } from '../components/common/DarkModeToggle';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-between p-6">
      <div className="w-full max-w-4xl flex justify-end">
        <DarkModeToggle />
      </div>

      <div className="text-center space-y-6 max-w-md my-auto animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-100 dark:border-brand-900/60 flex items-center justify-center mx-auto text-brand-600 dark:text-brand-400">
          <FileQuestion className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            404 Error
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Page not found
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Sorry, we could not find the page you are looking for. It might have been moved or deleted.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-md shadow-brand-500/20 focus-ring"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>

      <div className="text-xs text-slate-500 py-4">
        SecureAuth Platform
      </div>
    </div>
  );
};

