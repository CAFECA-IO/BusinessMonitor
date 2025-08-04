import React from 'react';
import { FiSearch } from 'react-icons/fi';

const SearchInput: React.FC = () => {
  const dummyTag = ['Business', 'Search', 'Input', 'Component'];

  const tags = dummyTag.map((tag) => (
    <button
      type="button"
      key={tag}
      className="rounded-full bg-grey-100 px-12px py-2px font-normal text-text-primary"
    >
      {tag}
    </button>
  ));

  return (
    <div className="flex flex-col items-start gap-16px">
      {/* Info: (20250804 - Julian) Search Input */}
      <div className="flex h-56px w-full items-center gap-8px rounded-radius-s border border-border-secondary bg-surface-primary p-spacing-2xs text-base font-normal text-text-primary">
        <FiSearch size={24} />
        <input
          type="text"
          className="flex-1 bg-transparent placeholder:text-text-note"
          placeholder="Enter business name or business ID"
        />
      </div>

      {/* Info: (20250804 - Julian) Search Tags */}
      <div className="flex items-center gap-12px">{tags}</div>
    </div>
  );
};

export default SearchInput;
