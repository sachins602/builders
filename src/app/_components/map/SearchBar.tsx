import { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  onSearch: (address: string) => Promise<boolean>;
  onClose: () => void;
}

export function SearchBar({ onSearch, onClose }: SearchBarProps) {
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = async () => {
    await onSearch(searchValue);
  };

  const handleKeyPress = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      await onSearch(searchValue);
    }
  };

  return (
    <div className="flex h-24 w-full flex-row">
      <Input
        type="text"
        placeholder="Search for an address..."
        className="m-2"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onKeyUp={handleKeyPress}
      />
      <Button
        variant="secondary"
        size="icon"
        className="m-2"
        onClick={handleSearch}
      >
        <Search />
      </Button>
      <Button variant="secondary" size="icon" className="m-2" onClick={onClose}>
        <X />
      </Button>
    </div>
  );
}
