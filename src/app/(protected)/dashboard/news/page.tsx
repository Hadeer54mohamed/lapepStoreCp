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

  const [categoriesMap, setCategoriesMap] = useState<{ [key: string]: string }>(
    {}
  );

  useEffect(() => {
    async function fetchCategories() {
      try {
        const categories = await getCategories();
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6043FD]"></div>
      </div>
    );

  return (
    <>
      {/* Title + Breadcrumb */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <h5 className="!mb-0 font-semibold text-xl text-[#011957] dark:text-white">
          قائمة المنتجات
        </h5>

        <ol className="breadcrumb flex gap-2 mt-2 md:mt-0 text-sm text-gray-600 dark:text-gray-300">
          <li>
            <Link
              href="/dashboard"
              className="inline-flex items-center text-[#6043FD] hover:text-[#9861FB] transition"
            >
              <i className="material-symbols-outlined !text-lg mr-1">home</i>
              رئيسية
            </Link>
          </li>
          <li>/</li>
          <li className="breadcrumb-item mx-[11px] text-primary-500">المنتجات</li>
        </ol>
      </div>

      <div className="trezo-card bg-white dark:bg-[#0c1427] shadow-md mb-6 p-5 rounded-lg">
        {/* Add Button */}
        <div className="flex justify-between items-center mb-6">
  <Link
    href="/dashboard/news/create-news/"
    className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-gradient-to-r from-[#6043FD] to-[#9861FB] text-white font-medium hover:from-[#5033e0] hover:to-[#8750e0] transition shadow"
  >
    <i className="material-symbols-outlined !text-[22px]">add</i>
    <span>أضف منتج جديد</span>
  </Link>
</div>


        {/* Filters */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-[#011957] dark:text-white bg-gradient-to-r from-[#6043FD] via-[#9861FB] to-[#BA6FEE] dark:from-[#15203c] dark:via-[#1e2a4a] dark:to-[#011957] p-6 rounded-lg shadow-md">
  {/* Search */}
  <div className="relative">
    <label className="block mb-2 text-sm font-medium text-white">
      بحث
    </label>
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="ابحث عن منتج..."
      className="w-full p-2 pr-10 border rounded-lg outline-none text-sm bg-[#F3EBFF] border-[#BA6FEE] text-[#011957] placeholder-gray-500 hover:border-[#9861FB] focus:border-[#6043FD] focus:ring-2 focus:ring-[#BA6FEE] dark:bg-[#1e1a3c] dark:border-[#6043FD] dark:text-white"
    />
    <i className="material-symbols-outlined absolute right-3 top-9 text-[#6043FD] dark:text-[#BA6FEE]">
      search
    </i>
  </div>

  {/* Dropdowns */}
  <div>
    <label className="block mb-2 text-sm font-medium text-white">
      التاريخ
    </label>
    <select
      value={dateFilter}
      onChange={(e) => setDateFilter(e.target.value)}
      className="w-full p-2 border rounded-lg text-sm bg-[#F3EBFF] border-[#BA6FEE] text-[#011957] hover:border-[#9861FB] focus:border-[#6043FD] focus:ring-2 focus:ring-[#BA6FEE] dark:bg-[#1e1a3c] dark:border-[#6043FD] dark:text-white"
    >
      <option value="">كل التواريخ</option>
      <option value="today">اليوم</option>
      <option value="week">هذا الأسبوع</option>
      <option value="month">هذا الشهر</option>
      <option value="year">هذا العام</option>
    </select>
  </div>

  <div>
    <label className="block mb-2 text-sm font-medium text-white">
      التصنيف
    </label>
    <select
      value={selectedCategory}
      onChange={(e) => setSelectedCategory(e.target.value)}
      className="w-full p-2 border rounded-lg text-sm bg-[#F3EBFF] border-[#BA6FEE] text-[#011957] hover:border-[#9861FB] focus:border-[#6043FD] focus:ring-2 focus:ring-[#BA6FEE] dark:bg-[#1e1a3c] dark:border-[#6043FD] dark:text-white"
    >
      <option value="">جميع التصنيفات</option>
      {Object.entries(categoriesMap).map(([id, name]) => (
        <option key={id} value={id}>
          {name}
        </option>
      ))}
    </select>
  </div>

  <div>
    <label className="block mb-2 text-sm font-medium text-white">
      أفضل مبيع
    </label>
    <select
      value={bestSellerFilter}
      onChange={(e) => setBestSellerFilter(e.target.value)}
      className="w-full p-2 border rounded-lg text-sm bg-[#F3EBFF] border-[#BA6FEE] text-[#011957] hover:border-[#9861FB] focus:border-[#6043FD] focus:ring-2 focus:ring-[#BA6FEE] dark:bg-[#1e1a3c] dark:border-[#6043FD] dark:text-white"
    >
      <option value="">جميع المنتجات</option>
      <option value="true">أفضل مبيع</option>
      <option value="false">غير أفضل مبيع</option>
    </select>
  </div>

  <div>
    <label className="block mb-2 text-sm font-medium text-white">
      عرض محدود
    </label>
    <select
      value={limitedTimeOfferFilter}
      onChange={(e) => setLimitedTimeOfferFilter(e.target.value)}
      className="w-full p-2 border rounded-lg text-sm bg-[#F3EBFF] border-[#BA6FEE] text-[#011957] hover:border-[#9861FB] focus:border-[#6043FD] focus:ring-2 focus:ring-[#BA6FEE] dark:bg-[#1e1a3c] dark:border-[#6043FD] dark:text-white"
    >
      <option value="">جميع المنتجات</option>
      <option value="true">عرض محدود</option>
      <option value="false">غير عرض محدود</option>
    </select>
  </div>
</div>


        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-base">
            <thead className="text-[#011957] dark:text-white bg-[#F3EBFF] dark:bg-[#15203c]">
              <tr>
                <th className="font-medium px-4 py-3 text-center">المنتج</th>
                <th className="font-medium px-4 py-3 text-center hidden md:table-cell">تاريخ الانشاء</th>
                <th className="font-medium px-4 py-3 text-center hidden md:table-cell">التصنيف</th>
                <th className="font-medium px-4 py-3 text-center hidden md:table-cell">المخزون</th>
                <th className="font-medium px-4 py-3 text-center">السعر</th>
                <th className="font-medium px-4 py-3 text-center hidden md:table-cell">أفضل مبيع</th>
                <th className="font-medium px-4 py-3 text-center hidden md:table-cell">عرض محدود</th>
                <th className="font-medium px-4 py-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {products?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    لا توجد منتجات متاحة
                  </td>
                </tr>
              ) : (
                products.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 dark:border-[#172036] hover:bg-[#F3EBFF]/40 dark:hover:bg-[#6043FD]/10 transition"
                    >
                    {/* المنتج */}
                    <td className="text-center md:ltr:text-left md:rtl:text-right whitespace-nowrap px-[20px] py-[15px] border-b border-gray-100 dark:border-[#172036] ltr:first:border-l ltr:last:border-r rtl:first:border-r rtl:last:border-l">
                        <div className="flex flex-col md:flex-row items-center justify-center md:justify-start text-black dark:text-white transition-all hover:text-primary-500">
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
                          <span className="block text-[15px] font-medium md:ltr:ml-[12px] md:rtl:mr-[12px] mt-2 md:mt-0 text-center md:text-start">
                            {item.name_ar && item.name_ar.length > 30
                              ? item.name_ar.slice(0, 30) + "..."
                              : item.name_ar || "N/A"}
                          </span>
                        </div>
                      </td>

                    {/* التاريخ */}
                    <td className="px-4 py-3 align-middle text-gray-600 dark:text-gray-300 text-center hidden md:table-cell">
                      {new Date(item.created_at as string).toLocaleDateString(
                        "ar-EG",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </td>

                    {/* التصنيف */}
                    <td className="px-4 py-3 align-middle text-gray-700 dark:text-gray-300 text-center hidden md:table-cell">
                      {categoriesMap[item.category_id || ""] || "غير معروف"}
                    </td>

                    {/* المخزون */}
                    <td className="px-4 py-3 align-middle text-center hidden md:table-cell">
                      <span className="px-2 py-1 text-xs rounded-full bg-[#E0EAFF] text-[#011957] dark:bg-[#1d2b5c] dark:text-white">
                        {item.stock || 0} قطعة
                      </span>
                    </td>

                    {/* السعر */}
                    <td className="px-4 py-3 align-middle text-[#159947] font-medium text-center">
                      {getPriceDisplay(item)}
                    </td>

                    {/* أفضل مبيع */}
                    <td className="px-4 py-3 align-middle text-center hidden md:table-cell">
                      {item.is_best_seller ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                          نعم
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          لا
                        </span>
                      )}
                    </td>

                    {/* عرض محدود */}
                    <td className="px-4 py-3 align-middle text-center hidden md:table-cell">
                      {item.limited_time_offer ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                          نعم
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          لا
                        </span>
                      )}
                    </td>

                    {/* الإجراءات */}
                    <td className="px-4 py-3 align-middle text-center">
                      <div className="flex justify-center gap-3">
                        <Link
                          href={`/dashboard/news/${item.id}`}
                          className="text-gray-500 hover:text-[#6043FD] transition"
                        >
                          <i className="material-symbols-outlined !text-[20px] font-normal">
                            edit
                          </i>
                        </Link>
                        <button
                          onClick={() =>
                            toast(
                              (t) => (
                                <span>
                                  هل أنت متأكد أنك تريد حذف هذا المنتج؟
                                  <div className="mt-2 flex gap-2">
                                    <button
                                      onClick={() => {
                                        mutate(item.id as string);
                                        toast.dismiss(t.id);
                                      }}
                                      className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                                    >
                                      نعم
                                    </button>
                                    <button
                                      onClick={() => toast.dismiss(t.id)}
                                      className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm"
                                    >
                                      إلغاء
                                    </button>
                                  </div>
                                </span>
                              ),
                              { duration: 6000 }
                            )
                          }
                          className="text-red-500 hover:text-red-600"
                          >
                          <i className="material-symbols-outlined !text-[20px] font-normal">
                          delete
                          </i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 text-center sm:text-start">
            عرض {endIndex} منتجات من اجمالي {total} منتج
          </p>
          <div className="flex flex-wrap justify-center sm:justify-end gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded text-sm hover:bg-[#F3EBFF] disabled:opacity-50"
            >
              السابق
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 border rounded text-sm ${
                  currentPage === i + 1
                    ? "bg-[#6043FD] text-white"
                    : "hover:bg-[#F3EBFF]"
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
              className="px-3 py-1 border rounded text-sm hover:bg-[#F3EBFF] disabled:opacity-50"
            >
              التالي
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductListTable;
