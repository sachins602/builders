import { auth } from "~/server/auth";
import { UserRole } from "@prisma/client";
import AdminCharts from "../_components/admin-charts";

export default async function AdminPage() {
  const session = await auth();
  if (!session || session.user.role !== UserRole.ADMIN) {
    return <div>Sorry, Looks like you are not allowed be here!</div>;
  }
  return <AdminCharts />;
}
