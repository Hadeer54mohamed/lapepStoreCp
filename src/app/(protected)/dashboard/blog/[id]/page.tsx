"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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
  getBlogById,
  updateBlog,
  uploadImages,
} from "../../../../../../services/apiBlog";
import { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import Image from "next/image";
import toast from "react-hot-toast";

interface NewsFormData {
  title_ar: string;
  title_en: string;
  yt_code: string;
  content_ar: string;
  content_en: string;
  author?: string;
}

export default function EditNewsPage() {
  const [serverImages, setServerImages] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, reset, control } = useForm({
    defaultValues: {
      title_ar: "",
      title_en: "",
      yt_code: "",
      content_ar: "",
      content_en: "",
      author: "",
    },
  });

  //get id
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  //get categories
  // Remove useCategories and categories fetching

  const { data: blog } = useQuery({
    queryKey: ["blog", id],
    queryFn: () => {
      if (!id) throw new Error("No ID provided");
      return getBlogById(id);
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (blog) {
      reset({
        title_ar: blog.title_ar || "",
        title_en: blog.title_en || "",
        yt_code: blog.yt_code || "",
        content_ar: blog.content_ar || "",
        content_en: blog.content_en || "",
        author: blog.author || "",
      });

      if (blog.images && Array.isArray(blog.images)) {
        setServerImages(blog.images);
      } else {
        setServerImages([]);
      }
      setSelectedImages([]);
    }
  }, [blog, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    setSelectedImages((prev) => [...prev, ...filesArray]);
  };

  const handleRemoveServerImage = (index: number) => {
    setServerImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveSelectedImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const queryClient = useQueryClient();

  const onSubmit: SubmitHandler<NewsFormData> = async (data) => {
    try {
      if (!id) throw new Error("No ID found");

      setIsSubmitting(true);
      let uploadedUrls: string[] = [];

      if (selectedImages && selectedImages.length > 0) {
        setIsUploadingImages(true);
        uploadedUrls = await uploadImages(selectedImages, "blog");
        setIsUploadingImages(false);
      }
      const allImages = [...serverImages, ...uploadedUrls];

      const updatedData = {
        title_ar: data.title_ar,
        title_en: data.title_en,
        yt_code: data.yt_code,
        content_ar: data.content_ar,
        content_en: data.content_en,
        images: allImages,
        author: data.author,
      };

      // تنفيذ التحديث في Supabase
      const updated = await updateBlog(id, updatedData);

      console.log("تم تحديث المقال بنجاح:", updated);

      // يمكنك هنا إعادة التوجيه أو عرض رسالة نجاح
      toast.success("تم تحديث المقال بنجاح");
      queryClient.invalidateQueries({ queryKey: ["blog"] });
      router.push("/dashboard/blog");
    } catch (error: Error | unknown) {
      toast.error("حدث خطأ ما");
      console.log("حدث خطأ أثناء تحديث المقال:", error);
    } finally {
      setIsSubmitting(false);
      setIsUploadingImages(false);
    }
  };

  return (
    <>
    {/* Header */}
    <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
      <h5 className="!mb-0 text-xl font-semibold text-[#011957] dark:text-white">
        تعديل مقال
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
        <li>الأخبار</li>
        <li>/</li>
        <li className="text-gray-500 dark:text-gray-400">تعديل مقال</li>
      </ol>
    </div>
  
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="gap-6">
        <div className="lg:col-span-2">
          <div className="trezo-card bg-[#F7F7F7] dark:bg-[#0c1427] mb-6 p-6 rounded-lg shadow">
            <div className="trezo-card-content">
              {/* Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Author */}
                <div>
                  <label className="mb-2 text-[#011957] dark:text-white font-medium block">
                    اسم الناشر
                  </label>
                  <input
                    type="text"
                    className="h-[55px] rounded-md border border-[#BA6FEE] bg-[#F3EBFF] dark:bg-[#0c1427] px-4 w-full text-[#011957] dark:text-white placeholder-gray-500 focus:border-[#6043FD] focus:ring-2 focus:ring-[#BA6FEE]"
                    {...register("author")}
                  />
                </div>
  
                {/* Title AR */}
                <div>
                  <label className="mb-2 text-[#011957] dark:text-white font-medium block">
                    العنوان (ع)
                  </label>
                  <input
                    type="text"
                    className="h-[55px] rounded-md border border-[#BA6FEE] bg-[#F3EBFF] dark:bg-[#0c1427] px-4 w-full text-[#011957] dark:text-white placeholder-gray-500 focus:border-[#6043FD] focus:ring-2 focus:ring-[#BA6FEE]"
                    {...register("title_ar")}
                  />
                </div>
  
                {/* Title EN */}
                <div>
                  <label className="mb-2 text-[#011957] dark:text-white font-medium block">
                    العنوان (EN)
                  </label>
                  <input
                    type="text"
                    className="h-[55px] rounded-md border border-[#BA6FEE] bg-[#F3EBFF] dark:bg-[#0c1427] px-4 w-full text-[#011957] dark:text-white placeholder-gray-500 focus:border-[#6043FD] focus:ring-2 focus:ring-[#BA6FEE]"
                    {...register("title_en")}
                  />
                </div>
  
                {/* YouTube Code */}
                <div>
                  <label className="mb-2 text-[#011957] dark:text-white font-medium block">
                    كود يوتيوب
                  </label>
                  <input
                    type="text"
                    className="h-[55px] rounded-md border border-[#BA6FEE] bg-[#F3EBFF] dark:bg-[#0c1427] px-4 w-full text-[#011957] dark:text-white placeholder-gray-500 focus:border-[#6043FD] focus:ring-2 focus:ring-[#BA6FEE]"
                    {...register("yt_code")}
                  />
                </div>
              </div>
  
              {/* محتوى بالعربي */}
              <div className="sm:col-span-2 mt-6">
                <label className="mb-2 text-[#011957] dark:text-white font-medium block">
                  محتوى المقال (ع)
                </label>
                <EditorProvider>
                  <Controller
                    control={control}
                    name="content_ar"
                    render={({ field }) => (
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
                    )}
                  />
                </EditorProvider>
              </div>
  
              {/* محتوى بالانجليزية */}
              <div className="sm:col-span-2 mt-6">
                <label className="mb-2 text-[#011957] dark:text-white font-medium block">
                  محتوى المقال (EN)
                </label>
                <EditorProvider>
                  <Controller
                    control={control}
                    name="content_en"
                    render={({ field }) => (
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
                    )}
                  />
                </EditorProvider>
              </div>
  
              {/* رفع الصور */}
              <div className="mt-6">
                <label className="mb-2 text-[#011957] dark:text-white font-medium block">
                  صور المقال
                </label>
                <div className="relative flex items-center justify-center rounded-md py-16 px-4 border-2 border-dashed border-[#BA6FEE] bg-[#F9F6FF] dark:bg-[#1a1a33]">
                  <div className="text-center">
                    <div className="w-[35px] h-[35px] border border-[#9861FB] flex items-center justify-center rounded-md text-[#6043FD] mb-3">
                      <i className="ri-upload-2-line"></i>
                    </div>
                    <p className="text-[#011957] dark:text-white">
                      <strong>اضغط لرفع</strong> صور المقال
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      يمكنك رفع صور جديدة أو إبقاء الصور الحالية
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleImageChange}
                  />
                </div>
  
                {/* المعاينة */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {serverImages.map((url, index) => (
                    <div key={`server-${index}`} className="relative w-[50px] h-[50px]">
                      <Image
                        src={url}
                        alt={`server-img-${index}`}
                        width={50}
                        height={50}
                        className="rounded-md object-cover w-full h-full"
                      />
                      <button
                        type="button"
                        className="absolute top-[-5px] right-[-5px] bg-red-600 text-white w-[20px] h-[20px] flex items-center justify-center rounded-full text-xs"
                        onClick={() => handleRemoveServerImage(index)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
  
                  {selectedImages.map((file, index) => (
                    <div key={`selected-${index}`} className="relative w-[50px] h-[50px]">
                      <Image
                        src={URL.createObjectURL(file)}
                        alt={`selected-img-${index}`}
                        width={50}
                        height={50}
                        className="rounded-md object-cover w-full h-full"
                      />
                      <button
                        type="button"
                        className="absolute top-[-5px] right-[-5px] bg-orange-500 text-white w-[20px] h-[20px] flex items-center justify-center rounded-full text-xs"
                        onClick={() => handleRemoveSelectedImage(index)}
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
      </div>
  
      {/* Buttons */}
      <div className="flex gap-3 pb-6">
        <button
          type="button"
          onClick={() => router.push("/dashboard/blog")}
          className="py-3 px-6 rounded-lg bg-[#E10E0E] text-white font-medium shadow hover:bg-red-600 transition"
        >
          إلغاء
        </button>
  
        <button
          type="submit"
          disabled={isSubmitting || isUploadingImages}
          className="py-3 px-6 rounded-lg bg-[#6043FD] hover:bg-[#9861FB] text-white font-medium shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploadingImages
            ? "جاري رفع الصور..."
            : isSubmitting
            ? "جاري الحفظ..."
            : "حفظ التعديلات"}
        </button>
      </div>
    </form>
  </>
  
  );
}
