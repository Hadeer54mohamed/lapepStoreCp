import React from "react";

export default function Loader() {
  return (
    <div
      className="w-full h-screen flex items-center justify-center"
      role="status"
      aria-label="Loading content"
    >
      <div className="text-center">
        {/* Loading Spinner */}
        <div className="mb-6 flex justify-center">
          <div
            className="w-20 h-20 border-4 border-t-blue-500 border-gray-300 rounded-full motion-safe:animate-spin motion-reduce:rotate-45"
            role="progressbar"
            aria-label="Loading progress"
          >
            <span className="sr-only">جاري التحميل...</span>
          </div>
        </div>

        {/* Loading Text */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400">
            جاري التحميل...
          </h2>
          <p className="text-gray-500 dark:text-gray-500 text-sm">
            يرجى الانتظار
          </p>
        </div>

        {/* Progressive Loading Dots */}
        <div className="mt-6 flex justify-center space-x-1">
          <div className="h-1.5 w-1.5 bg-blue-500 rounded-full motion-safe:animate-pulse"></div>
          <div className="h-1.5 w-1.5 bg-blue-500 rounded-full motion-safe:animate-pulse motion-safe:delay-75"></div>
          <div className="h-1.5 w-1.5 bg-blue-500 rounded-full motion-safe:animate-pulse motion-safe:delay-150"></div>
        </div>
      </div>
    </div>
  );
}
