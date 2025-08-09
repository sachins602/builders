import { api } from "~/trpc/server";
import { getImageUrl } from "~/lib/image-utils";
import { Avatar, AvatarImage, AvatarFallback } from "../_components/ui/avatar";
import Link from "next/link";

export default async function ProfilePage() {
  const profileData = await api.user.getUserProfile();
  const userOrgs = await api.community.getUserOrganizations();

  if (!profileData) {
    return <div className="py-12 text-center">Profile not found.</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10 py-8">
      {/* User Info */}
      <div className="flex flex-col items-center gap-4 border-b pb-8">
        <Avatar className="h-24 w-24">
          {profileData.image ? (
            <AvatarImage
              src={getImageUrl(profileData.image ?? "")}
              alt={profileData.name ?? "User"}
            />
          ) : (
            <AvatarFallback className="text-3xl">
              {profileData.name ? profileData.name[0]?.toUpperCase() : "U"}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            {profileData.name ?? "Anonymous"}
          </h1>
          {profileData.email && (
            <p className="text-gray-500">{profileData.email}</p>
          )}
          {profileData.bio && (
            <p className="mt-2 text-gray-700">{profileData.bio}</p>
          )}
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-center">
          <div>
            <span className="block text-lg font-semibold">
              {profileData.stats.images}
            </span>
            <span className="text-xs text-gray-500">Images</span>
          </div>
          <div>
            <span className="block text-lg font-semibold">
              {profileData.stats.responses}
            </span>
            <span className="text-xs text-gray-500">Responses</span>
          </div>
          <div>
            <span className="block text-lg font-semibold">
              {profileData.stats.shares}
            </span>
            <span className="text-xs text-gray-500">Shared Chains</span>
          </div>
          <div>
            <span className="block text-lg font-semibold">
              {profileData.stats.likes}
            </span>
            <span className="text-xs text-gray-500">Likes</span>
          </div>
          <div>
            <span className="block text-lg font-semibold">
              {profileData.stats.comments}
            </span>
            <span className="text-xs text-gray-500">Comments</span>
          </div>
        </div>
      </div>

      {/* Community Memberships */}
      <section>
        <h2 className="mb-4 text-2xl font-semibold">Community Memberships</h2>
        {userOrgs && userOrgs.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {userOrgs.map(({ organization, membership }) => (
              <div
                key={organization.id}
                className="rounded-lg border bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="font-semibold">{organization.name}</div>
                  <div className="text-xs text-gray-500">
                    {membership.role} since{" "}
                    {new Date(membership.joinedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="mt-2 line-clamp-2 text-sm text-gray-700">
                  {organization.description}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {organization._count.members} members
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500">
            Not a member of any organizations yet.
          </div>
        )}
        <div className="mt-4 text-right">
          <Link
            href="/organizations"
            className="text-sm text-blue-600 hover:underline"
          >
            Explore organizations
          </Link>
        </div>
      </section>
    </div>
  );
}
