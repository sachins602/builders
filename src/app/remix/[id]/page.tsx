import { notFound } from "next/navigation";
import { CommunityPost } from "~/app/_components/CommunityPost/CommunityPost";
import { HydrateClient } from "~/trpc/server";
import { api } from "~/trpc/server";

interface RemixPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RemixPage({ params }: RemixPageProps) {
  const resolvedParams = await params;
  const post = await api.user.getUserResponseById({
    responseId: parseInt(resolvedParams.id),
  });

  if (!post) return notFound();

  return (
    <HydrateClient>
      <div className="mx-auto max-w-2xl">
        <CommunityPost post={post} />
      </div>
    </HydrateClient>
  );
}
