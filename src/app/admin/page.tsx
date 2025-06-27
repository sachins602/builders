import { api } from "~/trpc/server";

export default async function AdminPage() {
  // show data from all the db tables
  const users = await api.admin.getUsers();
  const responses = await api.admin.getResponses();
  const images = await api.admin.getImages();
  const sharedPosts = await api.admin.getSharedPosts();
  const sharedResponses = await api.admin.getSharedResponses();
  const sharedImages = await api.admin.getSharedImages();

  return (
    <div>
      <h1>Admin</h1>
      <div className="flex flex-row gap-4">
        <div className="w-72 overflow-auto">
          <h2>Users</h2>
          <pre>{JSON.stringify(users, null, 2)}</pre>
        </div>
        <div className="w-72 overflow-auto">
          <h2>Responses</h2>
          <pre>{JSON.stringify(responses, null, 2)}</pre>
        </div>
        <div className="w-72 overflow-auto">
          <h2>Images</h2>
          <pre>{JSON.stringify(images, null, 2)}</pre>
        </div>
        <div className="w-72 overflow-auto">
          <h2>Shared Posts</h2>
          <pre>{JSON.stringify(sharedPosts, null, 2)}</pre>
        </div>
        <div className="w-72 overflow-auto">
          <h2>Shared Responses</h2>
          <pre>{JSON.stringify(sharedResponses, null, 2)}</pre>
        </div>
        <div className="w-72 overflow-auto">
          <h2>Shared Images</h2>
          <pre>{JSON.stringify(sharedImages, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
