"use client";

import React, { useState } from "react";
import Image from "next/image";
import Head from "next/head";
import { useCategories } from "@/components/news/categories/useCategories";
import { useUpdateCategory } from "@/components/news/categories/useUpdateCategory";
import { useDeleteCategory } from "@/components/news/categories/useDeleteCategory";
import { useAddCategory } from "@/components/news/categories/useCreateCategory";
import Link from "next/link";

interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  image_url?: string | null;
}

export default function CategoriesPage() {
  const { data: categories, isLoading, isError, refetch } = useCategories();

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [editAr, setEditAr] = useState("");
  const [editEn, setEditEn] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string>("");

  const [newAr, setNewAr] = useState("");
  const [newEn, setNewEn] = useState("");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string>("");

  const { updateCategory, isPending: isUpdating } = useUpdateCategory();
  const { deleteCategory, isPending: isDeleting } = useDeleteCategory();
  const { addCategory, isPending: isAdding } = useAddCategory();

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isNew: boolean
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isNew) {
        setNewImage(file);
        setNewImagePreview(URL.createObjectURL(file));
      } else {
        setEditImage(file);
        setEditImagePreview(URL.createObjectURL(file));
      }
    }
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setEditAr(cat.name_ar);
    setEditEn(cat.name_en);
    setEditImagePreview(cat.image_url || "");
  };

  const closeEditModal = () => {
    setEditingCategory(null);
    setEditAr("");
    setEditEn("");
    setEditImage(null);
    setEditImagePreview("");
  };

  const handleEditSave = () => {
    if (!editingCategory) return;
    updateCategory(
      {
        id: editingCategory.id,
        name_ar: editAr.trim(),
        name_en: editEn.trim(),
        image: editImage || undefined,
      },
      {
        onSuccess: () => {
          closeEditModal();
          refetch();
        },
      }
    );
  };

  const openDeleteModal = (cat: Category) => setDeletingCategory(cat);
  const closeDeleteModal = () => setDeletingCategory(null);

  const handleDeleteConfirm = () => {
    if (!deletingCategory) return;
    deleteCategory(deletingCategory.id, {
      onSuccess: () => {
        closeDeleteModal();
        refetch();
      },
    });
  };

  const handleAddCategory = () => {
    if (!newAr.trim() || !newEn.trim()) return;
    addCategory(
      {
        name_ar: newAr.trim(),
        name_en: newEn.trim(),
        image: newImage || undefined,
      },
      {
        onSuccess: () => {
          setNewAr("");
          setNewEn("");
          setNewImage(null);
          setNewImagePreview("");
          setIsAddModalOpen(false);
          refetch();
        },
      }
    );
  };

  if (isLoading) {
    return (
      <>
        <Head>
          <title>التصنيفات - جاري التحميل</title>
          <meta name="description" content="إدارة تصنيفات الأخبار" />
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <main
          className="flex justify-center items-center h-48 text-gray-500"
          role="main"
          aria-label="صفحة التصنيفات"
        >
          <section aria-label="حالة التحميل">
            <p>جاري التحميل...</p>
          </section>
        </main>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Head>
          <title>التصنيفات - خطأ</title>
          <meta name="description" content="حدث خطأ أثناء تحميل التصنيفات" />
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <main
          className="flex justify-center items-center h-48 text-red-500"
          role="main"
          aria-label="صفحة التصنيفات"
        >
          <section aria-label="رسالة الخطأ">
            <p>حدث خطأ أثناء جلب التصنيفات</p>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>إدارة التصنيفات - تصنيفات الأخبار</title>
        <meta
          name="description"
          content="إدارة تصنيفات الأخبار - إضافة وتعديل وحذف التصنيفات مع الصور"
        />
        <meta
          name="keywords"
          content="تصنيفات, أخبار, إدارة, إضافة, تعديل, حذف"
        />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content="إدارة التصنيفات - تصنيفات الأخبار" />
        <meta
          property="og:description"
          content="إدارة تصنيفات الأخبار مع واجهة سهلة الاستخدام"
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="/dashboard/news/categories" />
      </Head>

      <main role="main" aria-label="صفحة إدارة التصنيفات">
        <header className="mb-[25px] md:flex items-center justify-between">
          <h1 className="!mb-0 text-2xl font-bold">التصنيفات</h1>

          <nav aria-label="مسار التنقل">
            <ol className="breadcrumb mt-[12px] md:mt-0 rtl:flex-row-reverse">
              <li className="breadcrumb-item inline-block relative text-sm mx-[11px] ltr:first:ml-0 rtl:first:mr-0 ltr:last:mr-0 rtl:last:ml-0">
                <Link
                  href="/dashboard"
                  className="inline-block relative ltr:pl-[22px] rtl:pr-[22px] transition-all hover:text-primary-500"
                  aria-label="العودة للصفحة الرئيسية"
                >
                  <i
                    className="material-symbols-outlined absolute ltr:left-0 rtl:right-0 !text-lg -mt-px text-primary-500 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  >
                    home
                  </i>
                  رئيسية
                </Link>
              </li>
              <li className="breadcrumb-item inline-block relative text-sm mx-[11px] ltr:first:ml-0 rtl:first:mr-0 ltr:last:mr-0 rtl:last:ml-0">
                التصنيفات
              </li>
            </ol>
          </nav>
        </header>

        <section
          className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md"
          aria-label="قائمة التصنيفات"
        >
          <header className="trezo-card-header mb-[20px] md:mb-[25px] sm:flex items-center justify-between">
            <div className="trezo-card-subtitle mt-[15px] sm:mt-0">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-block transition-all rounded-md font-medium px-[13px] py-[6px] text-primary-500 border border-primary-500 hover:bg-primary-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label="إضافة تصنيف جديد"
              >
                <span className="inline-block relative ltr:pl-[22px] rtl:pr-[22px]">
                  <i
                    className="material-symbols-outlined !text-[22px] absolute ltr:-left-[4px] rtl:-right-[4px] top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  >
                    add
                  </i>
                  إضافة تصنيف جديد
                </span>
              </button>
            </div>
          </header>

          <div className="trezo-card-content">
            <div className="table-responsive overflow-x-auto">
              <table
                className="w-full"
                role="table"
                aria-label="جدول التصنيفات"
              >
                <thead className="text-black dark:text-white">
                  <tr>
                    {["التصنيف", "الاجرائات"].map((header) => (
                      <th
                        key={header}
                        className="font-medium ltr:text-left rtl:text-right px-[20px] py-[11px] bg-gray-50 dark:bg-[#15203c] whitespace-nowrap ltr:first:rounded-tl-md ltr:last:rounded-tr-md rtl:first:rounded-tr-md rtl:last:rounded-tl-md"
                        scope="col"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="text-black dark:text-white">
                  {categories?.length === 0 ? (
                    <tr>
                      <td
                        colSpan={2}
                        className="text-center py-8 text-gray-500"
                      >
                        لا توجد تصنيفات متاحة
                      </td>
                    </tr>
                  ) : (
                    categories?.map((cat) => (
                      <tr key={cat.id}>
                        <td className="ltr:text-left rtl:text-right whitespace-nowrap px-[20px] py-[15px] border-b border-gray-100 dark:border-[#172036] ltr:first:border-l ltr:last:border-r rtl:first:border-r rtl:last:border-l">
                          <div className="flex items-center text-black dark:text-white transition-all hover:text-primary-500">
                            <div className="relative w-[40px] h-[40px]">
                              {cat.image_url ? (
                                <Image
                                  src={cat.image_url}
                                  alt={`صورة تصنيف ${cat.name_ar}`}
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover rounded-md"
                                />
                              ) : (
                                <div
                                  className="w-full h-full bg-gray-100 dark:bg-[#15203c] rounded-md flex items-center justify-center"
                                  aria-label="لا توجد صورة"
                                >
                                  <i
                                    className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-xl"
                                    aria-hidden="true"
                                  >
                                    image
                                  </i>
                                </div>
                              )}
                            </div>
                            <div className="ltr:ml-[12px] rtl:mr-[12px]">
                              <span className="block text-[15px] font-medium">
                                {cat.name_ar}
                              </span>
                              <span className="block text-[13px] text-gray-500 dark:text-gray-400">
                                {cat.name_en}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="ltr:text-left rtl:text-right whitespace-nowrap px-[20px] py-[15px] border-b border-gray-100 dark:border-[#172036] ltr:first:border-l ltr:last:border-r rtl:first:border-r rtl:last:border-l">
                          <div className="flex items-center gap-[9px]">
                            <div className="relative group">
                              <button
                                onClick={() => openEditModal(cat)}
                                className="text-gray-500 leading-none focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded"
                                type="button"
                                aria-label={`تعديل التصنيف: ${cat.name_ar}`}
                              >
                                <i
                                  className="material-symbols-outlined !text-md"
                                  aria-hidden="true"
                                >
                                  edit
                                </i>
                              </button>

                              {/* Tooltip */}
                              <div
                                className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                role="tooltip"
                              >
                                تعديل
                                {/* Arrow */}
                                <div
                                  className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-white dark:border-[#172036] border-t-gray-800 dark:border-t-gray-800"
                                  aria-hidden="true"
                                ></div>
                              </div>
                            </div>

                            <div className="relative group">
                              <button
                                onClick={() => openDeleteModal(cat)}
                                className="text-danger-500 leading-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                                aria-label={`حذف التصنيف: ${cat.name_ar}`}
                              >
                                <i
                                  className="material-symbols-outlined !text-md"
                                  aria-hidden="true"
                                >
                                  delete
                                </i>
                              </button>

                              {/* Tooltip */}
                              <div
                                className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                role="tooltip"
                              >
                                مسح
                                {/* Arrow */}
                                <div
                                  className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-white dark:border-[#172036] border-t-gray-800 dark:border-t-gray-800"
                                  aria-hidden="true"
                                ></div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* مودال التعديل */}
          {editingCategory && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-modal-title"
            >
              <div className="bg-white dark:bg-[#0c1427] rounded-xl shadow-2xl p-8 w-full max-w-md mx-4">
                <h2
                  id="edit-modal-title"
                  className="text-2xl font-bold mb-6 text-gray-800 dark:text-white"
                >
                  تعديل التصنيف
                </h2>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                    الصورة
                  </label>
                  <div className="flex items-center gap-4">
                    {editImagePreview && (
                      <Image
                        src={editImagePreview}
                        alt="معاينة الصورة"
                        width={96}
                        height={96}
                        className="w-24 h-24 object-cover rounded-lg shadow-sm"
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, false)}
                      className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-[#15203c] dark:file:text-primary-400 transition-all duration-200"
                      aria-label="اختر صورة جديدة"
                    />
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="الاسم بالعربية"
                  className="w-full mb-4 px-4 py-3 border border-gray-300 dark:border-[#172036] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-[#0c1427] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  value={editAr}
                  onChange={(e) => setEditAr(e.target.value)}
                  disabled={isUpdating}
                  aria-label="الاسم بالعربية"
                />
                <input
                  type="text"
                  placeholder="الاسم بالإنجليزية"
                  className="w-full mb-6 px-4 py-3 border border-gray-300 dark:border-[#172036] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-[#0c1427] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  value={editEn}
                  onChange={(e) => setEditEn(e.target.value)}
                  disabled={isUpdating}
                  aria-label="الاسم بالإنجليزية"
                />
                <div className="flex justify-end gap-4">
                  <button
                    onClick={closeEditModal}
                    disabled={isUpdating}
                    className="px-6 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-[#15203c] dark:hover:bg-[#1a2942] text-gray-700 dark:text-gray-200 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    aria-label="إلغاء التعديل"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleEditSave}
                    disabled={isUpdating || !editAr.trim() || !editEn.trim()}
                    className="px-6 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    aria-label="حفظ التغييرات"
                  >
                    {isUpdating ? "جاري الحفظ..." : "حفظ التغييرات"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* مودال الحذف */}
          {deletingCategory && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-modal-title"
            >
              <div className="bg-white dark:bg-[#0c1427] rounded-xl shadow-2xl p-8 w-full max-w-sm mx-4 text-center">
                <div
                  className="w-16 h-16 bg-red-100 dark:bg-[#15203c] rounded-full flex items-center justify-center mx-auto mb-6"
                  aria-hidden="true"
                >
                  <i className="material-symbols-outlined text-red-600 dark:text-red-400 text-3xl">
                    warning
                  </i>
                </div>
                <h2
                  id="delete-modal-title"
                  className="text-xl font-bold mb-4 text-gray-800 dark:text-white"
                >
                  تأكيد الحذف
                </h2>
                <p className="mb-8 text-gray-600 dark:text-gray-300">
                  هل أنت متأكد أنك تريد حذف التصنيف{" "}
                  <span className="font-semibold text-gray-800 dark:text-white">
                    {deletingCategory.name_ar}
                  </span>
                  ؟
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={closeDeleteModal}
                    disabled={isDeleting}
                    className="px-6 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-[#15203c] dark:hover:bg-[#1a2942] text-gray-700 dark:text-gray-200 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    aria-label="إلغاء الحذف"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={isDeleting}
                    className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    aria-label="تأكيد الحذف"
                  >
                    {isDeleting ? "جارٍ الحذف..." : "تأكيد الحذف"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* مودال الإضافة */}
          {isAddModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-modal-title"
            >
              <div className="bg-white dark:bg-[#0c1427] rounded-xl shadow-2xl p-8 w-full max-w-md mx-4">
                <h2
                  id="add-modal-title"
                  className="text-2xl font-bold mb-6 text-gray-800 dark:text-white"
                >
                  إضافة تصنيف جديد
                </h2>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                    الصورة
                  </label>
                  <div className="flex items-center gap-4">
                    {newImagePreview && (
                      <Image
                        src={newImagePreview}
                        alt="معاينة الصورة"
                        width={96}
                        height={96}
                        className="w-24 h-24 object-cover rounded-lg shadow-sm"
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, true)}
                      className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-[#15203c] dark:file:text-primary-400 transition-all duration-200"
                      aria-label="اختر صورة للتصنيف الجديد"
                    />
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="الاسم بالعربية"
                  className="w-full mb-4 px-4 py-3 border border-gray-300 dark:border-[#172036] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-[#0c1427] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  value={newAr}
                  onChange={(e) => setNewAr(e.target.value)}
                  disabled={isAdding}
                  aria-label="الاسم بالعربية"
                />
                <input
                  type="text"
                  placeholder="الاسم بالإنجليزية"
                  className="w-full mb-6 px-4 py-3 border border-gray-300 dark:border-[#172036] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-[#0c1427] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  value={newEn}
                  onChange={(e) => setNewEn(e.target.value)}
                  disabled={isAdding}
                  aria-label="الاسم بالإنجليزية"
                />
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    disabled={isAdding}
                    className="px-6 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-[#15203c] dark:hover:bg-[#1a2942] text-gray-700 dark:text-gray-200 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    aria-label="إلغاء الإضافة"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleAddCategory}
                    disabled={isAdding || !newAr.trim() || !newEn.trim()}
                    className="px-6 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    aria-label="إضافة التصنيف"
                  >
                    {isAdding ? "جاري الإضافة..." : "إضافة التصنيف"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
