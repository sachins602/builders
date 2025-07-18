import { auth } from "~/server/auth";
import AdminCharts from "../_components/admin-charts";

export default async function AdminPage() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return <div>Sorry, Looks like you are not allowed be here!</div>;
  }
  return <AdminCharts />;
}
