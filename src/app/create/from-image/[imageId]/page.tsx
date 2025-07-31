import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{
    imageId: string;
  }>;
}

export default async function CreateFromImagePage({ params }: PageProps) {
  const resolvedParams = await params;
  const imageId = resolvedParams.imageId;

  // Redirect to the simplified remix page
  redirect(`/remix/${imageId}`);
}
