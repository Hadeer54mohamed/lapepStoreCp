"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOrderById,
  updateOrderStatus,
} from "../../../../../../services/apiOrders";
import toast from "react-hot-toast";

const OrderDetailsPage: React.FC = () => {
  const params = useParams();
  const orderId = params.id as string;
  const queryClient = useQueryClient();

  const {
    data: order,
    isPending,
    error,
  } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrderById(orderId),
    enabled: !!orderId,
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateOrderStatus(
        id,
        status as "pending" | "paid" | "shipped" | "delivered" | "cancelled"
      ),
    onSuccess: (updatedOrder) => {
      console.log("Order status updated successfully:", updatedOrder);
      toast.success("تم تحديث حالة الطلب بنجاح");

      // Invalidate and update cache for immediate feedback
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orderStats"] });

      // Update the cache directly for immediate UI feedback
      queryClient.setQueryData(["order", orderId], updatedOrder);
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

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
    </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          لم يتم العثور على الطلب
        </h3>
        <Link
          href="/dashboard/orders"
          className="text-primary-500 hover:text-primary-600"
        >
          العودة إلى قائمة الطلبات
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
     {/* Breadcrumb */}
     <div className="mb-[25px] md:flex items-center justify-between">
        <h5 className="!mb-0 text-[#6043FD]" > تفاصيل الطلب {order.id}</h5>
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
            <Link
              href="/dashboard/orders"
              className="inline-block relative ltr:pl-[22px] rtl:pr-[22px] transition-all hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-[#6043FD] hover:to-[#9861FB]"
            >
              <i className="material-symbols-outlined absolute ltr:left-0 rtl:right-0 !text-lg -mt-px text-primary-500 top-1/2 -translate-y-1/2">
                shopping_cart
              </i>
              الطلبات
            </Link>
          </li>
          <li className="breadcrumb-item inline-block relative text-sm mx-[11px]">
            تفاصيل الطلب
          </li>
        </ol>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ===== Order Details ===== */}
        <div className="lg:col-span-2">
          <div className="trezo-card bg-white dark:bg-[#0c1427] p-[20px] md:p-[25px] rounded-md shadow">
            <div className="trezo-card-header mb-[20px] md:mb-[25px]">
              <h6 className="text-lg font-semibold text-[#6043FD]">
                معلومات الطلب
              </h6>
            </div>

            {/* حالة الطلب */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl mb-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <i className="material-symbols-outlined text-blue-600 dark:text-blue-400">
                    shopping_cart
                  </i>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    حالة الطلب
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    تحديث حالة الطلب
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold shadow-lg ${getStatusDisplay(order.status).color}`}
                >
                  {getStatusDisplay(order.status).text}
                </span>
                <select
                  value={order.status}
                  onChange={(e) =>
                    updateStatus({ id: order.id!, status: e.target.value })
                  }
                  className="text-sm border-2 border-gray-200 dark:border-[#172036] rounded-lg px-4 py-2 bg-white dark:bg-[#0c1427] focus:border-[#6043FD] focus:ring-2 focus:ring-[#6043FD]/20 transition-all"
                >
                  <option value="pending">في الانتظار</option>
                  <option value="paid">مدفوع</option>
                  <option value="shipped">تم الشحن</option>
                  <option value="delivered">تم التوصيل</option>
                  <option value="cancelled">ملغي</option>
                </select>
              </div>
            </div>

              {/* Order Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <i className="material-symbols-outlined text-blue-600 dark:text-blue-400">
                        receipt_long
                      </i>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      رقم الطلب
                    </h4>
                  </div>
                  <p className="text-lg font-bold text-[#6043FD]">
                    #{order.id?.slice(0, 8)}
                  </p>
                </div>

                <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <i className="material-symbols-outlined text-green-600 dark:text-green-400">
                        attach_money
                      </i>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      السعر الإجمالي
                    </h4>
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ${order.total_price}
                  </p>
                </div>

                <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <i className="material-symbols-outlined text-purple-600 dark:text-purple-400">
                        schedule
                      </i>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      تاريخ الطلب
                    </h4>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    {new Date(order.created_at as string).toLocaleDateString(
                      "ar-EG",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>

                <div className="p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl border border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                      <i className="material-symbols-outlined text-orange-600 dark:text-orange-400">
                        update
                      </i>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      آخر تحديث
                    </h4>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    {new Date(order.updated_at as string).toLocaleDateString(
                      "ar-EG",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>
              </div>
              {/* Order Details Section */}
              <div className="p-6 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <i className="material-symbols-outlined text-gray-600 dark:text-gray-400">
                      info
                    </i>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    تفاصيل الطلب
                  </h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">
                      صاحب الطلب:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {/* Show guest customer name */}
                      {order.customer_first_name && order.customer_last_name
                        ? `${order.customer_first_name} ${order.customer_last_name}`
                        : order.customer_first_name ||
                          order.customer_last_name ||
                          "غير محدد"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">
                      رقم الهاتف:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {order.customer_phone ||
                        order.profiles?.phone ||
                        "غير محدد"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">
                      البريد الإلكتروني:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {order.customer_email || "غير محدد"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">
                      المدينة:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {order.customer_city || "غير محدد"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">
                      المنطقة/المحافظة:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {order.customer_state || "غير محدد"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      المبلغ الإجمالي:
                    </span>
                    <span className="font-semibold text-lg text-green-600 dark:text-green-400">
                      ${order.total_price}
                    </span>
                  </div>
                </div>
              </div>
              {/* Order Items */}
              <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                    <i className="material-symbols-outlined text-indigo-600 dark:text-indigo-400">
                      shopping_bag
                    </i>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    منتجات الطلب
                  </h4>
                </div>
                <div className="space-y-3">
                  {order.order_items && order.order_items.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-indigo-200 dark:border-indigo-700">
                            <th className="text-right py-4 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-indigo-100 dark:bg-indigo-900/50">
                              المنتج
                            </th>
                            <th className="text-center py-4 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-indigo-100 dark:bg-indigo-900/50">
                              الكمية
                            </th>
                            <th className="text-right py-4 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-indigo-100 dark:bg-indigo-900/50">
                              السعر
                            </th>
                            <th className="text-right py-4 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-indigo-100 dark:bg-indigo-900/50">
                              الإجمالي
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.order_items.map((item, index) => (
                            <tr
                              key={index}
                              className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                              <td className="py-3">
                                <div className="flex items-center">
                                  {item.products?.image_url &&
                                  item.products.image_url[0] ? (
                                    <Image
                                      src={item.products.image_url[0]}
                                      alt={item.products?.name_ar || "منتج"}
                                      width={40}
                                      height={40}
                                      className="object-cover rounded-md mr-3"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-md mr-3 flex items-center justify-center">
                                      <i className="material-symbols-outlined text-gray-400 text-sm">
                                        image
                                      </i>
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                                      {item.products?.name_ar ||
                                        item.products?.name_en ||
                                        `منتج (ID: ${item.product_id})`}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {item.products?.name_en &&
                                      item.products?.name_ar !==
                                        item.products?.name_en
                                        ? item.products.name_en
                                        : item.product_id}
                                    </p>
                                    {!item.products && (
                                      <p className="text-xs text-red-500 dark:text-red-400">
                                        تفاصيل المنتج غير متوفرة
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 text-center">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {item.quantity}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  ${item.price}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-gray-200 dark:border-gray-700">
                            <td
                              colSpan={3}
                              className="py-3 text-right font-medium text-gray-900 dark:text-white"
                            >
                              الإجمالي الكلي:
                            </td>
                            <td className="py-3 text-right">
                              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                ${order.total_price}
                              </span>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                      لا توجد منتجات في هذا الطلب
                    </p>
                  )}
                </div>
              </div>
              {/* Payment Information */}
              <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                    <i className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">
                      payments
                    </i>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    معلومات الدفع
                  </h4>
                </div>
                <div className="space-y-3">
                  {order.payments && order.payments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-emerald-200 dark:border-emerald-700">
                            <th className="py-4 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-emerald-100 dark:bg-emerald-900/50">
                              طريقة الدفع
                            </th>
                            <th className="text-center py-4 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-emerald-100 dark:bg-emerald-900/50">
                              المبلغ
                            </th>
                            <th className="text-right py-4 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-emerald-100 dark:bg-emerald-900/50">
                              التاريخ
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.payments.map((payment, index) => (
                            <tr
                              key={payment.id || index}
                              className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                              <td className="py-3">
                                <div className="flex items-center justify-center gap-1">
                                  <i className="material-symbols-outlined mr-2 text-gray-500">
                                    {payment.payment_method === "paypal"
                                      ? "payments"
                                      : payment.payment_method === "stripe"
                                      ? "credit_card"
                                      : payment.payment_method === "cod"
                                      ? "local_shipping"
                                      : "payments"}
                                  </i>
                                  <span className="font-medium text-gray-900 dark:text-white text-sm">
                                    {getPaymentMethodDisplay(
                                      payment.payment_method
                                    )}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 text-center">
                                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                  ${payment.amount}
                                </span>
                              </td>

                              <td className="py-3 text-right">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {payment.created_at
                                    ? new Date(
                                        payment.created_at
                                      ).toLocaleDateString("ar-EG", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "غير متوفر"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-gray-200 dark:border-gray-700">
                            <td
                              colSpan={1}
                              className="py-3 text-right font-medium text-gray-900 dark:text-white"
                            >
                              إجمالي المدفوع:
                            </td>
                            <td className="py-3 text-center">
                              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                $
                                {order.payments
                                  .reduce(
                                    (sum, payment) => sum + payment.amount,
                                    0
                                  )
                                  .toFixed(2)}
                              </span>
                            </td>
                            <td colSpan={3}></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="mb-4">
                        <i className="material-symbols-outlined text-4xl text-gray-400">
                          payments
                        </i>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 mb-2">
                        لا توجد معلومات دفع متاحة
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        لم يتم تسجيل أي مدفوعات لهذا الطلب بعد
                      </p>
                    </div>
                  )}
                </div>
              </div>
              {/* Order Timeline */}
              <div className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl border border-cyan-200 dark:border-cyan-800">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
                    <i className="material-symbols-outlined text-cyan-600 dark:text-cyan-400">
                      timeline
                    </i>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    مسار الطلب
                  </h4>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-4 shadow-lg"></div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        تم إنشاء الطلب
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {new Date(
                          order.created_at as string
                        ).toLocaleDateString("ar-EG")}
                      </p>
                    </div>
                  </div>

                  {order.status !== "pending" && (
                    <div className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="w-4 h-4 bg-blue-500 rounded-full mr-4 shadow-lg"></div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          تم الدفع
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {new Date(
                            order.updated_at as string
                          ).toLocaleDateString("ar-EG")}
                        </p>
                      </div>
                    </div>
                  )}

                  {["shipped", "delivered"].includes(order.status) && (
                    <div className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="w-4 h-4 bg-purple-500 rounded-full mr-4 shadow-lg"></div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          تم الشحن
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {new Date(
                            order.updated_at as string
                          ).toLocaleDateString("ar-EG")}
                        </p>
                      </div>
                    </div>
                  )}

                  {order.status === "delivered" && (
                    <div className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="w-4 h-4 bg-green-500 rounded-full mr-4 shadow-lg"></div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          تم التوصيل
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {new Date(
                            order.updated_at as string
                          ).toLocaleDateString("ar-EG")}
                        </p>
                      </div>
                    </div>
                  )}

                  {order.status === "cancelled" && (
                    <div className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="w-4 h-4 bg-red-500 rounded-full mr-4 shadow-lg"></div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          تم الإلغاء
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {new Date(
                            order.updated_at as string
                          ).toLocaleDateString("ar-EG")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        

         {/* ===== Customer Information ===== */}
         <div className="lg:col-span-1">
          <div className="trezo-card bg-white dark:bg-[#0c1427] p-[20px] md:p-[25px] rounded-md shadow">
            <div className="trezo-card-header mb-[20px] md:mb-[25px]">
              <h6 className="text-lg font-semibold text-[#6043FD]">
                معلومات العميل
              </h6>
            </div>

            {/* اسم العميل */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <i className="material-symbols-outlined text-blue-600 dark:text-blue-400">
                    person
                  </i>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white">اسم العميل</h4>
              </div>
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                {order.customer_first_name && order.customer_last_name
                  ? `${order.customer_first_name} ${order.customer_last_name}`
                  : order.customer_first_name ||
                    order.customer_last_name ||
                    "غير محدد"}
              </p>
            </div>

              {/* Phone Number */}
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <i className="material-symbols-outlined text-green-600 dark:text-green-400">
                      phone
                    </i>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    رقم الهاتف
                  </h4>
                </div>
                <p className="text-gray-700 dark:text-gray-300 font-medium mb-3">
                  {order.customer_phone || "غير محدد"}
                </p>
                {/* Make phone clickable if available */}
                {order.customer_phone && (
                  <div className="flex gap-2">
                    <a
                      href={`tel:${order.customer_phone}`}
                      className="inline-flex items-center px-3 py-2 text-xs font-semibold bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-md hover:shadow-lg"
                    >
                      <i className="material-symbols-outlined mr-1 text-sm">
                        call
                      </i>
                      اتصال
                    </a>
                    <a
                      href={`https://wa.me/${order.customer_phone?.replace(
                        /\D/g,
                        ""
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 text-xs font-semibold bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-md hover:shadow-lg"
                    >
                      <i className="material-symbols-outlined mr-1 text-sm">
                        chat
                      </i>
                      واتساب
                    </a>
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <i className="material-symbols-outlined text-purple-600 dark:text-purple-400">
                      email
                    </i>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    البريد الإلكتروني
                  </h4>
                </div>
                <p className="text-gray-700 dark:text-gray-300 font-medium mb-3">
                  {order.customer_email || "غير محدد"}
                </p>
                {order.customer_email && (
                  <a
                    href={`mailto:${order.customer_email}`}
                    className="inline-flex items-center px-3 py-2 text-xs font-semibold bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors shadow-md hover:shadow-lg"
                  >
                    <i className="material-symbols-outlined mr-1 text-sm">
                      send
                    </i>
                    إرسال إيميل
                  </a>
                )}
              </div>

              {/* Shipping Address - Enhanced for guest checkout */}
              <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl border border-orange-200 dark:border-orange-800 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                    <i className="material-symbols-outlined text-orange-600 dark:text-orange-400">
                      location_on
                    </i>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    عنوان الشحن
                  </h4>
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {/* Street Address */}
                  {order.customer_street_address && (
                    <p className="mb-1">📍 {order.customer_street_address}</p>
                  )}
                  {/* City */}
                  {order.customer_city && (
                    <p className="mb-1">🏙️ {order.customer_city}</p>
                  )}
                  {/* State */}
                  {order.customer_state && (
                    <p className="mb-1">🗺️ {order.customer_state}</p>
                  )}
                  {/* Postal Code */}
                  {order.customer_postcode && (
                    <p className="mb-1">📮 {order.customer_postcode}</p>
                  )}

                  {/* Copy address button */}
                  {order.customer_street_address && (
                    <button
                      onClick={() => {
                        const fullAddress = [
                          order.customer_street_address,
                          order.customer_city,
                          order.customer_state,
                          order.customer_postcode,
                        ]
                          .filter(Boolean)
                          .join(", ");

                        navigator.clipboard.writeText(fullAddress);
                        toast.success("تم نسخ العنوان بنجاح");
                      }}
                      className="mt-3 inline-flex items-center px-3 py-2 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-md hover:shadow-lg"
                    >
                      <i className="material-symbols-outlined mr-1 text-sm">
                        content_copy
                      </i>
                      نسخ العنوان
                    </button>
                  )}

                  {/* Show "غير محدد" only if no address information is available */}
                  {!order.customer_street_address && !order.customer_city && (
                    <p>غير محدد</p>
                  )}
                </div>
              </div>

              {/* Order Notes - New field for guest checkout */}
              {order.order_notes && (
                <div className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                      <i className="material-symbols-outlined text-yellow-600 dark:text-yellow-400">
                        note
                      </i>
                    </div>
                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-200">
                      ملاحظات الطلب
                    </h4>
                  </div>
                  <p className="text-yellow-800 dark:text-yellow-300 text-sm font-medium">
                    {order.order_notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="trezo-card bg-white dark:bg-[#0c1427] p-[20px] md:p-[25px] rounded-md shadow mt-6">
            <div className="trezo-card-header mb-[20px] md:mb-[25px]">
              <h6 className="text-lg font-semibold text-[#6043FD]">
                ملخص الدفع
              </h6>
            </div>

            <div className="space-y-4">
              {order.payments && order.payments.length > 0 ? (
                <>
                  <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                        <i className="material-symbols-outlined text-green-600 dark:text-green-400">
                          attach_money
                        </i>
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        إجمالي المدفوع
                      </h4>
                    </div>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      $
                      {order.payments
                        .reduce((sum, payment) => sum + payment.amount, 0)
                        .toFixed(2)}
                    </p>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <i className="material-symbols-outlined text-blue-600 dark:text-blue-400">
                          history
                        </i>
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        آخر معاملة
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {order.payments
                        .sort(
                          (a, b) =>
                            new Date(b.created_at || "").getTime() -
                            new Date(a.created_at || "").getTime()
                        )
                        .slice(0, 1)
                        .map((payment, index) => (
                          <div key={payment.id || index} className="space-y-1">
                            <div className="flex items-center">
                              <i className="material-symbols-outlined mr-1 text-gray-500 text-sm">
                                {payment.payment_method === "paypal"
                                  ? "payments"
                                  : payment.payment_method === "stripe"
                                  ? "credit_card"
                                  : payment.payment_method === "cod"
                                  ? "local_shipping"
                                  : "payments"}
                              </i>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {getPaymentMethodDisplay(
                                  payment.payment_method
                                )}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              ${payment.amount}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {payment.created_at
                                ? new Date(
                                    payment.created_at
                                  ).toLocaleDateString("ar-EG", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })
                                : "غير متوفر"}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="mb-3">
                    <i className="material-symbols-outlined text-3xl text-gray-400">
                      payments
                    </i>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    لا توجد معلومات دفع متاحة
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="trezo-card bg-white dark:bg-[#0c1427] p-[20px] md:p-[25px] rounded-md shadow mt-6">
            <div className="trezo-card-header mb-[20px] md:mb-[25px]">
              <h6 className="text-lg font-semibold text-[#6043FD]">
                الإجراءات
              </h6>
            </div>

            <div className="space-y-3">
              <Link
                href="/dashboard/orders"
                className="w-full flex items-center justify-center px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-800 dark:hover:to-gray-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg"
              >
                <i className="material-symbols-outlined mr-2">arrow_back</i>
                العودة إلى الطلبات
              </Link>

              <button
                onClick={() => {
                  // Print order details
                  window.print();
                }}
                className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-[#6043FD] to-[#9861FB] text-white rounded-xl hover:from-[#5a3ce8] hover:to-[#8a56e8] transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <i className="material-symbols-outlined mr-2">print</i>
                طباعة الطلب
              </button>
            </div>
          </div>
      </div>
    </>
  );
};

export default OrderDetailsPage;
