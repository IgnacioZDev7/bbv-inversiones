import React from 'react';

interface PagePlaceholderProps {
  title: string;
}

const PagePlaceholder: React.FC<PagePlaceholderProps> = ({ title }) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{title}</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-gray-600 dark:text-gray-400">
          Esta vista está en construcción. Aquí se implementará la funcionalidad de {title}.
        </p>
      </div>
    </div>
  );
};

export default PagePlaceholder;
