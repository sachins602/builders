"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/app/_components/ui/button";
import { Card } from "~/app/_components/ui/card";
import { Input } from "~/app/_components/ui/input";
import { Label } from "~/app/_components/ui/label";
import { Textarea } from "~/app/_components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/app/_components/ui/dialog";
import { Avatar } from "~/app/_components/ui/avatar";
import { Badge } from "~/app/_components/ui/badge";
import {
  MapPin,
  Globe,
  Mail,
  Phone,
  Users,
  ArrowLeft,
  Plus,
} from "lucide-react";
import { Loading } from "./ui/loading";

interface Organization {
  id: string;
  name: string;
  description: string;
  email?: string | null;
  website?: string | null;
  phone?: string | null;
  avatar?: string | null;
  address?: string | null;
  createdAt: Date;
  createdBy: {
    id: string;
    name: string | null;
    image: string | null;
  };
  _count: {
    members: number;
  };
  members?: Array<{
    id: string;
    role: "MEMBER" | "ADMIN" | "OWNER";
    joinedAt: Date;
  }>;
  currentUserMembership?: {
    id: string;
    role: "MEMBER" | "ADMIN" | "OWNER";
    joinedAt: Date;
  } | null;
}

interface Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

interface CommunitiesClientProps {
  session: Session | null;
}

// Address Search Component for Organization Form
interface AddressSearchProps {
  onAddressSelect: (address: string, lat: number, lng: number) => void;
}

