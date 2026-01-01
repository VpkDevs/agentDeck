
import React from 'react';

interface TagProps {
  label: string;
}

const Tag: React.FC<TagProps> = ({ label }) => {
  return (
    <span className="inline-block bg-cyan-800/50 text-cyan-300 text-xs font-medium mr-2 px-2.5 py-1 rounded-full">
      {label}
    </span>
  );
};

export default Tag;
