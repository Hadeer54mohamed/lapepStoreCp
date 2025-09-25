"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreateTestemonial,
  uploadTestimonialImage,
} from "../../../../../../services/apiTestemonial";
import toast from "react-hot-toast";
import Image from "next/image";
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

const CreateTestimonialPage: React.FC = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name_ar: "",
    name_en: "",
    message_ar: "",
    message_en: "",
    image: "",
  });

  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: CreateTestemonial,
    onSuccess: () => {
      toast.success("تم إنشاء التوصية بنجاح");
      queryClient.invalidateQueries({ queryKey: ["testimonial"] });
      router.push("/dashboard/testimonial");
    },
    onError: (err) => {
      toast.error("حدث خطأ أثناء إنشاء التوصية");
      console.error(err);
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name_ar ||
      !formData.name_en ||
      !formData.message_ar ||
      !formData.message_en
    ) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    // تحقق من وجود صور
    if (selectedImages.length === 0) {
      toast.error("يجب إضافة صورة واحدة على الأقل");
      return;
    }

    try {
      setIsUploading(true);
      let imageUrl = "";

      if (selectedImages.length > 0) {
        // رفع الصورة الأولى فقط للتوصية
        imageUrl = await uploadTestimonialImage(selectedImages[0]);
      }

      const testimonialData = {
        ...formData,
        image: imageUrl,
      };

      mutate(testimonialData);
    } catch (error) {
      toast.error("حدث خطأ أثناء رفع الصورة");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
    {/* ===== Header + Breadcrumb ===== */}
    <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
      <h5 className="!mb-0 text-xl font-semibold text-[#011957] dark:text-white">
        إنشاء توصية جديدة
      </h5>
  
      <ol className="breadcrumb flex gap-2 mt-2 md:mt-0 text-sm text-gray-600 dark:text-gray-300 rtl:flex-row-reverse">
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
        <li className="text-gray-500 dark:text-gray-400">إنشاء توصية جديدة</li>
      </ol>
    </div>
  
    {/* ===== Form ===== */}
    <div className="trezo-card bg-[#F7F7F7] dark:bg-[#0c1427] mb-6 p-6 rounded-lg shadow">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload */}
        <div>
          <label className="mb-2 block text-[#011957] dark:text-white font-medium">
            صور التوصية
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
  
          {/* Image Previews */}
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedImages.map((image, index) => (
              <div key={index} className="relative w-[55px] h-[55px]">
                <Image
                  src={URL.createObjectURL(image)}
                  alt="testimonial-preview"
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
  
        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="mb-2 block text-[#011957] dark:text-white font-medium">
              الاسم (عربي) *
            </label>
            <input
              type="text"
              name="name_ar"
              value={formData.name_ar}
              onChange={handleInputChange}
              className="h-[55px] w-full rounded-md text-[#011957] dark:text-white border border-[#BA6FEE] bg-white dark:bg-[#0c1427] px-4 outline-0 transition placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#6043FD] focus:ring-2 focus:ring-[#BA6FEE]"
              placeholder="أدخل الاسم باللغة العربية"
              required
            />
          </div>
  
          <div>
            <label className="mb-2 block text-[#011957] dark:text-white font-medium">
              الاسم (إنجليزي) *
            </label>
            <input
              type="text"
              name="name_en"
              value={formData.name_en}
              onChange={handleInputChange}
              className="h-[55px] w-full rounded-md text-[#011957] dark:text-white border border-[#BA6FEE] bg-white dark:bg-[#0c1427] px-4 outline-0 transition placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#6043FD] focus:ring-2 focus:ring-[#BA6FEE]"
              placeholder="Enter name in English"
              required
            />
          </div>
        </div>
  
        {/* Message Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="sm:col-span-2">
            <label className="mb-2 block text-[#011957] dark:text-white font-medium">
              التوصية (بالعربي) *
            </label>
            <EditorProvider>
              <Editor
                value={formData.message_ar}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, message_ar: e.target.value }))
                }
                containerProps={{
                  style: {
                    borderColor: "#BA6FEE",
                    background: "#F9F6FF",
                    color: "#011957",
                    minHeight: "200px",
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
                  <BtnUndo />
                  <BtnRedo />
                  <Separator />
                  <BtnClearFormatting />
                  <HtmlButton />
                  <BtnStyles />
                </Toolbar>
              </Editor>
            </EditorProvider>
          </div>
  
          <div className="sm:col-span-2">
            <label className="mb-2 block text-[#011957] dark:text-white font-medium">
              التوصية (بالإنجليزية) *
            </label>
            <EditorProvider>
              <Editor
                value={formData.message_en}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, message_en: e.target.value }))
                }
                containerProps={{
                  style: {
                    borderColor: "#BA6FEE",
                    background: "#F9F6FF",
                    color: "#011957",
                    minHeight: "200px",
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
                  <BtnUndo />
                  <BtnRedo />
                  <Separator />
                  <BtnClearFormatting />
                  <HtmlButton />
                  <BtnStyles />
                </Toolbar>
              </Editor>
            </EditorProvider>
          </div>
        </div>
  
        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard/testimonial")}
            className="py-3 px-6 rounded-lg bg-[#E10E0E] text-white font-medium shadow hover:bg-red-600 transition"
          >
            إلغاء
          </button>
  
          <button
            type="submit"
            disabled={isPending || isUploading}
            className="py-3 px-6 rounded-lg bg-gradient-to-r from-[#6043FD] to-[#9861FB] text-white font-medium shadow hover:from-[#5033e0] hover:to-[#8750e0] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending || isUploading ? "جاري الحفظ..." : "حفظ التوصية"}
          </button>
        </div>
      </form>
    </div>
  </>
  
  );
};

export default CreateTestimonialPage;
