import { api } from "~/trpc/server";

export default async function CreatePage({ params }: { params: { id: string } }) {
  const { id } = params;

  const data  = await api.response.getResponseByImageId({ imageId: Number(id) });

  if (!data) {
    console.log(data);
    return <div>Response not found</div>;
  }
  console.log(data);
  
  return <div>create {id} {data.id}</div>;
}