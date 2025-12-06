"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEvents, useDashboardMetrics } from "@/hooks/use-analytics";
import { Loader } from "lucide-react";

const statusBadges = {
  detected: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  reported: "bg-blue-100 text-blue-800 border border-blue-200",
  escalated: "bg-red-100 text-red-800 border border-red-200",
};

export function ObservabilityView() {
  const { events, eventList, isLoading } = useEvents();
  const { metrics } = useDashboardMetrics();

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center h-full">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayEvents = eventList || [];
  const chartData = Array.isArray(events) ? events : [];

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Analytics & Events
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time monitoring and event tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="border-border bg-transparent"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="border-border bg-transparent"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="border-border bg-transparent"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Event Stream Chart */}
      <Card className="bg-card border border-border p-6 scroll-animate">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground">
            Event Stream (24h)
          </h3>
          <p className="text-sm text-muted-foreground">
            Real-time engagement events
          </p>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a66d4b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a66d4b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8e0d5" />
            <XAxis dataKey="time" stroke="#8b7e6f" />
            <YAxis stroke="#8b7e6f" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fefdfb",
                border: "1px solid #e8e0d5",
                borderRadius: "8px",
              }}
              cursor={{ stroke: "rgba(166,109,75,0.2)" }}
            />
            <Area
              type="monotone"
              dataKey="events"
              stroke="#a66d4b"
              fillOpacity={1}
              fill="url(#colorEvents)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Recent Events */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Recent Events
          </h3>
          <p className="text-sm text-muted-foreground">
            Live event feed from all campaigns
          </p>
        </div>

        <div className="space-y-2">
          {displayEvents.slice(0, 5).map((event, index) => (
            <Card
              key={event.id}
              className="bg-card border border-border p-4 scroll-animate"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className="bg-primary/10 text-primary border border-primary/20">
                      {event.type}
                    </Badge>
                    <span className="text-sm font-medium text-foreground">
                      {event.campaign}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{event.user}</p>
                </div>
                <div className="text-right">
                  <Badge
                    className={
                      statusBadges[event.status as keyof typeof statusBadges]
                    }
                  >
                    {event.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    {event.time}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: "Total Events Today",
            value: metrics?.totalEventsToday || 156,
            change: metrics?.totalEventsTodayChange || "+12%",
          },
          {
            label: "High Priority Alerts",
            value: metrics?.highPriorityAlerts || 8,
            change: "Require immediate action",
          },
          {
            label: "Avg. Detection Time",
            value: `${metrics?.avgDetectionTime || 3.2}s`,
            change: `Improved from ${
              metrics?.avgDetectionTimePrevious || 4.5
            }s`,
          },
        ].map((item, index) => (
          <Card
            key={index}
            className="bg-card border border-border p-6 scroll-animate"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <p className="text-sm font-medium text-muted-foreground">
              {item.label}
            </p>
            <p className="text-2xl font-bold text-foreground mt-2">
              {item.value}
            </p>
            <p className="text-xs text-muted-foreground mt-2">{item.change}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
