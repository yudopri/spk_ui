"use client";
import React, { useState, useEffect } from "react";
import { TextInput } from "flowbite-react";
import { Icon } from "@iconify/react";

interface DataSearchProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  debounceTime?: number;
  initialValue?: string;
  className?: string;
}

const DataSearch: React.FC<DataSearchProps> = ({
  placeholder = "Cari data...",
  onSearch,
  debounceTime = 500,
  initialValue = "",
  className = "w-full md:w-80",
}) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(value);
    }, debounceTime);

    return () => clearTimeout(timer);
  }, [value, debounceTime, onSearch]);

  return (
    <div className={className}>
      <TextInput
        icon={() => <Icon icon="solar:magnifer-linear" className="text-xl" />}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        sizing="md"
      />
    </div>
  );
};

export default DataSearch;
