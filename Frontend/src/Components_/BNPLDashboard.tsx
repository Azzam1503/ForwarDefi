import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  BarChart,
  Bar,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Users, Download, BarChart3 } from "lucide-react";

type ViewType = "portfolio" | "users";
type RangeType = "3m" | "6m" | "full";
type StatusType = "ontime" | "default" | "recovering" | "liquidated";

interface MonthData {
  month: string;
  score: number;
  spend: number;
  repayment: number;
  status: StatusType;
}

interface User {
  id: string;
  name: string;
  type: string;
  months: MonthData[];
}

interface PortfolioData {
  month: string;
  avgScore: number;
  avgSpend: number;
  avgRepayment: number;
  defaultRate: number;
}

interface StatusData {
  month: string;
  ontime: number;
  default: number;
  recovering: number;
  liquidated: number;
}

// Mock data generator
const generateMockData = (): User[] => {
  const months = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  const userTypes = ["Premium", "Standard", "Basic"];
  const names = [
    "Alice Johnson",
    "Bob Smith",
    "Carol Davis",
    "David Wilson",
    "Emma Brown",
  ];

  return names.map((name, i) => ({
    id: `user_${i}`,
    name,
    type: userTypes[i % userTypes.length],
    months: months.map((month, idx) => {
      const baseScore = 650 + Math.random() * 150;
      const trend = i % 2 === 0 ? -5 : 5; // Some users improve, others decline
      const score = Math.max(300, Math.min(850, baseScore + trend * idx));

      const baseSpend = 800 + Math.random() * 400;
      const spend = baseSpend + (Math.random() - 0.5) * 200;

      const repaymentRatio =
        score > 700 ? 0.8 + Math.random() * 0.2 : 0.5 + Math.random() * 0.4;
      const repayment = spend * repaymentRatio;

      let status: StatusType = "ontime";
      if (repaymentRatio < 0.6) status = "default";
      else if (repaymentRatio < 0.75) status = "recovering";
      else if (score < 500) status = "liquidated";

      return {
        month,
        score: Math.round(score),
        spend: Math.round(spend),
        repayment: Math.round(repayment),
        status,
      };
    }),
  }));
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4 shadow-2xl">
        <p className="text-purple-200 font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.dataKey}:{" "}
            {typeof entry.value === "number"
              ? entry.value.toLocaleString()
              : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function BNPLPortfolioChart({ range }: { range: RangeType }) {
  const [portfolioData, setPortfolioData] = useState<PortfolioData[]>([]);
  const [statusData, setStatusData] = useState<StatusData[]>([]);

  useEffect(() => {
    const users = generateMockData();
    const months = users[0].months.map((m) => m.month);

    const aggregated: PortfolioData[] = months.map((month, idx) => {
      let totalScore = 0,
        totalSpend = 0,
        totalRepay = 0,
        defaults = 0;
      users.forEach((u) => {
        const data = u.months[idx];
        totalScore += data.score;
        totalSpend += data.spend;
        totalRepay += data.repayment;
        if (data.status === "default" || data.status === "liquidated") {
          defaults++;
        }
      });
      return {
        month,
        avgScore: Math.round(totalScore / users.length),
        avgSpend: Math.round(totalSpend / users.length),
        avgRepayment: Math.round(totalRepay / users.length),
        defaultRate: Math.round((defaults / users.length) * 100),
      };
    });

    const statusAgg: StatusData[] = months.map((month, idx) => {
      const counts = { ontime: 0, default: 0, recovering: 0, liquidated: 0 };
      users.forEach((u) => {
        const st = u.months[idx].status;
        counts[st]++;
      });
      return { month, ...counts };
    });

    setPortfolioData(aggregated);
    setStatusData(statusAgg);
  }, []);

  const sliceData = <T,>(data: T[]): T[] => {
    if (range === "3m") return data.slice(-3);
    if (range === "6m") return data.slice(-6);
    return data;
  };

  const chartData = sliceData(portfolioData);
  const chartStatus = sliceData(statusData);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-purple-400">
          Loading portfolio data...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <TrendingUp className="text-purple-400" />
          Portfolio-Level BNPL Trends
        </h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Credit Score & Default Rate */}
      <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          Credit Score vs Default Rate
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E5E7EB"
              opacity={0.8}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6B7280", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6B7280", fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: "#374151", paddingTop: "20px" }} />
            <Line
              type="monotone"
              dataKey="avgScore"
              stroke="#8B5CF6"
              strokeWidth={3}
              dot={{ fill: "#8B5CF6", strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, fill: "#A78BFA" }}
              name="Avg Credit Score"
            />
            <Line
              type="monotone"
              dataKey="defaultRate"
              stroke="#EF4444"
              strokeWidth={3}
              dot={{ fill: "#EF4444", strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, fill: "#F87171" }}
              name="Default Rate (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Spending vs Repayment */}
      <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
          Average Spending vs Repayment
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E5E7EB"
              opacity={0.8}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6B7280", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6B7280", fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: "#374151", paddingTop: "20px" }} />
            <Line
              type="monotone"
              dataKey="avgSpend"
              stroke="#F59E0B"
              strokeWidth={3}
              dot={{ fill: "#F59E0B", strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, fill: "#FBBF24" }}
              name="Avg Spending"
            />
            <Line
              type="monotone"
              dataKey="avgRepayment"
              stroke="#10B981"
              strokeWidth={3}
              dot={{ fill: "#10B981", strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, fill: "#34D399" }}
              name="Avg Repayment"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Status Distribution */}
      <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
          <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
          Payment Status Distribution
        </h3>
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={chartStatus}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E5E7EB"
              opacity={0.8}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6B7280", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6B7280", fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: "#374151", paddingTop: "20px" }} />
            <Bar
              dataKey="ontime"
              stackId="a"
              fill="#10B981"
              name="On-time"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="recovering"
              stackId="a"
              fill="#3B82F6"
              name="Recovering"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="default"
              stackId="a"
              fill="#F59E0B"
              name="Default"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="liquidated"
              stackId="a"
              fill="#EF4444"
              name="Liquidated"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function BNPLUserCharts({ range }: { range: RangeType }) {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const mockUsers = generateMockData();
    setUsers(mockUsers);
  }, []);

  const sliceData = <T,>(data: T[]): T[] => {
    if (range === "3m") return data.slice(-3);
    if (range === "6m") return data.slice(-6);
    return data;
  };

  const getStatusColor = (status: StatusType): string => {
    switch (status) {
      case "liquidated":
        return "text-red-400 font-bold";
      case "default":
        return "text-orange-400 font-medium";
      case "recovering":
        return "text-blue-400 font-medium";
      default:
        return "text-green-400";
    }
  };

  const getRecoveryIndicator = (monthData: MonthData): string => {
    if (monthData.status === "recovering") {
      return monthData.repayment >= monthData.spend ? " ⬆️ strong" : " ↗️ weak";
    }
    return "";
  };

  if (users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-purple-400">
          Loading user data...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Users className="text-purple-400" />
          BNPL User Credit & Spending Patterns
        </h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="grid gap-6">
        {users.map((user) => {
          const userData = sliceData(user.months);
          return (
            <div
              key={user.id}
              className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 shadow-2xl hover:border-purple-400/40 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">
                  {user.name}
                </h3>
                <span className="px-3 py-1 bg-purple-600/30 text-purple-300 rounded-full text-sm font-medium border border-purple-500/30">
                  {user.type}
                </span>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Credit Score Chart */}
                <div className="space-y-3">
                  <h4 className="text-purple-300 font-medium">
                    Credit Score Trend
                  </h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={userData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#374151"
                        opacity={0.3}
                      />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9CA3AF", fontSize: 11 }}
                      />
                      <YAxis
                        domain={[300, 850]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9CA3AF", fontSize: 11 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#A855F7"
                        strokeWidth={3}
                        dot={{ fill: "#A855F7", strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7, fill: "#C084FC" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Spending vs Repayment */}
                <div className="space-y-3">
                  <h4 className="text-purple-300 font-medium">
                    Spending vs Repayment
                  </h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={userData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#374151"
                        opacity={0.3}
                      />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9CA3AF", fontSize: 11 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9CA3AF", fontSize: 11 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="spend"
                        fill="#F59E0B"
                        name="Spending"
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar
                        dataKey="repayment"
                        fill="#10B981"
                        name="Repayment"
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="mt-4 p-4 bg-gray-800/30 rounded-xl border border-gray-700/30">
                <h4 className="text-purple-300 font-medium mb-3">
                  Payment Status Timeline
                </h4>
                <div className="flex flex-wrap gap-3">
                  {userData.map((m) => (
                    <div key={m.month} className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm font-medium">
                        {m.month}:
                      </span>
                      <span className={`text-sm ${getStatusColor(m.status)}`}>
                        {m.status}
                        {getRecoveryIndicator(m)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function BNPLDashboard() {
  const [view, setView] = useState<ViewType>("portfolio");
  const [range, setRange] = useState<RangeType>("6m");

  return (
    <div className="analytics-route">
      <div className="analytics-container">
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
          <div className="container mx-auto px-8 py-10 space-y-10 max-w-7xl">
            {/* Header */}
            <div className="text-center space-y-6 mb-12">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="p-4 bg-purple-600/20 rounded-3xl border border-purple-500/30">
                  <BarChart3 className="text-purple-400" size={40} />
                </div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                  BNPL Analytics Dashboard
                </h1>
              </div>
              <p className="text-gray-400 text-xl">
                Real-time insights into Buy Now Pay Later performance
              </p>
            </div>

            {/* View Toggle */}
            <div className="flex justify-center gap-6 mb-10">
              <button
                onClick={() => setView("portfolio")}
                className={`flex items-center gap-4 px-8 py-4 rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105 ${
                  view === "portfolio"
                    ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-purple-500/25"
                    : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-600/30"
                }`}
              >
                <TrendingUp size={24} />
                Portfolio View
              </button>
              <button
                onClick={() => setView("users")}
                className={`flex items-center gap-4 px-8 py-4 rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105 ${
                  view === "users"
                    ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-emerald-500/25"
                    : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-600/30"
                }`}
              >
                <Users size={24} />
                User View
              </button>
            </div>

            {/* Range Selection */}
            <div className="flex justify-center gap-3 mb-12">
              {(["3m", "6m", "full"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    range === r
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25"
                      : "bg-gray-800/30 text-gray-400 hover:bg-gray-700/30 border border-gray-600/30"
                  }`}
                >
                  {r === "full" ? "ALL TIME" : r.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Chart Content */}
            <div className="mt-8">
              {view === "portfolio" && <BNPLPortfolioChart range={range} />}
              {view === "users" && <BNPLUserCharts range={range} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
