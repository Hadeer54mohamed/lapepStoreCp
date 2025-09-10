"use client";

import React, { useEffect, useState } from "react";
import Head from "next/head";
import {
  getOrders,
  getOrderStats,
  Order,
  getCustomerName,
  getCustomerPhone,
} from "../../../../services/apiOrders";
import { getProducts } from "../../../../services/apiProducts";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

// Dynamically import react-apexcharts with Next.js dynamic import
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface DashboardStats {
  totalOrders: number;
  totalSales: number;
  totalProducts: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
}

interface ChartData {
  salesData: number[];
  ordersData: number[];
  labels: string[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalSales: 0,
    totalProducts: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    averageOrderValue: 0,
  });
  const [chartData, setChartData] = useState<ChartData>({
    salesData: [],
    ordersData: [],
    labels: [],
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChartLoaded, setChartLoaded] = useState(false);

  useEffect(() => {
    setChartLoaded(true);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // Fetch all data in parallel
        const [orderStats, orders, products] = await Promise.all([
          getOrderStats(),
          getOrders(1, 1000), // Get more orders for better analytics
          getProducts(1, 1000),
        ]);

        // Calculate total sales from orders
        const totalSales = orders.orders.reduce(
          (sum: number, order: Order) => sum + order.total_price,
          0
        );
        const averageOrderValue =
          orders.orders.length > 0 ? totalSales / orders.orders.length : 0;

        // Generate chart data for last 7 days
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return date.toISOString().split("T")[0];
        }).reverse();

        const salesData = last7Days.map((date) => {
          const dayOrders = orders.orders.filter((order: Order) =>
            order.created_at?.startsWith(date)
          );
          return dayOrders.reduce(
            (sum: number, order: Order) => sum + order.total_price,
            0
          );
        });

        const ordersData = last7Days.map((date) => {
          return orders.orders.filter((order: Order) =>
            order.created_at?.startsWith(date)
          ).length;
        });

        const finalStats = {
          totalOrders: orderStats.total,
          totalSales,
          totalProducts: products.total,
          pendingOrders: orderStats.pending,
          completedOrders: orderStats.delivered,
          cancelledOrders: orderStats.cancelled,
          averageOrderValue,
        };

        console.log("Dashboard Data:", {
          orderStats,
          orders,
          products,
          finalStats,
        });
        setStats(finalStats);

        setChartData({
          salesData,
          ordersData,
          labels: last7Days.map((date) =>
            new Date(date).toLocaleDateString("ar-EG", {
              month: "short",
              day: "numeric",
            })
          ),
        });

        setRecentOrders(orders.orders.slice(0, 5));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const salesChartOptions: ApexOptions = {
    chart: {
      type: "area",
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    colors: ["#10B981"],
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.2,
        stops: [0, 90, 100],
      },
    },
    xaxis: {
      categories: chartData.labels,
      labels: {
        style: {
          colors: "#64748B",
          fontFamily: "inherit",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#64748B",
          fontFamily: "inherit",
        },
        formatter: (value) => `$${value.toFixed(0)}`,
      },
    },
    tooltip: {
      theme: "dark",
      y: {
        formatter: (value) => `$${value.toFixed(2)}`,
      },
    },
    grid: {
      borderColor: "#e2e8f0",
    },
  };

  const ordersChartOptions: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: {
        show: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    colors: ["#3B82F6"],
    xaxis: {
      categories: chartData.labels,
      labels: {
        style: {
          colors: "#64748B",
          fontFamily: "inherit",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#64748B",
          fontFamily: "inherit",
        },
      },
    },
    tooltip: {
      theme: "dark",
    },
    grid: {
      borderColor: "#e2e8f0",
    },
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-warning-50 text-warning-500";
      case "paid":
        return "bg-primary-50 text-primary-500";
      case "shipped":
        return "bg-info-50 text-info-500";
      case "delivered":
        return "bg-success-100 text-success-600";
      case "cancelled":
        return "bg-danger-100 text-danger-500";
      default:
        return "bg-gray-50 text-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "قيد الانتظار";
      case "paid":
        return "مدفوع";
      case "shipped":
        return "تم الشحن";
      case "delivered":
        return "تم التوصيل";
      case "cancelled":
        return "ملغي";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <>
        <Head>
          <title>لوحة التحكم - جاري التحميل</title>
          <meta
            name="description"
            content="لوحة تحكم إدارة المبيعات والطلبات"
          />
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <main
          className="flex items-center justify-center min-h-screen"
          dir="rtl"
          role="main"
          aria-label="لوحة التحكم"
        >
          <section className="text-center" aria-label="حالة التحميل">
            <div
              className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500 mx-auto mb-4"
              role="status"
              aria-label="جاري التحميل"
            >
              <span className="sr-only">جاري التحميل...</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              جاري تحميل البيانات...
            </p>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>لوحة التحكم - إدارة المبيعات والطلبات</title>
        <meta
          name="description"
          content="لوحة تحكم شاملة لإدارة المبيعات والطلبات والمستخدمين والمنتجات مع إحصائيات تفصيلية ورسوم بيانية"
        />
        <meta
          name="keywords"
          content="لوحة تحكم, مبيعات, طلبات, إحصائيات, إدارة"
        />
        <meta name="robots" content="noindex, nofollow" />
        <meta
          property="og:title"
          content="لوحة التحكم - إدارة المبيعات والطلبات"
        />
        <meta
          property="og:description"
          content="لوحة تحكم شاملة لإدارة المبيعات والطلبات والمستخدمين والمنتجات"
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="/dashboard" />
      </Head>

      <main
        className="p-6 space-y-6"
        dir="rtl"
        role="main"
        aria-label="لوحة التحكم"
      >
        {/* Header Section */}
        <header className="flex justify-between items-center">
          <section className="text-right">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              لوحة التحكم
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              نظرة عامة على المبيعات والطلبات ونشاط المستخدمين
            </p>
          </section>
        </header>

        {/* Stats Cards Section */}
        <section
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          aria-label="الإحصائيات الرئيسية"
        >
          <article className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-xl p-6 shadow-lg border border-blue-200 dark:border-blue-700 hover:shadow-xl transition-all duration-300">
            <p className="text-sm font-medium text-blue-600 dark:text-blue-300 mb-1">
              إجمالي الطلبات
            </p>
            <div className="flex items-center gap-8 ">
              <div
                className="p-3 bg-blue-500 rounded-xl shadow-md "
                aria-hidden="true"
              >
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <div className="text-right">
                <p
                  className="text-3xl font-bold text-blue-800 dark:text-blue-100"
                  aria-label={`إجمالي الطلبات: ${stats.totalOrders}`}
                >
                  {stats.totalOrders || 0}
                </p>
              </div>
            </div>
          </article>

          <article className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-xl p-6 shadow-lg border border-green-200 dark:border-green-700 hover:shadow-xl transition-all duration-300">
            <p className="text-sm font-medium text-green-600 dark:text-green-300 mb-1">
              إجمالي المبيعات
            </p>
            <div className="flex items-center gap-8 ">
              <div
                className="p-3 bg-green-500 rounded-xl shadow-md"
                aria-hidden="true"
              >
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <div className="text-right">
                <p
                  className="text-3xl font-bold text-green-800 dark:text-green-100"
                  aria-label={`إجمالي المبيعات: ${stats.totalSales.toFixed(
                    2
                  )} دولار`}
                >
                  ${stats.totalSales.toFixed(2)}
                </p>
              </div>
            </div>
          </article>

          <article className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 rounded-xl p-6 shadow-lg border border-orange-200 dark:border-orange-700 hover:shadow-xl transition-all duration-300">
            <p className="text-sm font-medium text-orange-600 dark:text-orange-300 mb-1">
              إجمالي المنتجات
            </p>
            <div className="flex items-center gap-8 ">
              <div
                className="p-3 bg-orange-500 rounded-xl shadow-md"
                aria-hidden="true"
              >
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <div className="text-right">
                <p
                  className="text-3xl font-bold text-orange-800 dark:text-orange-100"
                  aria-label={`إجمالي المنتجات: ${stats.totalProducts}`}
                >
                  {stats.totalProducts}
                </p>
              </div>
            </div>
          </article>
        </section>

        {/* Charts Section */}
        <section
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          aria-label="الرسوم البيانية"
        >
          <article className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-right">
              المبيعات اليومية
            </h2>
            {isChartLoaded && (
              <div role="img" aria-label="رسم بياني للمبيعات اليومية">
                <Chart
                  options={salesChartOptions}
                  series={[{ name: "المبيعات", data: chartData.salesData }]}
                  type="area"
                  height={250}
                />
              </div>
            )}
          </article>

          <article className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-right">
              الطلبات اليومية
            </h2>
            {isChartLoaded && (
              <div role="img" aria-label="رسم بياني للطلبات اليومية">
                <Chart
                  options={ordersChartOptions}
                  series={[{ name: "الطلبات", data: chartData.ordersData }]}
                  type="bar"
                  height={250}
                />
              </div>
            )}
          </article>
        </section>

        {/* Order Status and Recent Orders Section */}
        <section
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          aria-label="تفاصيل الطلبات"
        >
          <article className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-right">
              حالة الطلبات
            </h2>
            <div
              className="space-y-4"
              role="list"
              aria-label="إحصائيات حالة الطلبات"
            >
              <div
                className="flex justify-between items-center"
                role="listitem"
              >
                <span className="text-gray-600 dark:text-gray-400">
                  قيد الانتظار
                </span>
                <span
                  className="font-semibold text-warning-500"
                  aria-label={`الطلبات قيد الانتظار: ${stats.pendingOrders}`}
                >
                  {stats.pendingOrders}
                </span>
              </div>
              <div
                className="flex justify-between items-center"
                role="listitem"
              >
                <span className="text-gray-600 dark:text-gray-400">مكتمل</span>
                <span
                  className="font-semibold text-success-600"
                  aria-label={`الطلبات المكتملة: ${stats.completedOrders}`}
                >
                  {stats.completedOrders}
                </span>
              </div>
              <div
                className="flex justify-between items-center"
                role="listitem"
              >
                <span className="text-gray-600 dark:text-gray-400">ملغي</span>
                <span
                  className="font-semibold text-danger-500"
                  aria-label={`الطلبات الملغية: ${stats.cancelledOrders}`}
                >
                  {stats.cancelledOrders}
                </span>
              </div>
              <div
                className="flex justify-between items-center"
                role="listitem"
              >
                <span className="text-gray-600 dark:text-gray-400">
                  متوسط قيمة الطلب
                </span>
                <span
                  className="font-semibold text-primary-600"
                  aria-label={`متوسط قيمة الطلب: ${stats.averageOrderValue.toFixed(
                    2
                  )} دولار`}
                >
                  ${stats.averageOrderValue.toFixed(2)}
                </span>
              </div>
            </div>
          </article>

          <article className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-right">
              آخر الطلبات
            </h2>
            <div
              className="space-y-4"
              role="list"
              aria-label="قائمة آخر الطلبات"
            >
              {recentOrders.slice(0, 2).map((order) => (
                <div
                  key={order.id}
                  className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200"
                  role="listitem"
                >
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {getCustomerName(order)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleDateString("ar-EG")
                        : "غير محدد"}
                    </p>
                    {/* Show customer type and phone if available */}
                    <div className="flex gap-2 mt-1">
                      {getCustomerPhone(order) && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          📞 {getCustomerPhone(order)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      ${order.total_price.toFixed(2)}
                    </p>
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(
                        order.status
                      )}`}
                      aria-label={`حالة الطلب: ${getStatusText(order.status)}`}
                    >
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>
    </>
  );
}
