import { useState, useRef } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Search, X } from "lucide-react";
import { Loading } from "../ui/loading";
import { toast } from "sonner";

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
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = (await res.json()) as NominatimSuggestion[];
      setSuggestions(data.map((item) => item.display_name));
    } catch (e) {
      console.error("Error fetching suggestions:", e);
      // Don't clear suggestions on error, keep previous ones if available
      // This prevents the suggestions from disappearing when there's a network error
      toast.error("Failed to load address suggestions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Debounced input handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);

    // Clear error when user starts typing
    if (error) {
      setError(null);
    }

    if (value.trim().length >= 3) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchSuggestions(value);
    }, 300);
  };

  const handleSearch = async () => {
    if (!searchValue.trim() || searching) return;

    if (searchValue.trim().length < 3) {
      setError("Please enter at least 3 characters to search.");
      toast.error("Please enter at least 3 characters to search.");
      return;
    }

    setError(null);
    setShowSuggestions(false);
    setSearching(true);
    try {
      const success = await onSearch(searchValue);
      // Only hide suggestions if search was successful
      if (!success) {
        setShowSuggestions(true);
        setError("Search failed. Please try again or check your address.");
        // Keep the search value so user can try again
        toast.error("Search failed. Please try again or check your address.");
      }
    } catch (err) {
      setShowSuggestions(true);
      setError("An unexpected error occurred. Please try again.");
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !searching) {
      if (searchValue.trim().length < 3) {
        setError("Please enter at least 3 characters to search.");
        toast.error("Please enter at least 3 characters to search.");
        return;
      }

      setError(null);
      setShowSuggestions(false);
      setSearching(true);
      try {
        const success = await onSearch(searchValue);
        // Only hide suggestions if search was successful
        if (!success) {
          setShowSuggestions(true);
          setError("Search failed. Please try again or check your address.");
          // Keep the search value so user can try again
          toast.error("Search failed. Please try again or check your address.");
        }
      } catch (err) {
        setShowSuggestions(true);
        setError("An unexpected error occurred. Please try again.");
        toast.error("An unexpected error occurred. Please try again.");
      } finally {
        setSearching(false);
      }
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    if (searching) return;

    setError(null);
    setSearchValue(suggestion);
    setShowSuggestions(false);
    setSearching(true);
    try {
      const success = await onSearch(suggestion);
      // Only hide suggestions if search was successful
      if (!success) {
        setShowSuggestions(true);
        setError("Search failed. Please try again or check your address.");
        // Keep the search value so user can try again
        toast.error("Search failed. Please try again or check your address.");
      }
    } catch (err) {
      setShowSuggestions(true);
      setError("An unexpected error occurred. Please try again.");
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="relative flex h-24 w-full flex-row">
      <div className="relative w-full">
        <Input
          type="text"
          placeholder={searching ? "Searching..." : "Search for an address..."}
          className={`m-2 transition-all duration-200 ${error ? "border-red-500" : ""} ${searching ? "opacity-75 shadow-md" : ""}`}
          value={searchValue}
          onChange={handleInputChange}
          onKeyUp={handleKeyPress}
          onFocus={() => {
            if (searchValue.trim().length >= 3) {
              setShowSuggestions(true);
            }
          }}
          disabled={searching}
          autoComplete="off"
        />
        {searching && (
          <div className="absolute top-1/2 right-3 -translate-y-1/2 transform">
            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-500"></div>
          </div>
        )}
        {error && <div className="mx-2 text-sm text-red-500">{error}</div>}
        {showSuggestions && (suggestions.length > 0 || loading || error) && (
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
              <li className="flex items-center justify-center px-4 py-2 text-sm text-gray-400">
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-400"></div>
                <span className="ml-2">Loading suggestions...</span>
              </li>
            )}
            {!loading &&
              suggestions.length === 0 &&
              searchValue.trim().length >= 3 &&
              !error && (
                <li className="px-4 py-2 text-sm text-gray-400">
                  No addresses found
                </li>
              )}
            {error && (
              <li className="px-4 py-2 text-sm text-red-500">{error}</li>
            )}
          </ul>
        )}
      </div>
      <Button
        variant="secondary"
        size="icon"
        className={`m-2 transition-all duration-200 ${searching ? "animate-pulse bg-blue-500 text-white" : ""}`}
        onClick={handleSearch}
        disabled={searching || !searchValue.trim()}
        title={searching ? "Searching..." : "Search"}
      >
        {searching ? (
          <div className="flex items-center justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
          </div>
        ) : (
          <Search />
        )}
      </Button>
      <Button variant="secondary" size="icon" className="m-2" onClick={onClose}>
        <X />
      </Button>
    </div>
  );
}
