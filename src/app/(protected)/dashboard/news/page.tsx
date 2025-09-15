"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteProduct,
  getProducts,
} from "../../../../../services/apiProducts";
import { getCategories } from "../../../../../services/apiCategories";
import toast from "react-hot-toast";

const ProductListTable: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [bestSellerFilter, setBestSellerFilter] = useState<string>("");
  const [limitedTimeOfferFilter, setLimitedTimeOfferFilter] =
    useState<string>("");

  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 10;

  // Add debounce effect for search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { isPending, data } = useQuery({
    queryKey: [
      "products",
      currentPage,
      selectedCategory,
      debouncedSearchQuery,
      dateFilter,
      bestSellerFilter,
      limitedTimeOfferFilter,
    ],
    queryFn: () =>
      getProducts(currentPage, pageSize, {
        categoryId: selectedCategory,
        search: debouncedSearchQuery,
        date: dateFilter,
        isBestSeller:
          bestSellerFilter === "true"
            ? true
            : bestSellerFilter === "false"
            ? false
            : undefined,
        limitedTimeOffer:
          limitedTimeOfferFilter === "true"
            ? true
            : limitedTimeOfferFilter === "false"
            ? false
            : undefined,
      }),
  });

  const products = data?.products || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const [categoriesMap, setCategoriesMap] = useState<{
    [key: string]: string;
  }>({});

  useEffect(() => {
    async function fetchCategories() {
      try {
        const categories = await getCategories();
        // نبني خريطة id => category name
        const map: Record<string, string> = {};
        categories.forEach((cat) => {
          map[cat.id.toString()] = cat.name_ar;
        });
        setCategoriesMap(map);
      } catch (err) {
        console.error(err);
      }
    }

    fetchCategories();
  }, []);

  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      toast.success("تم حذف المنتج بنجاح");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err) => {
      toast.error("حدث خطأ أثناء حذف المنتج");
      console.error(err);
    },
  });

  const endIndex = Math.min(currentPage * pageSize, total);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedCategory,
    searchQuery,
    dateFilter,
    bestSellerFilter,
    limitedTimeOfferFilter,
  ]);

  // Helper function to get price display
  const getPriceDisplay = (product: {
    price: number;
    offer_price?: number;
  }) => {
    if (product.offer_price && product.offer_price < product.price) {
      return `${product.offer_price}$ (${product.price}$)`;
    }
    return `${product.price}$`;
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
        <h5 className="!mb-0"> قائمة المنتجات</h5>

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
          <li className="breadcrumb-item inline-block  relative text-sm mx-[11px] ltr:first:ml-0 rtl:first:mr-0 ltr:last:mr-0 rtl:last:ml-0">
            المنتجات
          </li>
        </ol>
      </div>
      <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
        <div className="trezo-card-header mb-[20px] md:mb-[25px] sm:flex items-center justify-between">
          <div className="trezo-card-subtitle mt-[15px] sm:mt-0">
            <Link
              href="/dashboard/news/create-news/"
              className="inline-block transition-all rounded-md font-medium px-[13px] py-[6px] text-primary-500 border border-primary-500 hover:bg-primary-500 hover:text-white"
            >
              <span className="inline-block relative ltr:pl-[22px] rtl:pr-[22px]">
                <i className="material-symbols-outlined !text-[22px] absolute ltr:-left-[4px] rtl:-right-[4px] top-1/2 -translate-y-1/2">
                  add
                </i>
                أضف منتج جديد
              </span>
            </Link>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن منتج..."
              className="w-full p-2 pr-10 border transition border-[#f2f2f2] hover:bg-[#f2f2f2] rounded-lg outline-none dark:border-[#172036] dark:hover:bg-[#172036] dark:bg-[#0c1427] dark:text-white"
            />
            <i className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
              search
            </i>
          </div>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full p-2 border transition border-[#f2f2f2] hover:bg-[#f2f2f2] rounded-lg outline-none dark:border-[#172036] dark:hover:bg-[#172036] dark:bg-[#0c1427] dark:text-white"
          >
            <option value="">كل التواريخ</option>
            <option value="today">اليوم</option>
            <option value="week">هذا الأسبوع</option>
            <option value="month">هذا الشهر</option>
            <option value="year">هذا العام</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-2 border transition border-[#f2f2f2] hover:bg-[#f2f2f2] rounded-lg outline-none dark:border-[#172036] dark:hover:bg-[#172036] dark:bg-[#0c1427] dark:text-white"
          >
            <option value="">جميع التصنيفات</option>
            {Object.entries(categoriesMap).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>

          {/* Best Seller Filter */}
          <select
            value={bestSellerFilter}
            onChange={(e) => setBestSellerFilter(e.target.value)}
            className="w-full p-2 border transition border-[#f2f2f2] hover:bg-[#f2f2f2] rounded-lg outline-none dark:border-[#172036] dark:hover:bg-[#172036] dark:bg-[#0c1427] dark:text-white"
          >
            <option value="">جميع المنتجات</option>
            <option value="true">أفضل مبيع</option>
            <option value="false">غير أفضل مبيع</option>
          </select>

          {/* Limited Time Offer Filter */}
          <select
            value={limitedTimeOfferFilter}
            onChange={(e) => setLimitedTimeOfferFilter(e.target.value)}
            className="w-full p-2 border transition border-[#f2f2f2] hover:bg-[#f2f2f2] rounded-lg outline-none dark:border-[#172036] dark:hover:bg-[#172036] dark:bg-[#0c1427] dark:text-white"
          >
            <option value="">جميع المنتجات</option>
            <option value="true">عرض محدود</option>
            <option value="false">غير عرض محدود</option>
          </select>
        </div>

        <div className="trezo-card-content">
          <div className="table-responsive overflow-x-auto">
            <table className="w-full">
              <thead className="text-black dark:text-white">
                <tr>
                  {[
                    "المنتج",
                    "تاريخ الانشاء",
                    "التصنيف",
                    "المخزون",
                    "السعر",
                    "أفضل مبيع",
                    "عرض محدود",
                    "الاجرائات",
                  ].map((header) => (
                    <th
                      key={header}
                      className="font-medium ltr:text-left rtl:text-right px-[20px] py-[11px] bg-gray-50 dark:bg-[#15203c] whitespace-nowrap ltr:first:rounded-tl-md ltr:last:rounded-tr-md rtl:first:rounded-tr-md rtl:last:rounded-tl-md"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="text-black dark:text-white">
                {products?.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      لا توجد منتجات متاحة
                    </td>
                  </tr>
                ) : (
                  products?.map((item) => (
                    <tr key={item.id}>
                      <td className="ltr:text-left rtl:text-right whitespace-nowrap px-[20px] py-[15px] border-b border-gray-100 dark:border-[#172036] ltr:first:border-l ltr:last:border-r rtl:first:border-r rtl:last:border-l">
                        <div className="flex items-center text-black dark:text-white transition-all hover:text-primary-500">
                          <div className="relative w-[40px] h-[40px]">
                            <Image
                              className="rounded-md object-cover w-full h-full"
                              alt="product-image"
                              src={item?.image_url?.[0] || "/placeholder.png"}
                              width={40}
                              height={40}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/placeholder.png";
                              }}
                            />
                          </div>
                          <span className="block text-[15px] font-medium ltr:ml-[12px] rtl:mr-[12px]">
                            {item.name_ar && item.name_ar.length > 30
                              ? item.name_ar.slice(0, 30) + "..."
                              : item.name_ar || "N/A"}
                          </span>
                        </div>
                      </td>

                      <td className="ltr:text-left rtl:text-right whitespace-nowrap px-[20px] py-[15px] border-b border-gray-100 dark:border-[#172036] ltr:first:border-l ltr:last:border-r rtl:first:border-r rtl:last:border-l">
                        {new Date(item.created_at as string).toLocaleDateString(
                          "ar-EG",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </td>

                      <td className="ltr:text-left rtl:text-right whitespace-nowrap px-[20px] py-[15px] border-b border-gray-100 dark:border-[#172036] ltr:first:border-l ltr:last:border-r rtl:first:border-r rtl:last:border-l">
                        {categoriesMap[item.category_id || ""] || "غير معروف"}
                      </td>

                      <td className="ltr:text-left rtl:text-right whitespace-nowrap px-[20px] py-[15px] border-b border-gray-100 dark:border-[#172036] ltr:first:border-l ltr:last:border-r rtl:first:border-r rtl:last:border-l">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                          {item.stock || 0} قطعة
                        </span>
                      </td>

                      <td className="ltr:text-left rtl:text-right whitespace-nowrap px-[20px] py-[15px] border-b border-gray-100 dark:border-[#172036] ltr:first:border-l ltr:last:border-r rtl:first:border-r rtl:last:border-l">
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {getPriceDisplay(item)}
                        </span>
                      </td>

                      <td className="ltr:text-left rtl:text-right whitespace-nowrap px-[20px] py-[15px] border-b border-gray-100 dark:border-[#172036] ltr:first:border-l ltr:last:border-r rtl:first:border-r rtl:last:border-l">
                        {item.is_best_seller ? (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs">
                            نعم
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs">
                            لا
                          </span>
                        )}
                      </td>

                      <td className="ltr:text-left rtl:text-right whitespace-nowrap px-[20px] py-[15px] border-b border-gray-100 dark:border-[#172036] ltr:first:border-l ltr:last:border-r rtl:first:border-r rtl:last:border-l">
                        {item.limited_time_offer ? (
                          <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full text-xs">
                            نعم
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs">
                            لا
                          </span>
                        )}
                      </td>

                      <td className="ltr:text-left rtl:text-right whitespace-nowrap px-[20px] py-[15px] border-b border-gray-100 dark:border-[#172036] ltr:first:border-l ltr:last:border-r rtl:first:border-r rtl:last:border-l">
                        <div className="flex items-center gap-[9px]">
                          <div className="relative group">
                            <Link
                              href={`/dashboard/news/${item.id}`}
                              className="text-gray-500 leading-none"
                              type="button"
                            >
                              <i className="material-symbols-outlined !text-md">
                                edit
                              </i>
                            </Link>

                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              تعديل
                              {/* Arrow */}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-white dark:border-[#172036] border-t-gray-800 dark:border-t-gray-800"></div>
                            </div>
                          </div>

                          <div className="relative group">
                            <button
                              onClick={() => {
                                toast(
                                  (t) => (
                                    <span>
                                      هل أنت متأكد أنك تريد حذف هذا المنتج؟
                                      <div
                                        style={{
                                          marginTop: 8,
                                          display: "flex",
                                          gap: 8,
                                        }}
                                      >
                                        <button
                                          onClick={() => {
                                            mutate(item.id as string);
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
                              {/* Arrow */}
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
            <div className=" flex justify-between">
              <p className="mt-2 text-gray-600 dark:text-gray-300 text-sm">
                عرض {endIndex} منتجات من اجمالي {total} منتج
              </p>

              <div className="mt-4 flex justify-center gap-2">
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

export default ProductListTable;
