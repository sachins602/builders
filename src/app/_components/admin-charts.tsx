"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { ChartContainer } from "./ui/chart";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  Tooltip,
  Legend,
  YAxis,
} from "recharts";
import { Loader2, Shield } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { toast } from "sonner";

// AssignAdmin Component
function AssignAdmin() {
  const [email, setEmail] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const assignAdminMutation = api.admin.assignAdmin.useMutation({
    onSuccess: () => {
      toast.success("Admin privileges assigned successfully!");
      setEmail("");
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to assign admin privileges");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsSubmitting(true);
    try {
      await assignAdminMutation.mutateAsync({ email: email.trim() });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-3">
        <Shield className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold">Admin Management</h2>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Shield className="mr-2 h-4 w-4" />
            Assign Admin
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Admin Privileges</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">User Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter user's email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  "Assign Admin"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default function AdminCharts() {
  const usersPerMonth = api.admin.usersPerMonth.useQuery();
  const imagesPerDay = api.admin.imagesPerDay.useQuery();
  const responsesPerDay = api.admin.responsesPerDay.useQuery();
  const topUsers = api.admin.topUsers.useQuery();
  const engagementPerPost = api.admin.engagementPerPost.useQuery();
  const sharesPerDay = api.admin.sharesPerDay.useQuery();

  if (
    usersPerMonth.isLoading ||
    imagesPerDay.isLoading ||
    responsesPerDay.isLoading ||
    topUsers.isLoading ||
    engagementPerPost.isLoading ||
    sharesPerDay.isLoading
  ) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 p-8 md:grid-cols-2 xl:grid-cols-3">
      {/* Admin Management Card */}
      <AssignAdmin />

      {/* Users Registered Per Month */}
      <Card className="p-4">
        <h2 className="mb-2 text-lg font-semibold">
          User Registrations (12mo)
        </h2>
        <ChartContainer
          config={{ users: { label: "Users", color: "#2563eb" } }}
          className="min-h-[200px] w-full"
        >
          <BarChart data={usersPerMonth.data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <Tooltip />
            <Bar dataKey="count" fill="var(--color-users)" radius={4} />
          </BarChart>
        </ChartContainer>
      </Card>

      {/* Images Generated Per Day */}
      <Card className="p-4">
        <h2 className="mb-2 text-lg font-semibold">Images Generated (30d)</h2>
        <ChartContainer
          config={{ images: { label: "Images", color: "#60a5fa" } }}
          className="min-h-[200px] w-full"
        >
          <BarChart data={imagesPerDay.data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <Tooltip />
            <Bar dataKey="count" fill="var(--color-images)" radius={4} />
          </BarChart>
        </ChartContainer>
      </Card>

      {/* Responses Per Day */}
      <Card className="p-4">
        <h2 className="mb-2 text-lg font-semibold">Responses (30d)</h2>
        <ChartContainer
          config={{ responses: { label: "Responses", color: "#f59e42" } }}
          className="min-h-[200px] w-full"
        >
          <BarChart data={responsesPerDay.data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <Tooltip />
            <Bar dataKey="count" fill="var(--color-responses)" radius={4} />
          </BarChart>
        </ChartContainer>
      </Card>

      {/* Top Users */}
      <Card className="p-4">
        <h2 className="mb-2 text-lg font-semibold">Top Users</h2>
        <ChartContainer
          config={{ posts: { label: "Posts", color: "#34d399" } }}
          className="min-h-[200px] w-full"
        >
          <BarChart data={topUsers.data?.slice(0, 10)} layout="vertical">
            <CartesianGrid vertical={false} />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={100} />
            <Tooltip />
            <Bar
              dataKey="responses"
              fill="var(--color-posts)"
              radius={4}
              name="Responses"
            />
          </BarChart>
        </ChartContainer>
      </Card>

      {/* Engagement Per Post */}
      <Card className="p-4">
        <h2 className="mb-2 text-lg font-semibold">Engagement Per Post</h2>
        <ChartContainer
          config={{
            likes: { label: "Likes", color: "#f43f5e" },
            comments: { label: "Comments", color: "#fbbf24" },
          }}
          className="min-h-[200px] w-full"
        >
          <BarChart data={engagementPerPost.data?.slice(0, 10)}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="title"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <Tooltip />
            <Legend />
            <Bar dataKey="likes" fill="var(--color-likes)" radius={4} />
            <Bar dataKey="comments" fill="var(--color-comments)" radius={4} />
          </BarChart>
        </ChartContainer>
      </Card>

      {/* Shares Per Day */}
      <Card className="p-4">
        <h2 className="mb-2 text-lg font-semibold">Shares (30d)</h2>
        <ChartContainer
          config={{ shares: { label: "Shares", color: "#a78bfa" } }}
          className="min-h-[200px] w-full"
        >
          <BarChart data={sharesPerDay.data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <Tooltip />
            <Bar dataKey="count" fill="var(--color-shares)" radius={4} />
          </BarChart>
        </ChartContainer>
      </Card>
    </div>
  );
}
