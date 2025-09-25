"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import supabase from "../../../../../services/supabase";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";

export interface Branch {
  id: string;
  name_ar: string;
  name_en: string;
  area_ar: string;
  area_en: string;
  address_ar: string;
  address_en: string;
  works_hours: string;
  phone: string;
  google_map: string;
  image: string;
  created_at: string;
}

type FormData = {
  name_ar: string;
  name_en: string;
  area_ar: string;
  area_en: string;
  address_ar: string;
  address_en: string;
  works_hours: string;
  phone: string;
  google_map: string;
};

const BranchesList: React.FC = () => {
  const [branchesList, setBranchesList] = useState<Branch[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const branchesPerPage = 8;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormData>();

  useEffect(() => {
    const fetchBranches = async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching branches:", error.message);
      } else {
        setBranchesList(data as Branch[]);
      }
    };

    fetchBranches();
  }, []);

  const handleDeleteBranch = async (id: string) => {
    try {
      // First get the branch to get its image URL
      const { data: branch, error: fetchError } = await supabase
        .from("branches")
        .select("image")
        .eq("id", id)
        .single();

      if (fetchError) {
        throw new Error("فشل في جلب بيانات الفرع");
      }

      // Extract the file path from the image URL
      const imageUrl = branch.image;
      if (imageUrl) {
        const urlParts = imageUrl.split("/");
        const fileName = urlParts[urlParts.length - 1];

        if (fileName) {
          // Delete the image from storage
          const { error: storageError } = await supabase.storage
            .from("branches")
            .remove([fileName]);

          if (storageError) {
            console.error("Error deleting image:", storageError);
            throw new Error("فشل في حذف الصورة من التخزين");
          }
        }
      }

      // Delete the branch record
      const { error: deleteError } = await supabase
        .from("branches")
        .delete()
        .eq("id", id);

      if (deleteError) {
        throw new Error("فشل في حذف الفرع");
      }

      setBranchesList((prev) => prev.filter((branch) => branch.id !== id));
      toast.success("تم حذف الفرع والصورة بنجاح");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleEditClick = (branch: Branch) => {
    setSelectedBranch(branch);
    setValue("name_ar", branch.name_ar);
    setValue("name_en", branch.name_en);
    setValue("area_ar", branch.area_ar);
    setValue("area_en", branch.area_en);
    setValue("address_ar", branch.address_ar);
    setValue("address_en", branch.address_en);
    setValue("works_hours", branch.works_hours);
    setValue("phone", branch.phone);
    setValue("google_map", branch.google_map);
    setPreviewImage(branch.image);
    setIsEditModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const onEditSubmit = async (data: FormData) => {
    if (!selectedBranch) return;
    setLoading(true);

    try {
      let imageUrl = selectedBranch.image;

      if (selectedImage) {
        const fileExt = selectedImage.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;

        const { error: imageUploadError } = await supabase.storage
          .from("branches")
          .upload(fileName, selectedImage);

        if (imageUploadError) {
          throw new Error("فشل في رفع الصورة");
        }

        imageUrl = supabase.storage.from("branches").getPublicUrl(fileName)
          .data.publicUrl;
      }

      const { error: updateError } = await supabase
        .from("branches")
        .update({ ...data, image: imageUrl })
        .eq("id", selectedBranch.id);

      if (updateError) {
        throw new Error("حدث خطأ أثناء تحديث البيانات");
      }

      setBranchesList((prev) =>
        prev.map((branch) =>
          branch.id === selectedBranch.id
            ? { ...branch, ...data, image: imageUrl }
            : branch
        )
      );

      toast.success("تم تحديث الفرع بنجاح");
      setIsEditModalOpen(false);
      reset();
      setSelectedImage(null);
      setPreviewImage(null);
      setSelectedBranch(null);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ البحث والفلترة
  const filteredBranches = branchesList.filter((branch) => {
    const matchesSearch =
      branch.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.area_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.area_en.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredBranches.length / branchesPerPage);
  const paginatedBranches = filteredBranches.slice(
    (currentPage - 1) * branchesPerPage,
    currentPage * branchesPerPage
  );

  return (
    <>
      {/* Title + Breadcrumb */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <h5 className="!mb-0 text-xl font-semibold text-[#011957] dark:text-white">
          إدارة الفروع
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
          <li className="text-gray-500 dark:text-gray-400">الفروع</li>
        </ol>
      </div>

      <div className="trezo-card bg-[#F7F7F7] dark:bg-[#0c1427] mb-6 p-6 rounded-lg shadow">
        {/* Add Button */}
        <div className="flex justify-between items-center mb-6">
          <h5 className="!mb-0 text-lg font-semibold text-[#011957] dark:text-white">
            قائمة الفروع
          </h5>
          <Link
            href="/dashboard/branches/create-branch"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-gradient-to-r from-[#6043FD] to-[#9861FB] text-white font-medium hover:from-[#5033e0] hover:to-[#8750e0] transition shadow"
          >
            <i className="material-symbols-outlined !text-[22px]">add</i>
            <span>أضف فرع جديد</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 text-[#011957] dark:text-white bg-gradient-to-r from-[#6043FD] via-[#9861FB] to-[#BA6FEE] dark:from-[#15203c] dark:via-[#1e2a4a] dark:to-[#011957] p-6 rounded-lg shadow-md">
          {/* Search */}
          <div className="relative">
            <label className="block mb-2 text-sm font-medium text-white">
              بحث
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن فرع..."
              className="w-full p-2 pr-10 border rounded-lg outline-none text-sm bg-[#F3EBFF] border-[#BA6FEE] text-[#011957] placeholder-gray-500 hover:border-[#9861FB] focus:border-[#6043FD] focus:ring-2 focus:ring-[#BA6FEE] dark:bg-[#1e1a3c] dark:border-[#6043FD] dark:text-white"
            />
            <i className="material-symbols-outlined absolute right-3 top-9 text-[#6043FD] dark:text-[#BA6FEE]">
              search
            </i>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-base">
            <thead className="text-[#011957] dark:text-white bg-[#F3EBFF] dark:bg-[#15203c]">
              <tr>
                <th className="font-medium px-4 py-3 text-center">اسم الفرع</th>
                <th className="font-medium px-4 py-3 text-center hidden md:table-cell">المنطقة</th>
                <th className="font-medium px-4 py-3 text-center">الصورة</th>
                <th className="font-medium px-4 py-3 text-center hidden md:table-cell">رقم الهاتف</th>
                <th className="font-medium px-4 py-3 text-center hidden md:table-cell">التاريخ</th>
                <th className="font-medium px-4 py-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBranches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    لا توجد فروع متاحة
                  </td>
                </tr>
              ) : (
                paginatedBranches.map((branch) => (
                  <tr
                    key={branch.id}
                    className="border-b border-gray-100 dark:border-[#172036] hover:bg-[#F9F6FF] dark:hover:bg-[#1c2540] transition"
                  >
                    {/* اسم الفرع */}
                    <td className="text-center md:ltr:text-left md:rtl:text-right whitespace-nowrap px-[20px] py-[15px] border-b border-gray-100 dark:border-[#172036] ltr:first:border-l ltr:last:border-r rtl:first:border-r rtl:last:border-l">
                      <div className="flex flex-col items-center justify-center md:justify-start text-black dark:text-white transition-all hover:text-primary-500">
                        <div className="font-bold text-center md:text-start">{branch.name_ar}</div>
                        <div className="text-sm text-gray-500 text-center md:text-start">
                          {branch.name_en}
                        </div>
                      </div>
                    </td>

                    {/* المنطقة */}
                    <td className="px-4 py-3 align-middle text-gray-700 dark:text-gray-300 text-center hidden md:table-cell">
                      <div>
                        <div className="font-medium">{branch.area_ar}</div>
                        <div className="text-sm text-gray-500">
                          {branch.area_en}
                        </div>
                      </div>
                    </td>

                    {/* الصورة */}
                    <td className="px-4 py-3 align-middle text-center">
                      {branch.image ? (
                        <Image
                          src={branch.image}
                          alt={branch.name_ar}
                          width={60}
                          height={40}
                          className="rounded-md object-cover mx-auto"
                        />
                      ) : (
                        <div className="w-[60px] h-[40px] bg-[#F9F6FF] dark:bg-[#1a1a33] rounded-md flex items-center justify-center text-[#6043FD] text-xs border border-[#BA6FEE] mx-auto">
                          لا توجد صورة
                        </div>
                      )}
                    </td>

                    {/* رقم الهاتف */}
                    <td className="px-4 py-3 align-middle text-gray-600 dark:text-gray-300 text-center hidden md:table-cell">
                      {branch.phone || "غير محدد"}
                    </td>

                    {/* التاريخ */}
                    <td className="px-4 py-3 align-middle text-gray-600 dark:text-gray-300 text-center hidden md:table-cell">
                      {new Date(branch.created_at).toLocaleDateString("ar-EG")}
                    </td>

                    {/* الإجراءات */}
                    <td className="px-4 py-3 align-middle text-center">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => handleEditClick(branch)}
                          className="text-gray-500 hover:text-[#6043FD] transition"
                        >
                          <i className="material-symbols-outlined !text-[20px] font-normal">
                            edit
                          </i>
                        </button>
                        <button
                          onClick={() => handleDeleteBranch(branch.id)}
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

        {/* Edit Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-[#0c1427] p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-black dark:text-white">
                  تعديل الفرع
                </h3>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    reset();
                    setSelectedImage(null);
                    setPreviewImage(null);
                    setSelectedBranch(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <i className="material-symbols-outlined">close</i>
                </button>
              </div>

              <form onSubmit={handleSubmit(onEditSubmit)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block font-medium text-black dark:text-white">
                      اسم الفرع (ar)
                    </label>
                    <input
                      {...register("name_ar", {
                        required: true,
                        minLength: {
                          value: 3,
                          message: "الاسم يجب أن يكون 3 أحرف على الأقل",
                        },
                      })}
                      className="h-[45px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-4 block w-full outline-0 transition-all"
                    />
                    {errors.name_ar && (
                      <p className="text-red-500 mt-1">
                        {errors.name_ar.message || "مطلوب"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block font-medium text-black dark:text-white">
                      اسم الفرع (en)
                    </label>
                    <input
                      {...register("name_en", {
                        required: true,
                        minLength: {
                          value: 3,
                          message: "الاسم يجب أن يكون 3 أحرف على الأقل",
                        },
                      })}
                      className="h-[45px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-4 block w-full outline-0 transition-all"
                    />
                    {errors.name_en && (
                      <p className="text-red-500 mt-1">
                        {errors.name_en.message || "مطلوب"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block font-medium text-black dark:text-white">
                      اسم المنطقة (ar)
                    </label>
                    <input
                      {...register("area_ar", {
                        required: true,
                        minLength: {
                          value: 3,
                          message: "اسم المنطقة يجب أن يكون 3 أحرف على الأقل",
                        },
                      })}
                      className="h-[45px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-4 block w-full outline-0 transition-all"
                    />
                    {errors.area_ar && (
                      <p className="text-red-500 mt-1">
                        {errors.area_ar.message || "مطلوب"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block font-medium text-black dark:text-white">
                      اسم المنطقة (en)
                    </label>
                    <input
                      {...register("area_en", {
                        required: true,
                        minLength: {
                          value: 3,
                          message: "اسم المنطقة يجب أن يكون 3 أحرف على الأقل",
                        },
                      })}
                      className="h-[45px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-4 block w-full outline-0 transition-all"
                    />
                    {errors.area_en && (
                      <p className="text-red-500 mt-1">
                        {errors.area_en.message || "مطلوب"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block font-medium text-black dark:text-white">
                      العنوان (ar)
                    </label>
                    <input
                      {...register("address_ar", {
                        required: true,
                        minLength: {
                          value: 3,
                          message: "العنوان يجب أن يكون 3 أحرف على الأقل",
                        },
                      })}
                      className="h-[45px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-4 block w-full outline-0 transition-all"
                    />
                    {errors.address_ar && (
                      <p className="text-red-500 mt-1">
                        {errors.address_ar.message || "مطلوب"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block font-medium text-black dark:text-white">
                      العنوان (en)
                    </label>
                    <input
                      {...register("address_en", {
                        required: true,
                        minLength: {
                          value: 3,
                          message: "العنوان يجب أن يكون 3 أحرف على الأقل",
                        },
                      })}
                      className="h-[45px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-4 block w-full outline-0 transition-all"
                    />
                    {errors.address_en && (
                      <p className="text-red-500 mt-1">
                        {errors.address_en.message || "مطلوب"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block font-medium text-black dark:text-white">
                      ساعات العمل
                    </label>
                    <input
                      {...register("works_hours", {
                        required: true,
                        minLength: {
                          value: 3,
                          message: "ساعات العمل يجب أن تكون 3 أحرف على الأقل",
                        },
                      })}
                      className="h-[45px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-4 block w-full outline-0 transition-all"
                    />
                    {errors.works_hours && (
                      <p className="text-red-500 mt-1">
                        {errors.works_hours.message || "مطلوب"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block font-medium text-black dark:text-white">
                      رقم الهاتف
                    </label>
                    <input
                      {...register("phone", {
                        required: true,
                        minLength: {
                          value: 3,
                          message: "رقم الهاتف يجب أن يكون 3 أحرف على الأقل",
                        },
                      })}
                      className="h-[45px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-4 block w-full outline-0 transition-all"
                    />
                    {errors.phone && (
                      <p className="text-red-500 mt-1">
                        {errors.phone.message || "مطلوب"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block font-medium text-black dark:text-white">
                      الموقع الجغرافي (google map)
                    </label>
                    <input
                      {...register("google_map", {
                        required: true,
                        minLength: {
                          value: 3,
                          message: "الرابط يجب أن يكون 3 أحرف على الأقل",
                        },
                      })}
                      className="h-[45px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-4 block w-full outline-0 transition-all"
                    />
                    {errors.google_map && (
                      <p className="text-red-500 mt-1">
                        {errors.google_map.message || "مطلوب"}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block font-medium text-black dark:text-white">
                      الصورة
                    </label>
                    <div className="relative flex items-center justify-center overflow-hidden rounded-md py-8 px-4 border border-gray-200 dark:border-[#172036]">
                      <div className="flex items-center justify-center">
                        <div className="w-8 h-8 border border-gray-100 dark:border-[#15203c] flex items-center justify-center rounded-md text-primary-500 text-lg ltr:mr-3 rtl:ml-3">
                          <i className="ri-upload-2-line"></i>
                        </div>
                        <p className="text-black dark:text-white">
                          <strong>اضغط لرفع الصورة</strong>
                          <br /> JPG, PNG, WEBP (الحد الأقصى 50 ميجابايت)
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleFileChange}
                      />
                    </div>

                    {previewImage && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <div className="relative w-[50px] h-[50px]">
                          <Image
                            src={previewImage}
                            alt="preview"
                            width={50}
                            height={50}
                            className="rounded-md"
                          />
                          <button
                            type="button"
                            className="absolute top-[-5px] right-[-5px] bg-orange-500 text-white w-[20px] h-[20px] flex items-center justify-center rounded-full text-xs"
                            onClick={() => {
                              setSelectedImage(null);
                              setPreviewImage(null);
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      reset();
                      setSelectedImage(null);
                      setPreviewImage(null);
                      setSelectedBranch(null);
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50"
                  >
                    {loading ? "جارٍ الحفظ..." : "حفظ التغييرات"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-4">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded-md mx-1 text-sm ${
                  currentPage === i + 1
                    ? "bg-primary-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default BranchesList;
