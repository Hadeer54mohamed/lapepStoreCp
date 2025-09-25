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
        {/* Header */}
        <header className="mb-[25px] md:flex items-center justify-between">
          <h1 className="!mb-0 text-2xl font-bold text-[#011957] dark:text-white">
            التصنيفات
          </h1>
          <nav>
            <ol className="breadcrumb flex gap-2 mt-2 md:mt-0 text-sm text-gray-600 dark:text-gray-300">
              <li>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center text-[#6043FD] hover:text-[#9861FB] transition"
                >
                  <i className="material-symbols-outlined !text-lg mr-1">
                    home
                  </i>
                  رئيسية
                </Link>
              </li>
              <li>/</li>
              <li className="breadcrumb-item mx-[11px] text-primary-500">
                التصنيفات
              </li>
            </ol>
          </nav>
        </header>

        {/* Card */}
        <section className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
          <header className="mb-[20px] sm:flex items-center justify-between">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-block rounded-md font-medium px-[13px] py-[8px] 
              text-white bg-gradient-to-r from-[#6043FD] via-[#9861FB] to-[#BA6FEE] 
              hover:from-[#5034e5] hover:via-[#8450e8] hover:to-[#a65ee0] 
              focus:outline-none focus:ring-2 focus:ring-[#6043FD] focus:ring-offset-2 
              transition-all shadow-md"
            >
              <i className="material-symbols-outlined align-middle mr-1">add</i>
              إضافة تصنيف جديد
            </button>
          </header>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-[#011957] dark:text-white bg-gradient-to-r from-[#F3EBFF] to-[#E9D8FD] dark:from-[#15203c] dark:to-[#1a2747]"
              >
                <tr className="text-[#011957] dark:text-white bg-[#F3EBFF] dark:bg-[#15203c]">
                  <th className="px-4 py-3 text-right font-medium">التصنيف</th>
                  <th className="px-4 py-3 text-right font-medium">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="text-black dark:text-white">
                {categories?.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="text-center py-8 text-gray-500">
                      لا توجد تصنيفات متاحة
                    </td>
                  </tr>
                ) : (
                  categories?.map((cat) => (
                    <tr
                      key={cat.id}
                      className="border-b border-gray-100 dark:border-[#172036] hover:bg-[#F3EBFF]/40 dark:hover:bg-[#6043FD]/10 transition"
                      >
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="relative w-10 h-10">
                            {cat.image_url ? (
                              <Image
                                src={cat.image_url}
                                alt={cat.name_ar}
                                fill
                                className="rounded-md object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 dark:bg-[#15203c] rounded flex items-center justify-center">
                                <i className="material-symbols-outlined text-gray-400">
                                  image
                                </i>
                              </div>
                            )}
                          </div>
                          <div className="mr-3">
                            <p className="font-medium">{cat.name_ar}</p>
                            <p className="text-sm text-gray-500">
                              {cat.name_en}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <button
                            onClick={() => openEditModal(cat)}
                            className="text-gray-500 hover:text-[#6043FD]"
                          >
                          <i className="material-symbols-outlined !text-[20px] font-normal">
                          edit</i>
                          </button>
                          <button
                            onClick={() => openDeleteModal(cat)}
                            className="text-red-500 hover:text-red-600"
                          >
                          <i className="material-symbols-outlined !text-[20px] font-normal">
                          delete</i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ============== مودال الإضافة ============== */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-[#0c1427] p-6 rounded-lg shadow-lg w-full max-w-md">
              <h2 className="text-lg font-bold mb-4 text-[#6043FD]">
                إضافة تصنيف جديد
              </h2>
              <input
                type="text"
                placeholder="الاسم بالعربية"
                value={newAr}
                onChange={(e) => setNewAr(e.target.value)}
                className="w-full mb-3 p-2 border rounded-md dark:bg-[#15203c] dark:text-white"
              />
              <input
                type="text"
                placeholder="الاسم بالإنجليزية"
                value={newEn}
                onChange={(e) => setNewEn(e.target.value)}
                className="w-full mb-3 p-2 border rounded-md dark:bg-[#15203c] dark:text-white"
              />
              <input
                type="file"
                onChange={(e) => handleImageChange(e, true)}
                className="mb-3 w-full bg-[#f3ebff]"
              />
              {newImagePreview && (
                <div className="mb-3">
                  <Image
                    src={newImagePreview}
                    alt="preview"
                    width={80}
                    height={80}
                    className="rounded-md object-cover"
                  />
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-[#15203c] dark:hover:bg-[#1a2747] rounded-md transition"
                      >
                  إلغاء
                </button>
                <button
                  onClick={handleAddCategory}
                  disabled={isAdding}
                  className="px-4 py-2 text-white rounded-md bg-gradient-to-r from-[#6043FD] to-[#9861FB]"
                >
                  {isAdding ? "جاري الإضافة..." : "إضافة"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============== مودال التعديل ============== */}
        {editingCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-[#0c1427] p-6 rounded-lg shadow-lg w-full max-w-md">
              <h2 className="text-lg font-bold mb-4 text-[#6043FD]">
                تعديل التصنيف
              </h2>
              <input
                type="text"
                placeholder="الاسم بالعربية"
                value={editAr}
                onChange={(e) => setEditAr(e.target.value)}
                className="w-full mb-3 p-2 border rounded-md dark:bg-[#15203c] dark:text-white"
              />
              <input
                type="text"
                placeholder="الاسم بالإنجليزية"
                value={editEn}
                onChange={(e) => setEditEn(e.target.value)}
                className="w-full mb-3 p-2 border rounded-md dark:bg-[#15203c] dark:text-white"
              />
              <input
                type="file"
                onChange={(e) => handleImageChange(e, false)}
                className="mb-3 w-full bg-[#f3ebff]"
              />
              {editImagePreview && (
                <div className="mb-3">
                  <Image
                    src={editImagePreview}
                    alt="preview"
                    width={80}
                    height={80}
                    className="rounded-md object-cover"
                  />
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeEditModal}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-[#15203c] dark:hover:bg-[#1a2747] rounded-md transition"
                  >
                  إلغاء
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={isUpdating}
                  className="px-4 py-2 text-white rounded-md bg-gradient-to-r from-[#6043FD] to-[#9861FB]"
                >
                  {isUpdating ? "جاري الحفظ..." : "حفظ"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============== مودال الحذف ============== */}
        {deletingCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-[#0c1427] p-6 rounded-lg shadow-lg w-full max-w-md">
              <h2 className="text-lg font-bold mb-4 text-red-600">
                حذف التصنيف
              </h2>
              <p className="mb-4">
                هل أنت متأكد أنك تريد حذف التصنيف{" "}
                <span className="font-semibold">
                  {deletingCategory.name_ar}
                </span>
                ؟
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-[#15203c] dark:hover:bg-[#1a2747] rounded-md transition"
                  >
                  إلغاء
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="px-4 py-2 text-white rounded-md bg-gradient-to-r from-red-500 to-red-600"
                >
                  {isDeleting ? "جاري الحذف..." : "حذف"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
