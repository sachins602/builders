import { auth } from "~/server/auth";
import CommunitiesClient from "../_components/CommunitiesClient";

export default async function CommunitiesPage() {
  const session = await auth();
  if (!session) {
    return <div>You must be logged in to view this page</div>;
  }

  return <CommunitiesClient session={session} />;
}
