"use client";
import React, { useState, useEffect, useRef } from "react";
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

  // Simpan onSearch terbaru di ref agar debounce hanya trigger saat teks berubah,
  // bukan saat parent re-render (yang mengubah identitas fungsi inline).
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchRef.current(value);
    }, debounceTime);

    return () => clearTimeout(timer);
  }, [value, debounceTime]);

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
