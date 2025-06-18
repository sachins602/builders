import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

export default async function History() {
  const session = await auth();
  const responseHistory = await api.response.getResponseHistory();
  if (session?.user) {
    void api.response.getResponseHistory.prefetch();
  }
  if (!session?.user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-800 text-white">
        <div className="rounded-lg bg-gray-700 p-8 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold">
            Authentication Required
          </h2>
          <p>Please sign in to use the AI image generation feature.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="container mx-auto py-8 text-white">
      <h1>History</h1>
      {responseHistory.map((response) => (
        <div className="mb-4 rounded-lg bg-gray-700 p-4" key={response.id}>
          <p>{response.prompt}</p>
          <img src={response.url} alt="" />
        </div>
      ))}
    </div>
  );
}
