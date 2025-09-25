"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getOrders,
  updateOrderStatus,
  deleteOrder,
  getOrderStats,
  debugOrderData,
  getCustomerName,
} from "../../../../../services/apiOrders";
import toast from "react-hot-toast";

const OrdersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Tab states for status filtering
  const [activeTab, setActiveTab] = useState<string>("all");

  // Add debounce effect for search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Map tab to status filter
  const getStatusFromTab = (tab: string) => {
    switch (tab) {
      case "unpaid":
        return "pending"; // غير مدفوع
      case "confirmed":
        return "paid"; // تأكيد
      case "shipped":
        return "shipped"; // تم الشحن
      case "delivered":
        return "delivered"; // تم التوصيل
      case "cancelled":
        return "cancelled"; // ملغي
      default:
        return "";
    }
  };

  const { isPending, data } = useQuery({
    queryKey: [
      "orders",
      currentPage,
      activeTab,
      debouncedSearchQuery,
      dateFilter,
    ],
    queryFn: () =>
      getOrders(currentPage, pageSize, {
        status: getStatusFromTab(activeTab),
        search: debouncedSearchQuery,
        date: dateFilter,
      }),
  });

  const { data: stats } = useQuery({
    queryKey: ["orderStats"],
    queryFn: getOrderStats,
  });

  const orders = useMemo(() => data?.orders || [], [data?.orders]);
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const queryClient = useQueryClient();

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateOrderStatus(
        id,
        status as "pending" | "paid" | "shipped" | "delivered" | "cancelled"
      ),
    onSuccess: (updatedOrder, variables) => {
      console.log("Order status updated successfully:", updatedOrder);
      toast.success("تم تحديث حالة الطلب بنجاح");

      // Invalidate all order-related queries
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orderStats"] });
      queryClient.invalidateQueries({ queryKey: ["order", variables.id] });

      // Optionally update the cache directly for immediate feedback
      queryClient.setQueryData(["order", variables.id], updatedOrder);
    },
    onError: (err: Error) => {
      console.error("Order update error:", err);

      // Show specific error message based on the error
      if (err.message.includes("لم يتم العثور على الطلب")) {
        toast.error("الطلب غير موجود أو تم حذفه");
      } else if (err.message.includes("الطلب غير موجود")) {
        toast.error("الطلب المطلوب غير موجود");
      } else if (err.message.includes("لم يتم تحديث أي طلب")) {
        toast.error("فشل في تحديث الطلب، يرجى المحاولة مرة أخرى");
      } else {
        toast.error(`خطأ في تحديث الطلب: ${err.message}`);
      }
    },
  });

  const { mutate: deleteOrderMutation } = useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      toast.success("تم حذف الطلب بنجاح");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orderStats"] });
    },
    onError: (err) => {
      toast.error("حدث خطأ أثناء حذف الطلب");
      console.error(err);
    },
  });

  const endIndex = Math.min(currentPage * pageSize, total);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, dateFilter]);

  // Debug order data
  useEffect(() => {
    debugOrderData();
  }, []);

  // Test search functionality
  useEffect(() => {
    if (debouncedSearchQuery) {
      console.log("Testing search with:", debouncedSearchQuery);
      console.log("Current orders:", orders);
    }
  }, [debouncedSearchQuery, orders]);

  // Helper function to get status display
  const getStatusDisplay = (status: string) => {
    const statusMap = {
      pending: {
        text: "في الانتظار",
        color:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      },
      paid: {
        text: "مدفوع",
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      },
      shipped: {
        text: "تم الشحن",
        color:
          "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      },
      delivered: {
        text: "تم التوصيل",
        color:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      },
      cancelled: {
        text: "ملغي",
        color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      },
    };
    return (
      statusMap[status as keyof typeof statusMap] || {
        text: status,
        color: "bg-gray-100 text-gray-800",
      }
    );
  };

  // Helper function to get payment method display
  const getPaymentMethodDisplay = (method: string) => {
    const methodMap = {
      paypal: "PayPal",
      stripe: "Stripe",
      cod: "الدفع عند الاستلام",
    };
    return methodMap[method as keyof typeof methodMap] || method;
  };

  if (isPending)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );

  return (
    <>
       <div className="mb-[25px] md:flex items-center justify-between">
       <h5 className="!mb-0 text-[#6043FD]">إدارة الطلبات</h5>

         <ol className="breadcrumb mt-[12px] md:mt-0 rtl:flex-row-reverse">
      <li className="breadcrumb-item inline-block relative text-sm mx-[11px]">
        <Link
          href="/dashboard"
          className="inline-block relative ltr:pl-[22px] rtl:pr-[22px] transition-all hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-[#6043FD] hover:to-[#9861FB]"
        >
          <i className="material-symbols-outlined absolute ltr:left-0 rtl:right-0 !text-lg -mt-px text-primary-500 top-1/2 -translate-y-1/2">
            home
          </i>
          رئيسية
        </Link>
      </li>
      <li className="breadcrumb-item inline-block relative text-sm mx-[11px]">
        الطلبات
      </li>
    </ol>
  </div>

      {/* Stats Cards */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
    <div className="trezo-card bg-white dark:bg-[#0c1427] p-4 rounded-md shadow hover:shadow-lg transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي الطلبات</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats?.total || 0}
          </p>
        </div>
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
          <i className="material-symbols-outlined text-blue-600 dark:text-blue-400">
            shopping_cart
          </i>
        </div>
      </div>
    </div>


       <div className="trezo-card bg-white dark:bg-[#0c1427] p-4 rounded-md shadow hover:shadow-lg transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">في الانتظار</p>
          <p className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</p>
        </div>
        <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-full">
          <i className="material-symbols-outlined text-yellow-600 dark:text-yellow-400">
            pending
          </i>
        </div>
      </div>
    </div>

    <div className="trezo-card bg-white dark:bg-[#0c1427] p-4 rounded-md shadow hover:shadow-lg transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">مدفوع</p>
          <p className="text-2xl font-bold text-blue-600">{stats?.paid || 0}</p>
        </div>
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
          <i className="material-symbols-outlined text-blue-600 dark:text-blue-400">
            payments
          </i>
        </div>
      </div>
    </div>

    <div className="trezo-card bg-white dark:bg-[#0c1427] p-4 rounded-md shadow hover:shadow-lg transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">تم الشحن</p>
          <p className="text-2xl font-bold text-purple-600">{stats?.shipped || 0}</p>
        </div>
        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
          <i className="material-symbols-outlined text-purple-600 dark:text-purple-400">
            local_shipping
          </i>
        </div>
      </div>
    </div>

    <div className="trezo-card bg-white dark:bg-[#0c1427] p-4 rounded-md shadow hover:shadow-lg transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">تم التوصيل</p>
          <p className="text-2xl font-bold text-green-600">{stats?.delivered || 0}</p>
        </div>
        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
          <i className="material-symbols-outlined text-green-600 dark:text-green-400">
            check_circle
          </i>
        </div>
      </div>
    </div>

    <div className="trezo-card bg-white dark:bg-[#0c1427] p-4 rounded-md shadow hover:shadow-lg transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">ملغي</p>
          <p className="text-2xl font-bold text-red-600">{stats?.cancelled || 0}</p>
        </div>
        <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
          <i className="material-symbols-outlined text-red-600 dark:text-red-400">
            cancel
          </i>
        </div>
      </div>
    </div>
  </div>

  <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md shadow">
    <div className="trezo-card-header mb-[20px] md:mb-[25px]">
      <h6 className="text-lg font-semibold text-[#6043FD]">قائمة الطلبات</h6>
    </div>

        {/* Status Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 whitespace-nowrap border-2 ${
                activeTab === "all"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/25 transform scale-105"
                  : "bg-white dark:bg-[#0c1427] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-[#172036] hover:border-blue-300 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-md hover:scale-102"
              }`}
            >
              <i className="material-symbols-outlined text-base">
                shopping_cart
              </i>
              جميع الطلبات
            </button>

            <button
              onClick={() => setActiveTab("unpaid")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 whitespace-nowrap border-2 ${
                activeTab === "unpaid"
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-yellow-500 shadow-lg shadow-yellow-500/25 transform scale-105"
                  : "bg-white dark:bg-[#0c1427] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-[#172036] hover:border-yellow-300 hover:text-yellow-600 dark:hover:text-yellow-400 hover:shadow-md hover:scale-102"
              }`}
            >
              <i className="material-symbols-outlined text-base">pending</i>
              في الانتظار
            </button>

            <button
              onClick={() => setActiveTab("confirmed")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 whitespace-nowrap border-2 ${
                activeTab === "confirmed"
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-500 shadow-lg shadow-green-500/25 transform scale-105"
                  : "bg-white dark:bg-[#0c1427] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-[#172036] hover:border-green-300 hover:text-green-600 dark:hover:text-green-400 hover:shadow-md hover:scale-102"
              }`}
            >
              <i className="material-symbols-outlined text-base">
                check_circle
              </i>
              تأكيد
            </button>

            <button
              onClick={() => setActiveTab("shipped")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 whitespace-nowrap border-2 ${
                activeTab === "shipped"
                  ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-purple-500 shadow-lg shadow-purple-500/25 transform scale-105"
                  : "bg-white dark:bg-[#0c1427] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-[#172036] hover:border-purple-300 hover:text-purple-600 dark:hover:text-purple-400 hover:shadow-md hover:scale-102"
              }`}
            >
              <i className="material-symbols-outlined text-base">
                local_shipping
              </i>
              تم الشحن
            </button>

            <button
              onClick={() => setActiveTab("delivered")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 whitespace-nowrap border-2 ${
                activeTab === "delivered"
                  ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-teal-500 shadow-lg shadow-teal-500/25 transform scale-105"
                  : "bg-white dark:bg-[#0c1427] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-[#172036] hover:border-teal-300 hover:text-teal-600 dark:hover:text-teal-400 hover:shadow-md hover:scale-102"
              }`}
            >
              <i className="material-symbols-outlined text-base">
                delivery_dining
              </i>
              تم التوصيل
            </button>

            <button
              onClick={() => setActiveTab("cancelled")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 whitespace-nowrap border-2 ${
                activeTab === "cancelled"
                  ? "bg-gradient-to-r from-red-500 to-pink-500 text-white border-red-500 shadow-lg shadow-red-500/25 transform scale-105"
                  : "bg-white dark:bg-[#0c1427] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-[#172036] hover:border-red-300 hover:text-red-600 dark:hover:text-red-400 hover:shadow-md hover:scale-102"
              }`}
            >
              <i className="material-symbols-outlined text-base">cancel</i>
              ملغي
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 
  text-[#011957] dark:text-white 
  bg-gradient-to-r from-[#6043FD] via-[#9861FB] to-[#BA6FEE] 
  dark:from-[#15203c] dark:via-[#1e2a4a] dark:to-[#011957] 
  p-6 rounded-xl shadow-lg">
  
  {/* Search Bar */}
  <div className="relative col-span-2 lg:col-span-3">
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="ابحث برقم الطلب أو اسم العميل أو رقم الهاتف..."
      className="w-full py-2 pr-10 pl-3 border rounded-lg outline-none 
        bg-white/90 hover:bg-white dark:bg-[#0c1427]/90 dark:hover:bg-[#172036] 
        border-gray-200 dark:border-[#172036] 
        text-[#011957] dark:text-white 
        shadow-sm focus:ring-2 focus:ring-[#8b6fff] transition"
    />
    <i className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
      search
    </i>
    {searchQuery && (
      <button
        onClick={() => setSearchQuery("")}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-500"
      >
        <i className="material-symbols-outlined text-sm">close</i>
      </button>
    )}
  </div>

  {/* Date Filter */}
  <div className="col-span-1 lg:col-span-2">
  <select
  value={dateFilter}
  onChange={(e) => setDateFilter(e.target.value)}
  className="w-full py-2 px-3 rounded-lg outline-none 
    bg-gradient-to-r from-[#6043FD] to-[#9861FB] 
    text-white font-medium shadow-md 
    hover:from-[#5032e6] hover:to-[#874ff0] 
    focus:ring-2 focus:ring-[#8b6fff] transition"
>
  <option value="" className="bg-white text-[#011957]">
    كل التواريخ
  </option>
  <option value="today" className="bg-white text-[#011957]">
    اليوم
  </option>
  <option value="week" className="bg-white text-[#011957]">
    هذا الأسبوع
  </option>
  <option value="month" className="bg-white text-[#011957]">
    هذا الشهر
  </option>
  <option value="year" className="bg-white text-[#011957]">
    هذا العام
  </option>
</select>

  </div>
</div>


        <div className="trezo-card-content">
      <div className="table-responsive overflow-x-auto">
        <table className="w-full">
          <thead className="text-black dark:text-white bg-gradient-to-r from-[#F3EBFF] to-[#E9D8FD] dark:from-[#15203c] dark:to-[#1a2747]">
            <tr>
              {[
                "رقم الطلب",
                "اسم العميل",
                "المنتجات",
                "الحالة",
                "طريقة الدفع",
                "السعر الإجمالي",
                "تاريخ الطلب",
                "الإجراءات",
              ].map((header) => (
                <th
                  key={header}
                  className="font-medium ltr:text-left rtl:text-right px-[20px] py-[11px] whitespace-nowrap ltr:first:rounded-tl-md ltr:last:rounded-tr-md rtl:first:rounded-tr-md rtl:last:rounded-tl-md"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="text-black dark:text-white">
  {orders?.length === 0 ? (
    <tr>
      <td
        colSpan={8}
        className="text-center py-8 text-gray-500 dark:text-gray-400"
      >
        لا توجد طلبات متاحة
      </td>
    </tr>
  ) : (
    orders?.map((order) => (
      <tr
        key={order.id}
        className="hover:bg-purple-100/40 dark:hover:bg-purple-700/10 transition-colors duration-300"
      >
        {/* ID */}
        <td className="px-4 py-3 text-center border-b border-gray-100 dark:border-[#172036]">
          <span className="font-medium text-gray-900 dark:text-white">
            #{order.id?.slice(0, 8)}
          </span>
        </td>

        {/* Customer Name */}
        <td className="px-4 py-3 border-b border-gray-100 dark:border-[#172036]">
          <p className="font-medium text-gray-900 dark:text-white">
            {getCustomerName(order)}
          </p>
        </td>

        {/* Products */}
        <td className="px-4 py-3 border-b border-gray-100 dark:border-[#172036]">
          <div className="max-w-[220px]">
            {(order.order_items && order.order_items.length > 0) ? (
              <div className="space-y-1">
                {order.order_items.slice(0, 2).map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center text-sm gap-2"
                  >
                    {item.products?.image_url?.[0] && (
                      <Image
                        src={item.products.image_url[0]}
                        alt={item.products?.name_ar || "منتج"}
                        width={24}
                        height={24}
                        className="object-cover rounded"
                      />
                    )}
                    <span className="font-medium text-gray-900 dark:text-white truncate">
                      {item.products?.name_ar || "منتج غير محدد"}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      ×{item.quantity}
                    </span>
                  </div>
                ))}
                {order.order_items.length > 2 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    و {order.order_items.length - 2} منتج آخر...
                  </p>
                )}
              </div>
            ) : (
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                لا توجد منتجات
              </span>
            )}
          </div>
        </td>

        {/* Status */}
        <td className="px-4 py-3 text-center border-b border-gray-100 dark:border-[#172036]">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusDisplay(order.status).color}`}
          >
            {getStatusDisplay(order.status).text}
          </span>
        </td>

        {/* المدفوعات */}
        <td className="px-4 py-3 border-b border-gray-100 dark:border-[#172036]">
          {(order.payments && order.payments.length > 0) ? (
            <div className="flex flex-col gap-1">
              {order.payments!.map((payment, index) => (
                <span
                  key={payment.id || index}
                  className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {getPaymentMethodDisplay(payment.payment_method)}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              لا توجد معلومات دفع
            </span>
          )}
        </td>

        {/* Total Price */}
        <td className="px-4 py-3 text-center border-b border-gray-100 dark:border-[#172036]">
          <span className="font-medium text-green-600 dark:text-green-400">
            ${order.total_price}
          </span>
        </td>

        {/* Created At */}
        <td className="px-4 py-3 text-center border-b border-gray-100 dark:border-[#172036]">
          {new Date(order.created_at as string).toLocaleDateString("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </td>

        {/* Actions */}
        <td className="px-4 py-3 text-center border-b border-gray-100 dark:border-[#172036]">
          <div className="flex items-center justify-center gap-2">
            {/* Status Update Dropdown */}
            <select
              value={order.status}
              onChange={(e) =>
                updateStatus({ id: order.id!, status: e.target.value })
              }
              className="text-sm rounded px-2 py-1 bg-gradient-to-r from-[#6043FD] to-[#9861FB] text-white font-medium shadow-sm hover:from-[#5033e0] hover:to-[#8750e0] focus:outline-none focus:ring-2 focus:ring-[#8b6fff] transition"
            >
              <option value="pending" className="text-black">
                في الانتظار
              </option>
              <option value="paid" className="text-black">
                مدفوع
              </option>
              <option value="shipped" className="text-black">
                تم الشحن
              </option>
              <option value="delivered" className="text-black">
                تم التوصيل
              </option>
              <option value="cancelled" className="text-black">
                ملغي
              </option>
            </select>

            {/* View Details */}
            <Link
              href={`/dashboard/orders/${order.id}`}
              className="text-blue-500"
            >
              <i className="material-symbols-outlined !text-md">visibility</i>
            </Link>

            {/* Delete */}
            <div className="relative group">
                            <button
                              onClick={() => {
                                toast(
                                  (t) => (
                                    <span>
                                      هل أنت متأكد أنك تريد حذف هذا الطلب؟
                                      <div
                                        style={{
                                          marginTop: 8,
                                          display: "flex",
                                          gap: 8,
                                        }}
                                      >
                                        <button
                                          onClick={() => {
                                            deleteOrderMutation(order.id!);
                                            toast.dismiss(t.id);
                                          }}
                                          style={{
                                            background: "#ef4444",
                                            color: "white",
                                            border: "none",
                                            padding: "4px 12px",
                                            borderRadius: 4,
                                            marginRight: 8,
                                            cursor: "pointer",
                                          }}
                                        >
                                          نعم
                                        </button>
                                        <button
                                          onClick={() => toast.dismiss(t.id)}
                                          style={{
                                            background: "#e5e7eb",
                                            color: "#111827",
                                            border: "none",
                                            padding: "4px 12px",
                                            borderRadius: 4,
                                            cursor: "pointer",
                                          }}
                                        >
                                          إلغاء
                                        </button>
                                      </div>
                                    </span>
                                  ),
                                  { duration: 6000 }
                                );
                              }}
                              disabled={isPending}
                              className="text-danger-500 leading-none"
                            >
                              <i className="material-symbols-outlined !text-md">
                                delete
                              </i>
                            </button>

                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              مسح
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-white dark:border-[#172036] border-t-gray-800 dark:border-t-gray-800"></div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

            </table>

            <div className="flex justify-between items-center mt-4">
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                عرض {endIndex} طلبات من إجمالي {total} طلب
              </p>

              <div className="flex justify-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  السابق
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 border rounded ${
                      currentPage === i + 1 ? "bg-primary-500 text-white" : ""
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  التالي
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrdersPage;
