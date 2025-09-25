"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteTestemonial,
  getTestemonial,
} from "../../../../../services/apiTestemonial";
import toast from "react-hot-toast";

const TestimonialListTable: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");

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
    queryKey: ["testimonial", currentPage, debouncedSearchQuery, dateFilter],
    queryFn: () =>
      getTestemonial(currentPage, pageSize, {
        search: debouncedSearchQuery,
        date: dateFilter,
      }),
  });

  const testimonials = data?.testimonials || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: deleteTestemonial,
    onSuccess: () => {
      toast.success("تم حذف التوصية بنجاح");
      queryClient.invalidateQueries({ queryKey: ["testimonial"] });
    },
    onError: (err) => {
      toast.error("حدث خطأ أثناء حذف التوصية");
      console.error(err);
    },
  });

  const endIndex = Math.min(currentPage * pageSize, total);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateFilter]);

  if (isPending)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );

  return (
    <>
    <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
      <h5 className="!mb-0 text-xl font-semibold text-[#011957] dark:text-white">
        قائمة التوصيات
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
        <li className="text-gray-500 dark:text-gray-400">التوصيات</li>
      </ol>
    </div>
  
    <div className="trezo-card bg-[#F7F7F7] dark:bg-[#0c1427] mb-6 p-6 rounded-lg shadow">
      {/* Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h5 className="!mb-0 text-lg font-semibold text-[#011957] dark:text-white">
          إدارة التوصيات
        </h5>
        <Link
          href="/dashboard/testimonial/create-testimonial/"
          className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-gradient-to-r from-[#6043FD] to-[#9861FB] text-white font-medium hover:from-[#5033e0] hover:to-[#8750e0] transition shadow"
        >
          <i className="material-symbols-outlined !text-[22px]">add</i>
          <span>أضف توصية جديدة</span>
        </Link>
      </div>
  
      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 text-[#011957] dark:text-white bg-gradient-to-r from-[#6043FD] via-[#9861FB] to-[#BA6FEE] dark:from-[#15203c] dark:via-[#1e2a4a] dark:to-[#011957] p-6 rounded-lg shadow-md">
        {/* Search Bar */}
        <div className="relative">
          <label className="block mb-2 text-sm font-medium text-white">
            بحث
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن توصية..."
            className="w-full p-2 pr-10 border rounded-lg outline-none text-sm bg-[#F3EBFF] border-[#BA6FEE] text-[#011957] placeholder-gray-500 hover:border-[#9861FB] focus:border-[#6043FD] focus:ring-2 focus:ring-[#BA6FEE] dark:bg-[#1e1a3c] dark:border-[#6043FD] dark:text-white"
          />
          <i className="material-symbols-outlined absolute right-3 top-9 text-[#6043FD] dark:text-[#BA6FEE]">
            search
          </i>
        </div>
  
        {/* Date Filter */}
        <div>
          <label className="block mb-2 text-sm font-medium text-white">
            التاريخ
          </label>
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
  
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-base">
          <thead className="text-[#011957] dark:text-white bg-[#F3EBFF] dark:bg-[#15203c]">
            <tr>
              <th className="font-medium px-4 py-3 text-center">الصورة</th>
              <th className="font-medium px-4 py-3 text-center">الاسم</th>
              <th className="font-medium px-4 py-3 text-center hidden md:table-cell">
                تاريخ الإنشاء
              </th>
              <th className="font-medium px-4 py-3 text-center">الإجراءات</th>
            </tr>
          </thead>
  
          <tbody>
            {testimonials?.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-500">
                  لا توجد توصيات متاحة
                </td>
              </tr>
            ) : (
              testimonials?.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 dark:border-[#172036] hover:bg-[#F9F6FF] dark:hover:bg-[#1c2540] transition"
                >
                  {/* الصورة */}
                  <td className="text-center px-[20px] py-[15px]">
                    <div className="relative w-[40px] h-[40px] mx-auto">
                      <Image
                        className="rounded-md object-cover w-full h-full"
                        alt="testimonial-image"
                        src={item?.image || "/placeholder.png"}
                        width={40}
                        height={40}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder.png";
                        }}
                      />
                    </div>
                  </td>
  
                  {/* الاسم */}
                  <td className="text-center px-[20px] py-[15px]">
                    <span className="block text-[15px] font-medium">
                      {item.name_ar?.length > 20
                        ? item.name_ar.slice(0, 20) + "..."
                        : item.name_ar}
                    </span>
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
  
                  {/* الإجراءات */}
                  <td className="px-4 py-3 align-middle text-center">
                    <div className="flex justify-center gap-3">
                      <Link
                        href={`/dashboard/testimonial/${item.id}`}
                        className="text-gray-500 hover:text-[#6043FD] transition"
                      >
                        <i className="material-symbols-outlined !text-[20px] font-normal">
                          edit
                        </i>
                      </Link>
                      <button
                        onClick={() => {
                          console.log("Deleting ID:", item.id);
                          mutate(item.id as string);
                        }}
                        disabled={isPending}
                        className="text-gray-500 hover:text-red-500 transition"
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
          عرض {endIndex} توصية من اجمالي {total} توصية
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

export default TestimonialListTable;
