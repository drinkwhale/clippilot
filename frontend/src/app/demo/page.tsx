"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Home,
  FolderKanban,
  CircleDot,
  Settings,
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  CheckCircle2,
  Circle,
  AlertCircle,
} from "lucide-react";

export default function DemoPage() {
  const issues = [
    { id: "CLI-123", title: "Add user authentication", status: "in-progress", priority: "high", assignee: "John Doe" },
    { id: "CLI-124", title: "Fix navigation bug", status: "todo", priority: "medium", assignee: "Jane Smith" },
    { id: "CLI-125", title: "Update documentation", status: "done", priority: "low", assignee: "Mike Johnson" },
    { id: "CLI-126", title: "Implement dark mode", status: "in-progress", priority: "high", assignee: "Sarah Lee" },
    { id: "CLI-127", title: "Optimize performance", status: "todo", priority: "medium", assignee: "John Doe" },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "in-progress":
        return <Circle className="h-4 w-4 text-blue-500" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-500";
      case "medium":
        return "text-yellow-500";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="flex h-screen bg-background" data-theme="dark">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card">
        <div className="flex h-16 items-center border-b border-border px-6">
          <h1 className="text-lg font-semibold">ClipPilot</h1>
        </div>
        <nav className="space-y-1 p-4">
          <Button variant="ghost" className="w-full justify-start gap-3">
            <Home className="h-4 w-4" />
            Home
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3">
            <FolderKanban className="h-4 w-4" />
            Projects
          </Button>
          <Button variant="default" className="w-full justify-start gap-3">
            <CircleDot className="h-4 w-4" />
            Issues
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Top Bar */}
        <header className="flex h-16 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search issues..."
                className="pl-10 bg-background"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Sort
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Issue
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Issues</h2>
            <p className="text-sm text-muted-foreground">
              Manage and track your project issues
            </p>
          </div>

          {/* Issues Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr className="text-left text-sm text-muted-foreground">
                      <th className="px-6 py-3 font-medium w-32">ID</th>
                      <th className="px-6 py-3 font-medium">Title</th>
                      <th className="px-6 py-3 font-medium w-32">Status</th>
                      <th className="px-6 py-3 font-medium w-32">Priority</th>
                      <th className="px-6 py-3 font-medium w-48">Assignee</th>
                      <th className="px-6 py-3 font-medium w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {issues.map((issue) => (
                      <tr
                        key={issue.id}
                        className="hover:bg-accent/50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {issue.id}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(issue.status)}
                            <span className="text-sm font-medium">
                              {issue.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm capitalize text-muted-foreground">
                            {issue.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-sm capitalize font-medium ${getPriorityColor(
                              issue.priority
                            )}`}
                          >
                            {issue.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted-foreground">
                            {issue.assignee}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Demo Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Issues</CardTitle>
                <CardDescription className="text-2xl font-bold text-foreground">
                  {issues.length}
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">In Progress</CardTitle>
                <CardDescription className="text-2xl font-bold text-blue-500">
                  {issues.filter((i) => i.status === "in-progress").length}
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Completed</CardTitle>
                <CardDescription className="text-2xl font-bold text-green-500">
                  {issues.filter((i) => i.status === "done").length}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
