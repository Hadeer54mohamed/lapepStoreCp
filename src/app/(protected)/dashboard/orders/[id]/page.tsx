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

  console.log("Order details page - order data:", order);

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateOrderStatus(
        id,
        status as "pending" | "paid" | "shipped" | "delivered" | "cancelled"
      ),
    onSuccess: () => {
      toast.success("تم تحديث حالة الطلب بنجاح");
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (err) => {
      toast.error("حدث خطأ أثناء تحديث حالة الطلب");
      console.error(err);
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
      <div className="mb-[25px] md:flex items-center justify-between">
        <h5 className="!mb-0">تفاصيل الطلب #{order.id?.slice(0, 8)}</h5>

        <ol className="breadcrumb mt-[12px] md:mt-0 rtl:flex-row-reverse">
          <li className="breadcrumb-item inline-block relative text-sm mx-[11px] ltr:first:ml-0 rtl:first:mr-0 ltr:last:mr-0 rtl:last:ml-0">
            <Link
              href="/dashboard"
              className="inline-block relative ltr:pl-[22px] rtl:pr-[22px] transition-all hover:text-primary-500"
            >
              <i className="material-symbols-outlined absolute ltr:left-0 rtl:right-0 !text-lg -mt-px text-primary-500 top-1/2 -translate-y-1/2">
                home
              </i>
              رئيسية
            </Link>
          </li>
          <li className="breadcrumb-item inline-block relative text-sm mx-[11px] ltr:first:ml-0 rtl:first:mr-0 ltr:last:mr-0 rtl:last:ml-0">
            <Link
              href="/dashboard/orders"
              className="transition-all hover:text-primary-500"
            >
              الطلبات
            </Link>
          </li>
          <li className="breadcrumb-item inline-block relative text-sm mx-[11px] ltr:first:ml-0 rtl:first:mr-0 ltr:last:mr-0 rtl:last:ml-0">
            تفاصيل الطلب
          </li>
        </ol>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2">
          <div className="trezo-card bg-white dark:bg-[#0c1427] p-[20px] md:p-[25px] rounded-md">
            <div className="trezo-card-header mb-[20px] md:mb-[25px]">
              <h6 className="text-lg font-semibold text-gray-900 dark:text-white">
                معلومات الطلب
              </h6>
            </div>

            <div className="space-y-6">
              {/* Order Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    حالة الطلب
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    تحديث حالة الطلب
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      getStatusDisplay(order.status).color
                    }`}
                  >
                    {getStatusDisplay(order.status).text}
                  </span>
                  <select
                    value={order.status}
                    onChange={(e) =>
                      updateStatus({ id: order.id!, status: e.target.value })
                    }
                    className="text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="pending">في الانتظار</option>
                    <option value="paid">مدفوع</option>
                    <option value="shipped">تم الشحن</option>
                    <option value="delivered">تم التوصيل</option>
                    <option value="cancelled">ملغي</option>
                  </select>
                </div>
              </div>

              {/* Payment Status Summary */}
              {order.payments && order.payments.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">
                      حالة الدفع
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      ملخص حالات الدفع
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const completedPayments = order.payments.filter(
                        (p) => p.payment_status === "completed"
                      );
                      const pendingPayments = order.payments.filter(
                        (p) => p.payment_status === "pending"
                      );
                      const failedPayments = order.payments.filter(
                        (p) => p.payment_status === "failed"
                      );

                      if (completedPayments.length > 0) {
                        return (
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            تم الدفع ({completedPayments.length})
                          </span>
                        );
                      } else if (pendingPayments.length > 0) {
                        return (
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            في انتظار الدفع ({pendingPayments.length})
                          </span>
                        );
                      } else if (failedPayments.length > 0) {
                        return (
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            فشل في الدفع ({failedPayments.length})
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              )}

              {/* Order Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    رقم الطلب
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    #{order.id?.slice(0, 8)}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    السعر الإجمالي
                  </h4>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    ${order.total_price}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    تاريخ الطلب
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
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

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    آخر تحديث
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
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
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                  تفاصيل الطلب
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">
                      صاحب الطلب:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {order.profiles?.full_name || order.user_id || "غير محدد"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">
                      رقم الهاتف:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {order.profiles?.phone || "غير محدد"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">
                      رقم الهاتف:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {order.profiles?.phone || "غير محدد"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">
                      المدينة:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {order.profiles?.city || "غير محدد"}
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
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                  منتجات الطلب
                </h4>
                <div className="space-y-3">
                  {order.order_items && order.order_items.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                              المنتج
                            </th>
                            <th className="text-center py-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                              الكمية
                            </th>
                            <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                              السعر
                            </th>
                            <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                              الإجمالي
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.order_items.map((item, index) => (
                            <tr
                              key={index}
                              className="border-b border-gray-100 dark:border-gray-700"
                            >
                              <td className="py-3">
                                <div className="flex items-center">
                                  {item.products?.image_url &&
                                    item.products.image_url[0] && (
                                      <Image
                                        src={item.products.image_url[0]}
                                        alt={item.products?.name_ar || "منتج"}
                                        width={40}
                                        height={40}
                                        className="object-cover rounded-md mr-3"
                                      />
                                    )}
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                                      {item.products?.name_ar ||
                                        "منتج غير محدد"}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {item.products?.name_en}
                                    </p>
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
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                  معلومات الدفع
                </h4>
                <div className="space-y-3">
                  {order.payments && order.payments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                              طريقة الدفع
                            </th>
                            <th className="text-center py-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                              المبلغ
                            </th>
                            <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                              رقم المعاملة
                            </th>
                            <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                              التاريخ
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.payments.map((payment, index) => (
                            <tr
                              key={payment.id || index}
                              className="border-b border-gray-100 dark:border-gray-700"
                            >
                              <td className="py-3">
                                <div className="flex items-center">
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
                                <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                                  {payment.transaction_id || "غير متوفر"}
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
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                  مسار الطلب
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
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
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
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
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
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
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
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
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
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
        </div>

        {/* Customer Information */}
        <div className="lg:col-span-1">
          <div className="trezo-card bg-white dark:bg-[#0c1427] p-[20px] md:p-[25px] rounded-md">
            <div className="trezo-card-header mb-[20px] md:mb-[25px]">
              <h6 className="text-lg font-semibold text-gray-900 dark:text-white">
                معلومات العميل
              </h6>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  اسم العميل
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  {order.profiles?.full_name || order.user_id || "غير محدد"}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  رقم الهاتف
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  {order.profiles?.phone || "غير محدد"}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  المدينة
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  {order.profiles?.city || "غير محدد"}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  العنوان
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  {order.profiles?.address || "غير محدد"}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  الدولة
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  {order.profiles?.country || "غير محدد"}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  الرمز البريدي
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  {order.profiles?.postal_code || "غير محدد"}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="trezo-card bg-white dark:bg-[#0c1427] p-[20px] md:p-[25px] rounded-md mt-6">
            <div className="trezo-card-header mb-[20px] md:mb-[25px]">
              <h6 className="text-lg font-semibold text-gray-900 dark:text-white">
                ملخص الدفع
              </h6>
            </div>

            <div className="space-y-4">
              {order.payments && order.payments.length > 0 ? (
                <>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      إجمالي المدفوع
                    </h4>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      $
                      {order.payments
                        .reduce((sum, payment) => sum + payment.amount, 0)
                        .toFixed(2)}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      عدد المعاملات
                    </h4>
                    <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {order.payments.length}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      آخر معاملة
                    </h4>
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
          <div className="trezo-card bg-white dark:bg-[#0c1427] p-[20px] md:p-[25px] rounded-md mt-6">
            <div className="trezo-card-header mb-[20px] md:mb-[25px]">
              <h6 className="text-lg font-semibold text-gray-900 dark:text-white">
                الإجراءات
              </h6>
            </div>

            <div className="space-y-3">
              <Link
                href="/dashboard/orders"
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <i className="material-symbols-outlined mr-2">arrow_back</i>
                العودة إلى الطلبات
              </Link>

              <button
                onClick={() => {
                  // Print order details
                  window.print();
                }}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <i className="material-symbols-outlined mr-2">print</i>
                طباعة الطلب
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderDetailsPage;
