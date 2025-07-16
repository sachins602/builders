import { useState, useRef } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Search, X } from "lucide-react";

interface NominatimSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface SearchBarProps {
  onSearch: (address: string) => Promise<boolean>;
  onClose: () => void;
}

export function SearchBar({ onSearch, onClose }: SearchBarProps) {
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch suggestions from Nominatim
  const fetchSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query,
        )}&addressdetails=1&limit=5`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );
      const data = (await res.json()) as NominatimSuggestion[];
      setSuggestions(data.map((item) => item.display_name));
    } catch (e) {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced input handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    setShowSuggestions(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchSuggestions(value);
    }, 300);
  };

  const handleSearch = async () => {
    setShowSuggestions(false);
    await onSearch(searchValue);
  };

  const handleKeyPress = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setShowSuggestions(false);
      await onSearch(searchValue);
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setSearchValue(suggestion);
    setShowSuggestions(false);
    await onSearch(suggestion);
  };

  return (
    <div className="relative flex h-24 w-full flex-row">
      <div className="w-full">
        <Input
          type="text"
          placeholder="Search for an address..."
          className="m-2"
          value={searchValue}
          onChange={handleInputChange}
          onKeyUp={handleKeyPress}
          onFocus={() => searchValue && setShowSuggestions(true)}
          autoComplete="off"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-50 mt-1 max-h-48 w-[calc(100%-1rem)] overflow-y-auto rounded-md border bg-white shadow-lg">
            {suggestions.map((suggestion, idx) => (
              <li
                key={idx}
                className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </li>
            ))}
            {loading && (
              <li className="px-4 py-2 text-sm text-gray-400">Loading...</li>
            )}
          </ul>
        )}
      </div>
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
