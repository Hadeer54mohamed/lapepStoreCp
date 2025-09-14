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
      <div className="mb-[25px] md:flex items-center justify-between">
        <h5 className="!mb-0">إنشاء توصية جديدة</h5>

        <ol className="breadcrumb mt-[12px] md:mt-0 rtl:flex-row-reverse">
          <li className="breadcrumb-item inline-block relative text-sm mx-[11px] ltr:first:ml-0 rtl:first:mr-0 ltr:last:mr-0 rtl:last:ml-0">
            <a
              href="/dashboard"
              className="inline-block relative ltr:pl-[22px] rtl:pr-[22px] transition-all hover:text-primary-500"
            >
              <i className="material-symbols-outlined absolute ltr:left-0 rtl:right-0 !text-lg -mt-px text-primary-500 top-1/2 -translate-y-1/2">
                home
              </i>
              رئيسية
            </a>
          </li>
          <li className="breadcrumb-item inline-block relative text-sm mx-[11px] ltr:first:ml-0 rtl:first:mr-0 ltr:last:mr-0 rtl:last:ml-0">
            <Link
              href="/dashboard/testimonial"
              className="inline-block relative ltr:pl-[22px] rtl:pr-[22px] transition-all hover:text-primary-500"
            >
              التوصيات
            </Link>
          </li>
          <li className="breadcrumb-item inline-block relative text-sm mx-[11px] ltr:first:ml-0 rtl:first:mr-0 ltr:last:mr-0 rtl:last:ml-0">
            إنشاء توصية جديدة
          </li>
        </ol>
      </div>

      <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-4">
            <label className="mb-[10px] text-black dark:text-white font-medium block">
              صور التوصية
            </label>

            <div id="fileUploader">
              <div className="relative flex items-center justify-center overflow-hidden rounded-md py-[88px] px-[20px] border border-gray-200 dark:border-[#172036]">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-[35px] h-[35px] border border-gray-100 dark:border-[#15203c] flex items-center justify-center rounded-md text-primary-500 text-lg mb-3">
                    <i className="ri-upload-2-line"></i>
                  </div>
                  <p className="leading-[1.5] mb-2">
                    <strong className="text-black dark:text-white">
                      اضغط لرفع
                    </strong>
                    <br /> الصور من هنا
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    الحد الأقصى: 5 صور
                    <br />
                    حجم الصورة: حتى 50 ميجابايت
                  </p>
                </div>

                <input
                  type="file"
                  id="images"
                  multiple
                  accept="image/*"
                  className="absolute top-0 left-0 right-0 bottom-0 rounded-md z-[1] opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                />
              </div>

              {/* Image Previews */}
              <div className="mt-[10px] flex flex-wrap gap-2">
                {selectedImages.map((image, index) => (
                  <div key={index} className="relative w-[50px] h-[50px]">
                    <Image
                      src={URL.createObjectURL(image)}
                      alt="testimonial-preview"
                      width={50}
                      height={50}
                      className="rounded-md"
                    />
                    <button
                      type="button"
                      className="absolute top-[-5px] right-[-5px] bg-orange-500 text-white w-[20px] h-[20px] flex items-center justify-center rounded-full text-xs rtl:right-auto rtl:left-[-5px]"
                      onClick={() => handleRemoveImage(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="mb-[10px] text-black dark:text-white font-medium block">
                الاسم (عربي) *
              </label>
              <input
                type="text"
                name="name_ar"
                value={formData.name_ar}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                placeholder="أدخل الاسم باللغة العربية"
                required
              />
            </div>

            <div>
              <label className="mb-[10px] text-black dark:text-white font-medium block">
                الاسم (إنجليزي) *
              </label>
              <input
                type="text"
                name="name_en"
                value={formData.name_en}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                placeholder="Enter name in English"
                required
              />
            </div>
          </div>

          {/* Message Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="sm:col-span-2 mb-[20px] sm:mb-0">
              <label className="mb-[10px] text-black dark:text-white font-medium block">
                التوصية (بالعربي) *
              </label>
              <EditorProvider>
                <Editor
                  value={formData.message_ar}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      message_ar: e.target.value,
                    }));
                  }}
                  style={{ minHeight: "200px" }}
                  className="rsw-editor"
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
              </EditorProvider>
            </div>

            <div className="sm:col-span-2 mb-[20px] sm:mb-0">
              <label className="mb-[10px] text-black dark:text-white font-medium block">
                التوصية (بالانجليزي) *
              </label>
              <EditorProvider>
                <Editor
                  value={formData.message_en}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      message_en: e.target.value,
                    }));
                  }}
                  style={{ minHeight: "200px" }}
                  className="rsw-editor"
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
              </EditorProvider>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 rtl:space-x-reverse">
            <button
              type="button"
              onClick={() => router.push("/dashboard/testimonial")}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isPending || isUploading}
              className="px-6 py-2 mr-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
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
