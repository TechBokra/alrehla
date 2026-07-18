import React from 'react';

const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border">
      <div className="h-56 bg-gray-200 animate-pulse"></div>
      <div className="p-6">
        <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse mb-6"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 w-32 bg-gray-200 rounded-full animate-pulse mt-6"></div>
      </div>
    </div>
  );
};

export default SkeletonCard;