"use client";

import { useState } from "react";

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
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import Image from "next/image";
import Link from "next/link";
import { Createblog, uploadImages } from "../../../../../../services/apiBlog";

type NewsFormValues = {
  title_ar: string;
  title_en: string;
  yt_code?: string;
  content_ar: string;
  content_en: string;
  images: File[];
  user_id?: string;
  author?: string;
};

const CreateNewsForm: React.FC = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Text Editor
  const [editorAr, setEditorAr] = useState("اكتب الخبر بالعربية...");
  const [editorEn, setEditorEn] = useState("Write the news in English...");

  const { register, handleSubmit, setValue, formState } =
    useForm<NewsFormValues>();

  const { errors } = formState;

  const { mutate, isPending } = useMutation({
    mutationFn: Createblog,
    onSuccess: () => {
      toast.success("تم نشر المقال بنجاح");
      queryClient.invalidateQueries({ queryKey: ["blog"] });
      router.push("/dashboard/blog");
    },
    onError: (error) => toast.error("حدث خطأ ما" + error.message),
  });

  // Upload images
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);

      // التحقق من عدد الصور
      if (selectedImages.length + filesArray.length > 5) {
        toast.error("يمكنك رفع 5 صور كحد أقصى");
        return;
      }

      // التحقق من نوع وحجم الصور
      const validFiles = filesArray.filter((file) => {
        // التحقق من نوع الملف
        if (!file.type.startsWith("image/")) {
          toast.error(`الملف ${file.name} ليس صورة`);
          return false;
        }

        // التحقق من حجم الملف (50MB كحد أقصى)
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`حجم الصورة ${file.name} يجب أن لا يتجاوز 50MB`);
          return false;
        }

        return true;
      });

      setSelectedImages((prevImages) => [...prevImages, ...validFiles]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: NewsFormValues) => {
    // تحقق من وجود صور
    if (selectedImages.length === 0) {
      toast.error("يجب إضافة صورة واحدة على الأقل");
      return;
    }
    try {
      setIsUploadingImages(true);
      // ارفع الصور أولاً
      const uploadedImageUrls = await uploadImages(selectedImages);

      if (uploadedImageUrls.length === 0) {
        toast.error("فشل في رفع جميع الصور");
        return;
      }

      const finalData = {
        title_ar: data.title_ar,
        title_en: data.title_en,
        yt_code: data.yt_code,
        content_ar: data.content_ar,
        content_en: data.content_en,
        images: uploadedImageUrls,
        author: data.author,
      };
      mutate(finalData);
    } catch (error: Error | unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "حدث خطأ أثناء رفع الصور";
      toast.error(errorMessage);
      console.error("Image upload error:", error);
    } finally {
      setIsUploadingImages(false);
    }
  };

  return (
    <>
    {/* ===== Header + Breadcrumb ===== */}
    <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
      <h5 className="!mb-0 text-xl font-semibold text-[#011957] dark:text-white">
        إنشاء مقال
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
        <li className="text-gray-500 dark:text-gray-400">المقالات</li>
        <li className="text-gray-500 dark:text-gray-400">إنشاء مقال</li>
      </ol>
    </div>
  
    {/* ===== Form ===== */}
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="gap-6">
        <div className="lg:col-span-2">
          <div className="trezo-card bg-[#F7F7F7] dark:bg-[#0c1427] mb-6 p-6 rounded-lg shadow">
            <div className="trezo-card-header mb-6 flex items-center justify-between">
              <h5 className="!mb-0 text-lg font-semibold text-[#011957] dark:text-white">
                أضف مقال
              </h5>
            </div>
  
            {/* Inputs */}
            <div className="sm:grid sm:grid-cols-2 sm:gap-[25px]">
              {/* Title Arabic */}
              <div className="mb-[20px] sm:mb-0">
                <label className="mb-[10px] block text-[#011957] dark:text-white font-medium">
                  عنوان المقال (بالعربي)
                </label>
                <input
                  type="text"
                  className="h-[55px] rounded-md text-[#011957] dark:text-white border border-[#BA6FEE] bg-white dark:bg-[#0c1427] px-[17px] w-full outline-0 transition placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#6043FD] focus:ring-2 focus:ring-[#BA6FEE]"
                  placeholder="يجب ألا يزيد عن 100 حرف"
                  id="title_ar"
                  {...register("title_ar", {
                    required: "يجب إدخال عنوان المقال",
                    max: { value: 100, message: "يجب ألا يزيد عن 100 حرف" },
                  })}
                />
                {errors?.title_ar?.message && (
                  <span className="text-[#E10E0E] text-sm">
                    {errors.title_ar.message}
                  </span>
                )}
              </div>
  
              {/* Title English */}
              <div className="mb-[20px] sm:mb-0">
                <label className="mb-[10px] block text-[#011957] dark:text-white font-medium">
                  عنوان المقال (بالإنجليزية)
                </label>
                <input
                  type="text"
                  className="h-[55px] rounded-md text-[#011957] dark:text-white border border-[#BA6FEE] bg-white dark:bg-[#0c1427] px-[17px] w-full outline-0 transition placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#6043FD] focus:ring-2 focus:ring-[#BA6FEE]"
                  placeholder="Max 100 characters"
                  id="title_en"
                  {...register("title_en", {
                    required: "Title is required",
                    max: { value: 100, message: "Must not exceed 100 characters" },
                  })}
                />
                {errors?.title_en?.message && (
                  <span className="text-[#E10E0E] text-sm">
                    {errors.title_en.message}
                  </span>
                )}
              </div>
  
              {/* Content Arabic */}
              <div className="sm:col-span-2 mb-[20px] sm:mb-0">
                <label className="mb-[10px] block text-[#011957] dark:text-white font-medium">
                  المقال (بالعربي)
                </label>
                <EditorProvider>
                  <Editor
                    value={editorAr}
                    onChange={(e) => {
                      setEditorAr(e.target.value);
                      setValue("content_ar", e.target.value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    containerProps={{
                      style: {
                        borderColor: "#BA6FEE",
                        background: "#F9F6FF",
                        color: "#011957",
                      },
                    }}
                  >
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
                  </Editor>
                </EditorProvider>
              </div>
  
              {/* Content English */}
              <div className="sm:col-span-2 mb-[20px] sm:mb-0">
                <label className="mb-[10px] block text-[#011957] dark:text-white font-medium">
                  المقال (بالإنجليزية)
                </label>
                <EditorProvider>
                  <Editor
                    value={editorEn}
                    onChange={(e) => {
                      setEditorEn(e.target.value);
                      setValue("content_en", e.target.value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    containerProps={{
                      style: {
                        borderColor: "#BA6FEE",
                        background: "#F9F6FF",
                        color: "#011957",
                      },
                    }}
                  >
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
                  </Editor>
                </EditorProvider>
              </div>
  
              {/* YouTube Code */}
              <div className="mb-[20px] sm:mb-0">
                <label className="mb-[10px] block text-[#011957] dark:text-white font-medium">
                  لإضافة مقطع من اليوتيوب
                </label>
                <input
                  type="text"
                  className="h-[55px] rounded-md text-[#011957] dark:text-white border border-[#BA6FEE] bg-white dark:bg-[#0c1427] px-[17px] w-full outline-0 transition placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#6043FD] focus:ring-2 focus:ring-[#BA6FEE]"
                  placeholder="th0VZq9lNhR"
                  id="yt_code"
                  {...register("yt_code")}
                />
              </div>
  
              {/* Author */}
              <div className="mb-[20px] sm:mb-0">
                <label className="mb-[10px] block text-[#011957] dark:text-white font-medium">
                  اسم الناشر
                </label>
                <input
                  type="text"
                  className="h-[55px] rounded-md text-[#011957] dark:text-white border border-[#BA6FEE] bg-white dark:bg-[#0c1427] px-[17px] w-full outline-0 transition placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#6043FD] focus:ring-2 focus:ring-[#BA6FEE]"
                  placeholder="اسم الناشر"
                  id="author"
                  {...register("author", {
                    required: "يجب إدخال اسم الناشر",
                    maxLength: {
                      value: 50,
                      message: "يجب ألا يزيد عن 50 حرف",
                    },
                  })}
                />
                {errors?.author?.message && (
                  <span className="text-[#E10E0E] text-sm">
                    {errors.author.message}
                  </span>
                )}
              </div>
  
              {/* Images Upload */}
              <div className="sm:col-span-2 mb-[20px] sm:mb-0">
                <label className="mb-[10px] block text-[#011957] dark:text-white font-medium">
                  الصور الخاصة بالمقال
                </label>
                <div className="relative flex flex-col items-center justify-center rounded-md py-10 px-4 border-2 border-dashed border-[#BA6FEE] bg-[#F9F6FF] dark:bg-[#1a1a33]">
                  <div className="text-center">
                    <div className="w-[40px] h-[40px] flex items-center justify-center rounded-md bg-[#6043FD]/10 text-[#6043FD] mb-3">
                      <i className="ri-upload-2-line text-xl"></i>
                    </div>
                    <p className="text-[#011957] dark:text-white">
                      <strong>اضغط لرفع</strong> الصور من هنا
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      الحد الأقصى: 5 صور | حجم الصورة: حتى 50 ميجابايت
                    </p>
                  </div>
                  <input
                    type="file"
                    id="images"
                    multiple
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                  />
                </div>
  
                {/* Preview */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedImages.map((image, index) => (
                    <div key={index} className="relative w-[55px] h-[55px]">
                      <Image
                        src={URL.createObjectURL(image)}
                        alt="preview"
                        width={55}
                        height={55}
                        className="rounded-md object-cover"
                      />
                      <button
                        type="button"
                        className="absolute top-[-6px] right-[-6px] bg-red-500 text-white w-[20px] h-[20px] flex items-center justify-center rounded-full text-xs"
                        onClick={() => handleRemoveImage(index)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
  
        {/* ===== Actions ===== */}
        <div className="trezo-card mb-[25px]">
          <div className="trezo-card-content flex gap-3">
            <button
            onClick={() => router.push("/dashboard/blog")}
            className="py-3 px-6 rounded-lg bg-[#E10E0E] text-white font-medium shadow hover:bg-red-600 transition"
            >
              إلغاء
            </button>
  
            <button
              type="submit"
              disabled={isPending || isUploadingImages}
              className="py-3 px-6 rounded-lg bg-gradient-to-r from-[#6043FD] to-[#9861FB] text-white font-medium shadow hover:from-[#5033e0] hover:to-[#8750e0] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploadingImages
                ? "جاري رفع الصور..."
                : isPending
                ? "جاري الإنشاء..."
                : "إنشاء مقال"}
            </button>
          </div>
        </div>
      </div>
    </form>
  </>
  
  );
};

export default CreateNewsForm;
