import React from "react";

export const FileCardSkeleton = () => (
  <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 mb-4 animate-pulse">
    <div className="flex items-start space-x-4">
      <div className="w-12 h-12 bg-gray-700 rounded-lg"></div>
      <div className="flex-1 space-y-3">
        <div className="h-5 bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        <div className="flex space-x-2">
          <div className="h-6 bg-gray-700 rounded w-20"></div>
          <div className="h-6 bg-gray-700 rounded w-20"></div>
        </div>
      </div>
    </div>
  </div>
);

export const SessionButtonSkeleton = () => (
  <div className="w-full text-left px-5 py-4 rounded-xl bg-gray-700 animate-pulse mb-2">
    <div className="h-5 bg-gray-600 rounded w-1/3"></div>
  </div>
);

export const SearchBarSkeleton = () => (
  <div className="relative animate-pulse">
    <div className="h-12 bg-gray-700 rounded-xl w-full"></div>
  </div>
);

export const ButtonSkeleton = ({ width = "w-32" }) => (
  <div className={`h-10 bg-gray-700 rounded-lg ${width} animate-pulse`}></div>
);



