"use client";

import { useCategories } from "@/components/news/categories/useCategories";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";

import {
  Editor,
  EditorProvider,
  BtnBold,
  BtnBulletList,
  BtnClearFormatting,
  BtnItalic,
  BtnLink,
  BtnNumberedList,
  BtnRedo,
  BtnStrikeThrough,
  BtnStyles,
  BtnUnderline,
  BtnUndo,
  HtmlButton,
  Separator,
  Toolbar,
} from "react-simple-wysiwyg";
import {
  getProductById,
  updateProduct,
  uploadProductImage,
  Product,
} from "../../../../../../services/apiProducts";
import { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import Image from "next/image";
import toast from "react-hot-toast";
import Link from "next/link";

interface ProductFormData {
  name_ar: string;
  name_en: string;
  category_id: string;
  description_ar: string;
  description_en: string;
  price: number;
  offer_price?: number;
  stock_quantity: number;
  is_best_seller: boolean;
  limited_time_offer: boolean;
  image_url?: string[];
}

export default function EditProductPage() {
  const [serverImages, setServerImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, reset, control } = useForm({
    defaultValues: {
      name_ar: "",
      name_en: "",
      category_id: "",
      description_ar: "",
      description_en: "",
      price: 0,
      offer_price: 0,
      stock_quantity: 0,
      is_best_seller: false,
      limited_time_offer: false,
    },
  });

  //get id
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  //get categories
  const { data: categories } = useCategories();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => {
      if (!id) throw new Error("No ID provided");
      return getProductById(id);
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (product) {
      reset({
        name_ar: product.name_ar || "",
        name_en: product.name_en || "",
        category_id: product.category_id?.toString() || "",
        description_ar: product.description_ar || "",
        description_en: product.description_en || "",
        price: product.price || 0,
        offer_price: product.offer_price || 0,
        stock_quantity: product.stock_quantity || product.stock || 0,
        is_best_seller: product.is_best_seller || false,
        limited_time_offer: product.limited_time_offer || false,
      });

      if (product.image_url) {
        setServerImages(product.image_url);
      }
    }
  }, [product, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setSelectedImage(file);
  };

  const queryClient = useQueryClient();

  const onSubmit: SubmitHandler<ProductFormData> = async (data) => {
    try {
      if (!id) throw new Error("No ID found");

      setIsSubmitting(true);
      let uploadedImageUrl: string | undefined;

      if (selectedImage) {
        setIsUploadingImage(true);
        uploadedImageUrl = await uploadProductImage(selectedImage);
        setIsUploadingImage(false);
      }

      const updatedData: Partial<Product> = {
        ...data,
        image_url: uploadedImageUrl ? [uploadedImageUrl] : serverImages,
      };

      // تنفيذ التحديث في Supabase
      await updateProduct(id, updatedData);

      // يمكنك هنا إعادة التوجيه أو عرض رسالة نجاح
      toast.success("تم تحديث المنتج بنجاح");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      router.push("/dashboard/news");
    } catch (error: Error | unknown) {
      toast.error("حدث خطأ ما");
      console.log("حدث خطأ أثناء تحديث المنتج:", error);
    } finally {
      setIsSubmitting(false);
      setIsUploadingImage(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            جاري تحميل بيانات المنتج...
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">
            لم يتم العثور على المنتج
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <h5 className="!mb-0 text-xl font-semibold text-[#011957] dark:text-white">
          تعديل منتج
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
          <li>المنتجات</li>
          <li>/</li>
          <li className="text-gray-500 dark:text-gray-400">تعديل منتج</li>
        </ol>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="gap-6">
          <div className="lg:col-span-2">
            <div className="trezo-card bg-[#F7F7F7] dark:bg-[#0c1427] mb-6 p-6 rounded-lg shadow">
              <div className="trezo-card-content">
                {/* Title Field - غير مطلوب هنا لذا نتخطاه */}

                {/* Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Name AR */}
                  <div>
                    <label className="mb-2 text-[#011957] dark:text-white font-medium block">
                      اسم المنتج (بالعربي)
                    </label>
                    <input
                      type="text"
                      className="h-[55px] rounded-md border border-[#BA6FEE] bg-[#F3EBFF] dark:bg-[#0c1427] px-4 w-full text-[#011957] dark:text-white placeholder-gray-500 focus:border-[#6043FD] focus:ring-2 focus:ring-[#BA6FEE]"
                      placeholder="بحد أقصى 100 حرف"
                      id="name_ar"
                      {...register("name_ar")}
                    />
                  </div>

                  {/* Name EN */}
                  <div>
                    <label className="mb-2 text-[#011957] dark:text-white font-medium block">
                      اسم المنتج (بالانجليزي)
                    </label>
                    <input
                      type="text"
                      className="h-[55px] rounded-md border border-[#BA6FEE] bg-[#F3EBFF] dark:bg-[#0c1427] px-4 w-full text-[#011957] dark:text-white placeholder-gray-500 focus:border-[#6043FD] focus:ring-2 focus:ring-[#BA6FEE]"
                      placeholder="بحد أقصى 100 حرف"
                      id="name_en"
                      {...register("name_en")}
                    />
                  </div>

                  {/* Category */}
                  {product && (
                    <div>
                      <label className="mb-2 text-[#011957] dark:text-white font-medium block">
                        التصنيف
                      </label>
                      <select
                        className="h-[55px] rounded-md border border-[#BA6FEE] bg-[#F3EBFF] dark:bg-[#0c1427] px-4 w-full text-[#011957] dark:text-white focus:border-[#6043FD] focus:ring-2 focus:ring-[#BA6FEE]"
                        {...register("category_id")}
                      >
                        {categories?.map((category) => (
                          <option
                            key={category.id}
                            value={category.id.toString()}
                          >
                            {category.name_ar}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Price */}
                  <div>
                    <label className="mb-2 text-[#011957] dark:text-white font-medium block">
                      السعر الأساسي
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="h-[55px] rounded-md border border-[#BA6FEE] bg-white dark:bg-[#0c1427] px-4 w-full text-[#011957] dark:text-white placeholder-gray-500 focus:border-[#6043FD] focus:ring-2 focus:ring-[#BA6FEE]"
                      placeholder="0.00"
                      id="price"
                      {...register("price")}
                    />
                  </div>

                  {/* Offer Price */}
                  <div>
                    <label className="mb-2 text-[#011957] dark:text-white font-medium block">
                      سعر العرض (اختياري)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="h-[55px] rounded-md border border-[#BA6FEE] bg-white dark:bg-[#0c1427] px-4 w-full text-[#011957] dark:text-white placeholder-gray-500 focus:border-[#6043FD] focus:ring-2 focus:ring-[#BA6FEE]"
                      placeholder="اتركه فارغاً إذا لم يكن هناك خصم"
                      id="offer_price"
                      {...register("offer_price")}
                    />
                  </div>

                  {/* Stock */}
                  <div>
                    <label className="mb-2 text-[#011957] dark:text-white font-medium block">
                      المخزون
                    </label>
                    <input
                      type="number"
                      className="h-[55px] rounded-md border border-[#BA6FEE] bg-white dark:bg-[#0c1427] px-4 w-full text-[#011957] dark:text-white placeholder-gray-500 focus:border-[#6043FD] focus:ring-2 focus:ring-[#BA6FEE]"
                      placeholder="0"
                      id="stock_quantity"
                      {...register("stock_quantity")}
                    />
                  </div>
                </div>

                {/* الوصف بالعربية */}
                <div className="sm:col-span-2 mt-6">
                  <EditorProvider>
                    <Controller
                      control={control}
                      name="description_ar"
                      render={({ field }) => (
                        <div className="sm:col-span-2">
                          <label className="mb-2 text-[#011957] dark:text-white font-medium block">
                            وصف المنتج (بالعربي)
                          </label>
                          <Editor
                            style={{ minHeight: "200px" }}
                            value={field.value}
                            onChange={field.onChange}
                            containerProps={{
                              style: {
                                borderColor: "#BA6FEE",
                                background: "#F9F6FF",
                                color: "#011957",
                              },
                            }}
                          >
                            <Toolbar>
                              <BtnUndo />
                              <BtnRedo />
                              <Separator />
                              <BtnBold />
                              <BtnItalic />
                              <BtnUnderline />
                              <BtnStrikeThrough />
                              <Separator />
                              <BtnNumberedList />
                              <BtnBulletList />
                              <Separator />
                              <BtnLink />
                              <BtnClearFormatting />
                              <HtmlButton />
                              <Separator />
                              <BtnStyles />
                            </Toolbar>
                          </Editor>
                        </div>
                      )}
                    />
                  </EditorProvider>
                </div>

                {/* الوصف بالانجليزية */}
                <div className="sm:col-span-2 mt-6">
                  <EditorProvider>
                    <Controller
                      control={control}
                      name="description_en"
                      render={({ field }) => (
                        <div className="sm:col-span-2">
                          <label className="mb-2 text-[#011957] dark:text-white font-medium block">
                            وصف المنتج (بالانجليزي)
                          </label>
                          <Editor
                            style={{ minHeight: "200px" }}
                            value={field.value}
                            onChange={field.onChange}
                            containerProps={{
                              style: {
                                borderColor: "#BA6FEE",
                                background: "#F9F6FF",
                                color: "#011957",
                              },
                            }}
                          >
                            <Toolbar>
                              <BtnUndo />
                              <BtnRedo />
                              <Separator />
                              <BtnBold />
                              <BtnItalic />
                              <BtnUnderline />
                              <BtnStrikeThrough />
                              <Separator />
                              <BtnNumberedList />
                              <BtnBulletList />
                              <Separator />
                              <BtnLink />
                              <BtnClearFormatting />
                              <HtmlButton />
                              <Separator />
                              <BtnStyles />
                            </Toolbar>
                          </Editor>
                        </div>
                      )}
                    />
                  </EditorProvider>
                </div>

                {/* صندوق الرفع */}
                <div className="mt-6">
                  <label className="mb-2 text-[#011957] dark:text-white font-medium block">
                    صور المنتج
                  </label>
                  <div className="relative flex items-center justify-center rounded-md py-16 px-4 border-2 border-dashed border-[#BA6FEE] bg-[#F9F6FF] dark:bg-[#1a1a33]">
                    <div className="text-center">
                      <div className="w-[35px] h-[35px] border border-[#9861FB] flex items-center justify-center rounded-md text-[#6043FD] mb-3">
                        <i className="ri-upload-2-line"></i>
                      </div>
                      <p className="text-[#011957] dark:text-white">
                        <strong>اضغط لرفع</strong> صور المنتج
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        يمكنك رفع صورة جديدة أو إبقاء الصور الحالية
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleImageChange}
                    />
                  </div>

                  {/* المعاينة */}
                  <div className="mt-[10px] flex flex-wrap gap-2">
                    {serverImages.map((imageUrl, index) => (
                      <div key={index} className="relative w-[50px] h-[50px]">
                        <Image
                          src={imageUrl}
                          alt={`server-img-${index}`}
                          width={50}
                          height={50}
                          className="rounded-md object-cover w-full h-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder.png";
                          }}
                        />
                        <button
                          type="button"
                          className="absolute top-[-5px] right-[-5px] bg-red-600 text-white w-[20px] h-[20px] flex items-center justify-center rounded-full text-xs"
                          onClick={() => {
                            const newImages = serverImages.filter(
                              (_, i) => i !== index
                            );
                            setServerImages(newImages);
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {selectedImage && (
                      <div className="relative w-[50px] h-[50px]">
                        <Image
                          src={URL.createObjectURL(selectedImage)}
                          alt="selected-img"
                          width={50}
                          height={50}
                          className="rounded-md object-cover w-full h-full"
                        />
                        <button
                          type="button"
                          className="absolute top-[-5px] right-[-5px] bg-orange-500 text-white w-[20px] h-[20px] flex items-center justify-center rounded-full text-xs"
                          onClick={() => setSelectedImage(null)}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pb-6">
          <button
            type="button"
            onClick={() => router.push("/dashboard/news")}
            className="py-3 px-6 rounded-lg bg-[#E10E0E] text-white font-medium shadow hover:bg-red-600 transition"
          >
            إلغاء
          </button>

          <button
            type="submit"
            disabled={isSubmitting || isUploadingImage}
            className="py-3 px-6 rounded-lg bg-[#6043FD] hover:bg-[#9861FB] text-white font-medium shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploadingImage
              ? "جاري رفع الصورة..."
              : isSubmitting
              ? "جاري الحفظ..."
              : "حفظ التعديلات"}
          </button>
        </div>
      </form>
    </>
  );
}
