"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getTestemonialById,
  updateTestemonial,
  uploadTestimonialImage,
  Testemonial,
} from "../../../../../../services/apiTestemonial";
import toast from "react-hot-toast";
import Image from "next/image";
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

const EditTestimonialPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const [formData, setFormData] = useState({
    name_ar: "",
    name_en: "",
    message_ar: "",
    message_en: "",
    image: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  // Fetch testimonial data
  const { data: testimonial, isLoading } = useQuery({
    queryKey: ["testimonial", id],
    queryFn: () => getTestemonialById(id),
    enabled: !!id,
  });

  // Update form data when testimonial is loaded
  useEffect(() => {
    if (testimonial) {
      setFormData({
        name_ar: testimonial.name_ar || "",
        name_en: testimonial.name_en || "",
        message_ar: testimonial.message_ar || "",
        message_en: testimonial.message_en || "",
        image: testimonial.image || "",
      });
      if (testimonial.image) {
        setImagePreview(testimonial.image);
      }
    }
  }, [testimonial]);

  const { mutate, isPending } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Testemonial> }) =>
      updateTestemonial(id, data),
    onSuccess: () => {
      toast.success("تم تحديث التوصية بنجاح");
      queryClient.invalidateQueries({ queryKey: ["testimonial"] });
      router.push("/dashboard/testimonial");
    },
    onError: (err) => {
      toast.error("حدث خطأ أثناء تحديث التوصية");
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
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

    try {
      setIsUploading(true);
      let imageUrl = formData.image;

      if (imageFile) {
        imageUrl = await uploadTestimonialImage(imageFile);
      }

      const testimonialData = {
        ...formData,
        image: imageUrl,
      };

      mutate({ id, data: testimonialData });
    } catch (error) {
      toast.error("حدث خطأ أثناء رفع الصورة");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <>
    {/* Header */}
    <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
      <h5 className="!mb-0 text-xl font-semibold text-[#011957] dark:text-white">
        تعديل التوصية
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
        <li>
          <Link
            href="/dashboard/testimonial"
            className="text-[#6043FD] hover:text-[#9861FB] transition"
          >
            التوصيات
          </Link>
        </li>
        <li>/</li>
        <li className="text-gray-500 dark:text-gray-400">تعديل التوصية</li>
      </ol>
    </div>
  
    {/* Card */}
    <div className="trezo-card bg-[#F7F7F7] dark:bg-[#0c1427] mb-6 p-6 rounded-lg shadow">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload */}
        <div>
          <label className="mb-2 text-[#011957] dark:text-white font-medium block">
            صورة التوصية
          </label>
          <div className="relative flex items-center justify-center rounded-md py-10 px-4 border-2 border-dashed border-[#BA6FEE] bg-[#F9F6FF] dark:bg-[#1a1a33]">
            <div className="text-center">
              <div className="w-[35px] h-[35px] border border-[#9861FB] flex items-center justify-center rounded-md text-[#6043FD] mb-3">
                <i className="ri-upload-2-line"></i>
              </div>
              <p className="text-[#011957] dark:text-white">
                <strong>اضغط لرفع</strong> صورة التوصية
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                يمكنك رفع صورة جديدة أو إبقاء الصورة الحالية
              </p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
  
          {imagePreview && (
            <div className="mt-3 relative w-[100px] h-[100px]">
              <Image
                src={imagePreview}
                alt="Preview"
                width={100}
                height={100}
                className="rounded-md object-cover w-full h-full"
              />
              <button
                type="button"
                onClick={() => {
                  setImagePreview("");
                  setImageFile(null);
                  setFormData((prev) => ({ ...prev, image: "" }));
                }}
                className="absolute top-[-8px] right-[-8px] bg-red-600 text-white w-[22px] h-[22px] flex items-center justify-center rounded-full text-xs"
              >
                ✕
              </button>
            </div>
          )}
        </div>
  
        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="mb-2 text-[#011957] dark:text-white font-medium block">
              الاسم (عربي) *
            </label>
            <input
              type="text"
              name="name_ar"
              value={formData.name_ar}
              onChange={handleInputChange}
              className="h-[55px] rounded-md border border-[#BA6FEE] bg-[#F3EBFF] dark:bg-[#0c1427] px-4 w-full text-[#011957] dark:text-white placeholder-gray-500 focus:border-[#6043FD] focus:ring-2 focus:ring-[#BA6FEE]"
              placeholder="أدخل الاسم بالعربية"
              required
            />
          </div>
  
          <div>
            <label className="mb-2 text-[#011957] dark:text-white font-medium block">
              الاسم (EN) *
            </label>
            <input
              type="text"
              name="name_en"
              value={formData.name_en}
              onChange={handleInputChange}
              className="h-[55px] rounded-md border border-[#BA6FEE] bg-[#F3EBFF] dark:bg-[#0c1427] px-4 w-full text-[#011957] dark:text-white placeholder-gray-500 focus:border-[#6043FD] focus:ring-2 focus:ring-[#BA6FEE]"
              placeholder="Enter name in English"
              required
            />
          </div>
        </div>
  
        {/* Message Fields */}
        <div>
          <label className="mb-2 text-[#011957] dark:text-white font-medium block">
            التوصية (ع) *
          </label>
          <EditorProvider>
            <Editor
              style={{ minHeight: "200px" }}
              value={formData.message_ar}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, message_ar: e.target.value }))
              }
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
          </EditorProvider>
        </div>
  
        <div>
          <label className="mb-2 text-[#011957] dark:text-white font-medium block">
            التوصية (EN) *
          </label>
          <EditorProvider>
            <Editor
              style={{ minHeight: "200px" }}
              value={formData.message_en}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, message_en: e.target.value }))
              }
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
          </EditorProvider>
        </div>
  
        {/* Buttons */}
        <div className="flex gap-3 pb-6">
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
            className="py-3 px-6 rounded-lg bg-[#6043FD] hover:bg-[#9861FB] text-white font-medium shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending || isUploading ? "جاري الحفظ..." : "حفظ التغييرات"}
          </button>
        </div>
      </form>
    </div>
  </>
  
  );
};

export default EditTestimonialPage;