function AddressSearch({ onAddressSelect }: AddressSearchProps) {
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  interface NominatimSuggestion {
    display_name: string;
    lat: string;
    lon: string;
  }

  // Fetch suggestions from Nominatim with proper cleanup
  const fetchSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
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
          signal: abortControllerRef.current.signal,
        },
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = (await res.json()) as NominatimSuggestion[];
      setSuggestions(data.map((item) => item.display_name));
    } catch (e) {
      // Only set empty suggestions if it's not an abort error
      if (e instanceof Error && e.name !== "AbortError") {
        console.error("Error fetching suggestions:", e);
        setSuggestions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Debounced input handler with proper cleanup
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    setShowSuggestions(true);

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new timeout
    debounceRef.current = setTimeout(() => {
      void fetchSuggestions(value);
    }, 300);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setSearchValue(suggestion);
    setSelectedAddress(suggestion);
    setShowSuggestions(false);

    // Cancel any ongoing fetch request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Get coordinates for the selected address
    try {
      const controller = new AbortController();
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          suggestion,
        )}&limit=1`,
        {
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        },
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = (await res.json()) as NominatimSuggestion[];
      if (data.length > 0) {
        const lat = parseFloat(data[0]!.lat);
        const lng = parseFloat(data[0]!.lon);
        onAddressSelect(suggestion, lat, lng);
      }
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError") {
        console.error("Error getting coordinates:", e);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="relative">
      <Label htmlFor="address">Address</Label>
      <div className="relative">
        <Input
          id="address"
          name="address"
          type="text"
          placeholder="Search for an address..."
          value={searchValue}
          onChange={handleInputChange}
          onFocus={() => searchValue && setShowSuggestions(true)}
          autoComplete="off"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-white shadow-lg">
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
              <li className="px-4 py-2 text-sm text-gray-400">
                <Loading />
              </li>
            )}
          </ul>
        )}
      </div>
      {selectedAddress && (
        <div className="mt-2 text-sm text-gray-600">
          Selected: {selectedAddress}
        </div>
      )}
    </div>
  );
}

export default function CommunitiesClient({ session }: CommunitiesClientProps) {
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");

  const {
    data: organizationsData,
    isLoading: isLoadingOrgs,
    refetch: refetchOrganizations,
  } = api.community.getOrganizations.useQuery({});

  const {
    data: selectedOrgDetail,
    isLoading: isLoadingDetail,
    refetch: refetchOrgDetail,
  } = api.community.getOrganization.useQuery(
    { id: selectedOrg?.id ?? "" },
    { enabled: !!selectedOrg?.id },
  );

  const createOrgMutation = api.community.createOrganization.useMutation({
    onSuccess: () => {
      setIsCreateDialogOpen(false);
      void refetchOrganizations();
    },
  });

  const joinOrgMutation = api.community.joinOrganization.useMutation({
    onSuccess: () => {
      void refetchOrganizations();
      void refetchOrgDetail();
    },
  });

  const leaveOrgMutation = api.community.leaveOrganization.useMutation({
    onSuccess: () => {
      void refetchOrganizations();
      void refetchOrgDetail();
    },
  });

  const organizations = organizationsData?.items ?? [];

  const handleCreateOrganization = (formData: FormData) => {
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      email: (formData.get("email") as string) || undefined,
      website: (formData.get("website") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,
      avatar: (formData.get("avatar") as string) || undefined,
      address: selectedAddress || undefined,
    };

    createOrgMutation.mutate(data);
  };

  const handleAddressSelect = (address: string, _lat: number, _lng: number) => {
    setSelectedAddress(address);
  };

  const handleJoinOrganization = () => {
    if (selectedOrgDetail) {
      joinOrgMutation.mutate({ organizationId: selectedOrgDetail.id });
    }
  };

  const handleLeaveOrganization = () => {
    if (selectedOrgDetail) {
      leaveOrgMutation.mutate({ organizationId: selectedOrgDetail.id });
    }
  };

  const renderOrganizationCard = (org: Organization) => (
    <Card
      key={org.id}
      className={`cursor-pointer p-4 transition-all hover:shadow-md ${
        selectedOrg?.id === org.id ? "ring-2 ring-blue-500" : ""
      }`}
      onClick={() => setSelectedOrg(org)}
    >
      <div className="flex items-start space-x-3">
        <Avatar className="h-12 w-12">
          {org.avatar ? (
            <img
              src={org.avatar}
              alt={org.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-600">
              {org.name.charAt(0).toUpperCase()}
            </div>
          )}
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold">{org.name}</h3>
          <p className="line-clamp-2 text-sm text-gray-600">
            {org.description}
          </p>
          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
            {org.email && (
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span className="truncate">{org.email}</span>
              </div>
            )}
            {org.website && (
              <div className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                <span>Website</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{org._count.members} members</span>
            </div>
          </div>
          {org.members && org.members.length > 0 && org.members[0] && (
            <Badge variant="secondary" className="mt-2 text-xs">
              {org.members[0].role}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-center">
          {session && (
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Organization
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Organization</DialogTitle>
                </DialogHeader>
                <form action={handleCreateOrganization} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Organization Name *</Label>
                    <Input id="name" name="name" required maxLength={100} />
                  </div>
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      name="description"
                      required
                      maxLength={250}
                      placeholder="Brief description (max 250 characters)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      name="website"
                      type="url"
                      placeholder="https://"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" type="tel" />
                  </div>
                  <div>
                    <Label htmlFor="imageUrl">Organization Image URL</Label>
                    <Input
                      id="avatar"
                      name="avatar"
                      type="url"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <AddressSearch onAddressSelect={handleAddressSelect} />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createOrgMutation.isPending}
                  >
                    {createOrgMutation.isPending
                      ? "Creating..."
                      : "Create Organization"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="w-full">
          {/* Left Column - Organization List */}
          <div className="mx-auto max-w-2xl space-y-6">
            <Card className="p-6">
              <h2 className="mb-4 text-xl font-semibold">Organizations</h2>

              {isLoadingOrgs ? (
                <div className="py-8 text-center">Loading organizations...</div>
              ) : organizations.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  No organizations found. Be the first to create one!
                </div>
              ) : (
                <div className="space-y-3">
                  {organizations.map(renderOrganizationCard)}
                </div>
              )}
            </Card>
          </div>

          {/* Dialog - Organization Detail */}
          {selectedOrg && (
            <Dialog
              open={!!selectedOrg}
              onOpenChange={() => setSelectedOrg(null)}
            >
              <DialogContent className="max-w-xl" showCloseButton={false}>
                <DialogHeader>
                  <DialogTitle>Organization Details</DialogTitle>
                </DialogHeader>
                {isLoadingDetail ? (
                  <div className="flex h-96 items-center justify-center">
                    <Loading />
                    Loading organization details...
                  </div>
                ) : selectedOrgDetail ? (
                  <div className="space-y-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-16 w-16">
                          {selectedOrgDetail.avatar ? (
                            <img
                              src={selectedOrgDetail.avatar}
                              alt={selectedOrgDetail.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-200 text-xl text-gray-600">
                              {selectedOrgDetail.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </Avatar>
                        <div>
                          <h2 className="text-2xl font-bold">
                            {selectedOrgDetail.name}
                          </h2>
                          <p className="mt-2 text-gray-600">
                            {selectedOrgDetail.description}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOrg(null)}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Organization Image */}
                    {selectedOrgDetail.avatar && (
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">
                          Organization Image
                        </h3>
                        <img
                          src={selectedOrgDetail.avatar}
                          alt={selectedOrgDetail.name}
                          className="w-full max-w-md rounded-lg object-cover"
                        />
                      </div>
                    )}

                    <div className="space-y-3">
                      {selectedOrgDetail.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <a
                            href={`mailto:${selectedOrgDetail.email}`}
                            className="text-blue-600 hover:underline"
                          >
                            {selectedOrgDetail.email}
                          </a>
                        </div>
                      )}
                      {selectedOrgDetail.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-gray-500" />
                          <a
                            href={selectedOrgDetail.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {selectedOrgDetail.website}
                          </a>
                        </div>
                      )}
                      {selectedOrgDetail.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <a
                            href={`tel:${selectedOrgDetail.phone}`}
                            className="text-blue-600 hover:underline"
                          >
                            {selectedOrgDetail.phone}
                          </a>
                        </div>
                      )}
                      {selectedOrgDetail.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span>{selectedOrgDetail.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>{selectedOrgDetail._count.members} members</span>
                      </div>
                    </div>

                    {session && (
                      <div className="border-t pt-4">
                        {selectedOrgDetail.currentUserMembership ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline">
                                Member since{" "}
                                {new Date(
                                  selectedOrgDetail.currentUserMembership.joinedAt,
                                ).toLocaleDateString()}
                              </Badge>
                              <Badge>
                                {selectedOrgDetail.currentUserMembership.role}
                              </Badge>
                            </div>
                            {selectedOrgDetail.currentUserMembership.role !==
                              "OWNER" && (
                              <Button
                                variant="outline"
                                onClick={handleLeaveOrganization}
                                disabled={leaveOrgMutation.isPending}
                                className="w-full"
                              >
                                {leaveOrgMutation.isPending
                                  ? "Leaving..."
                                  : "Leave Community"}
                              </Button>
                            )}
                          </div>
                        ) : (
                          <Button
                            onClick={handleJoinOrganization}
                            disabled={joinOrgMutation.isPending}
                            className="w-full"
                          >
                            {joinOrgMutation.isPending
                              ? "Joining..."
                              : "Join Community"}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-96 items-center justify-center text-red-500">
                    Organization not found
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
}
