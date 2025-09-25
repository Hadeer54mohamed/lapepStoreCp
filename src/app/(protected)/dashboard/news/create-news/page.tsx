"use client";

import { useState } from "react";

import {
  Editor,
  EditorProvider,
  BtnBold,
  BtnBulletList,
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
import { useCategories } from "@/components/news/categories/useCategories";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createProduct,
  uploadProductImage,
  Product,
} from "../../../../../../services/apiProducts";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { UUID } from "crypto";

import Link from "next/link";

type ProductFormValues = {
  title: string; // Required field
  name_ar?: string;
  name_en?: string;
  category_id: UUID;
  description_ar: string;
  description_en?: string;
  price: number;
  offer_price?: number;
  stock_quantity: number;
  is_best_seller: boolean;
  limited_time_offer: boolean;
  images: File[];
};

const CreateProductForm: React.FC = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  //get categories
  const { data: categories } = useCategories();

  // Text Editor
  const [editorAr, setEditorAr] = useState("اكتب وصف المنتج بالعربية...");
  const [editorEn, setEditorEn] = useState(
    "Write the product description in English..."
  );

  const { register, handleSubmit, setValue, formState } =
    useForm<ProductFormValues>({
      defaultValues: {
        title: "",
        name_ar: "",
        name_en: "",
        description_ar: "",
        description_en: "",
        price: 0,
        stock_quantity: 0,
        is_best_seller: false,
        limited_time_offer: false,
        images: [],
      },
    });

  const { errors } = formState;

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setValue("category_id", selectedId as UUID);
  };

  const { mutate, isPending } = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      toast.success("تم إنشاء المنتج بنجاح");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      router.push("/dashboard/news");
    },
    onError: (error) => toast.error("حدث خطأ ما" + error.message),
  });

  // Upload multiple images
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const validFiles: File[] = [];
      const maxFiles = 5; // حد أقصى 10 صور
      const maxSize = 50 * 1024 * 1024; // 50MB

      if (selectedImages.length + files.length > maxFiles) {
        toast.error(`يمكنك رفع ${maxFiles} صور كحد أقصى`);
        return;
      }

      files.forEach((file) => {
        // التحقق من نوع الملف
        if (!file.type.startsWith("image/")) {
          toast.error(`الملف ${file.name} ليس صورة`);
          return;
        }

        // التحقق من حجم الملف
        if (file.size > maxSize) {
          toast.error(`حجم الصورة ${file.name} يجب أن لا يتجاوز 50MB`);
          return;
        }

        validFiles.push(file);
      });

      if (validFiles.length > 0) {
        const newImages = [...selectedImages, ...validFiles];
        setSelectedImages(newImages);
        setValue("images", newImages);
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setValue("images", newImages);
  };

  const handleRemoveAllImages = () => {
    setSelectedImages([]);
    setValue("images", []);
  };

  const onSubmit = async (data: ProductFormValues) => {
    // تحقق من وجود title (مطلوب)
    if (!data.title || data.title.trim() === "") {
      toast.error("يجب إدخال عنوان المنتج");
      return;
    }

    // تحقق أن category_id موجود وصحيح
    if (!data.category_id || data.category_id.trim() === "") {
      toast.error("الرجاء اختيار التصنيف");
      return;
    }

    // تحقق من وجود صور
    if (selectedImages.length === 0) {
      toast.error("يجب إضافة صورة واحدة على الأقل");
      return;
    }

    try {
      setIsUploadingImages(true);

      // ارفع جميع الصور
      const uploadPromises = selectedImages.map((image) =>
        uploadProductImage(image)
      );
      const uploadedImageUrls = await Promise.all(uploadPromises);

      const finalData: Product = {
        title: data.title || data.name_ar || data.name_en || "منتج جديد",
        name_ar: data.name_ar,
        name_en: data.name_en,
        description_ar:
          editorAr && editorAr !== "اكتب وصف المنتج بالعربية..."
            ? editorAr
            : data.description_ar || undefined,
        description_en:
          editorEn && editorEn !== "Write the product description in English..."
            ? editorEn
            : data.description_en || undefined,
        category_id: data.category_id,
        price: Number(data.price), // Convert to number
        offer_price:
          data.offer_price && Number(data.offer_price) > 0
            ? Number(data.offer_price)
            : undefined,
        stock_quantity: Number(data.stock_quantity), // Convert to number
        is_best_seller: data.is_best_seller,
        limited_time_offer: data.limited_time_offer,
        images: uploadedImageUrls,
      };

      mutate(finalData);
    } catch (error: Error | unknown) {
      toast.error("حدث خطأ أثناء رفع الصور");
      console.error("Image upload error:", error);
    } finally {
      setIsUploadingImages(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <h5 className="!mb-0 text-xl font-semibold text-[#011957] dark:text-white">
          انشاء منتج
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
          <li className="text-gray-500 dark:text-gray-400">انشاء منتج</li>
        </ol>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="gap-6">
          <div className="lg:col-span-2">
            <div className="trezo-card bg-[#F7F7F7] dark:bg-[#0c1427] mb-6 p-6 rounded-lg shadow">
              <div className="trezo-card-header mb-6 flex items-center justify-between">
                <h5 className="!mb-0 text-lg font-semibold text-[#011957] dark:text-white">
                  أضف منتج
                </h5>
              </div>

              <div className="trezo-card-content">
                {/* Title Field */}
                <div className="mb-6">
                  <label className="mb-2 text-[#011957] dark:text-white font-medium block">
                    عنوان المنتج الرئيسي{" "}
                    <span className="text-[#E10E0E]">*</span>
                  </label>
                  <input
                    type="text"
                    className="h-[55px] rounded-md border border-[#BA6FEE] bg-white dark:bg-[#0c1427] px-4 w-full text-[#011957] dark:text-white placeholder-gray-500 focus:border-[#6043FD] focus:ring-2 focus:ring-[#BA6FEE]"
                    placeholder="عنوان المنتج الرئيسي (مطلوب)"
                    id="title"
                    {...register("title", {
                      required: "يجب إدخال عنوان المنتج",
                      maxLength: { value: 200, message: "الحد الأقصى 200 حرف" },
                    })}
                  />
                  {errors?.title?.message && (
                    <span className="text-[#E10E0E] text-sm">
                      {errors.title.message}
                    </span>
                  )}
                </div>

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
                  <div>
                    <label className="mb-2 text-[#011957] dark:text-white font-medium block">
                      التصنيف
                    </label>
                    <select
                      className="h-[55px] rounded-md border border-[#BA6FEE] bg-[#F3EBFF] dark:bg-[#0c1427] px-4 w-full text-[#011957] dark:text-white focus:border-[#6043FD] focus:ring-2 focus:ring-[#BA6FEE]"
                      {...register("category_id")}
                      onChange={handleCategoryChange}
                    >
                      <option value="">اختر التصنيف</option>
                      {categories?.map((cat) => (
                        <option key={cat.id} value={cat.id.toString()}>
                          {cat.name_ar}
                        </option>
                      ))}
                    </select>
                  </div>

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

                {/* Description - AR */}
                <div className="mt-6">
                  <label className="mb-2 text-[#011957] dark:text-white font-medium block">
                    وصف المنتج (بالعربية)
                  </label>
                  <EditorProvider>
                    <Toolbar>
                      <BtnBold />
                      <BtnItalic />
                      <BtnUnderline />
                      <BtnStrikeThrough />
                      <Separator />
                      <BtnBulletList />
                      <BtnNumberedList />
                      <Separator />
                      <BtnLink />
                      <Separator />
                      <BtnUndo />
                      <BtnRedo />
                      <Separator />
                      <BtnStyles />
                      <HtmlButton />
                    </Toolbar>
                    <Editor
                      value={editorAr}
                      onChange={(e) => setEditorAr(e.target.value)}
                      containerProps={{
                        style: {
                          borderColor: "#BA6FEE",
                          background: "#F9F6FF",
                          color: "#011957",
                        },
                      }}
                    />
                  </EditorProvider>
                </div>

                {/* Description - EN */}
                <div className="mt-6">
                  <label className="mb-2 text-[#011957] dark:text-white font-medium block">
                    Product Description (English)
                  </label>
                  <EditorProvider>
                    <Toolbar>
                      <BtnBold />
                      <BtnItalic />
                      <BtnUnderline />
                      <BtnStrikeThrough />
                      <Separator />
                      <BtnBulletList />
                      <BtnNumberedList />
                      <Separator />
                      <BtnLink />
                      <Separator />
                      <BtnUndo />
                      <BtnRedo />
                      <Separator />
                      <BtnStyles />
                      <HtmlButton />
                    </Toolbar>
                    <Editor
                      value={editorEn}
                      onChange={(e) => setEditorEn(e.target.value)}
                      containerProps={{
                        style: {
                          borderColor: "#BA6FEE",
                          background: "#F9F6FF",
                          color: "#011957",
                        },
                      }}
                    />
                  </EditorProvider>
                </div>

                {/* Upload Box */}
                <div className="mt-6">
                  <label className="mb-2 text-[#011957] dark:text-white font-medium block">
                    صور المنتج
                  </label>
                  <div className="relative flex items-center justify-center rounded-md py-16 px-4 border-2 border-dashed border-[#BA6FEE] bg-[#F9F6FF] dark:bg-[#1a1a33]">
                    <div className="text-center">
                      <div className="w-[35px] h-[35px] border border-gray-100 dark:border-[#15203c] flex items-center justify-center rounded-md text-primary-500 text-lg ltr:mr-[12px] rtl:ml-[12px]">
                        <i className="ri-upload-2-line"></i>
                      </div>
                      <p className="text-[#011957] dark:text-white">
                        <strong>اضغط لرفع</strong> صور المنتج
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        يمكنك رفع حتى 5 صور (50MB لكل صورة)
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                    />
                  </div>

                  {/* Show selected images */}
                  {selectedImages.length > 0 && (
                    <div className="mt-4 space-y-4">
                      {/* الصور */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedImages.map((file, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`صورة ${index + 1}`}
                              className="w-full h-32 object-cover rounded-md border"
                            />
                            {/* Remove single image */}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded opacity-90 group-hover:opacity-100"
                            >
                              حذف
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* أزرار التحكم */}
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={handleRemoveAllImages}
                          className="bg-gray-200 hover:bg-gray-300 text-sm px-3 py-1 rounded"
                        >
                          حذف كل الصور
                        </button>
                      </div>
                    </div>
                  )}
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
            disabled={isPending || isUploadingImages}
            className="py-3 px-6 rounded-lg bg-[#6043FD] hover:bg-[#9861FB] text-white font-medium shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending || isUploadingImages ? "جاري المعالجة..." : "إنشاء منتج"}
          </button>
        </div>
      </form>
    </>
  );
};

export default CreateProductForm;
