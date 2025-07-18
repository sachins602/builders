"use client";

import { api } from "~/trpc/react";
import { ChartContainer } from "../_components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, Tooltip, Legend } from "recharts";
import { Loader2 } from "lucide-react";
import { Card } from "../_components/ui/card";

export default function AdminDashboard() {
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
