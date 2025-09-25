"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useBanners,
  useCreateBanner,
  useUploadBannerImage,
} from "../../../../../hooks/useBanners";
import { CreateBannerData } from "../../../../../../services/apiBanners";
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

export default function CreateBannerPage() {
  const router = useRouter();
  const { data: banners = [] } = useBanners();
  const createBannerMutation = useCreateBanner();
  const uploadImageMutation = useUploadBannerImage();

  const [formData] = useState<CreateBannerData>({
    desc_ar: "",
    desc_en: "",
    image: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Text Editor states
  const [editorAr, setEditorAr] = useState("اكتب وصف البانر بالعربية...");
  const [editorEn, setEditorEn] = useState(
    "Write the banner description in English..."
  );

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

    try {
      // Check if we already have 3 banners
      if (banners.length >= 3) {
        alert("لا يمكن إضافة أكثر من 3 بانرات");
        return;
      }

      let imageUrl = formData.image;

      // Upload image if provided
      if (imageFile) {
        imageUrl = await uploadImageMutation.mutateAsync(imageFile);
      }

      // Create banner
      const bannerData: CreateBannerData = {
        desc_ar:
          editorAr && editorAr !== "اكتب وصف البانر بالعربية..."
            ? editorAr
            : undefined,
        desc_en:
          editorEn && editorEn !== "Write the banner description in English..."
            ? editorEn
            : undefined,
        image: imageUrl || undefined,
      };

      await createBannerMutation.mutateAsync(bannerData);

      router.push("/dashboard/banners");
    } catch (error) {
      console.error("Error creating banner:", error);
      alert("حدث خطأ أثناء إنشاء البانر");
    }
  };

  return (
    <>
    {/* Header */}
    <div className="mb-[25px] md:flex items-center justify-between">
      <h5 className="!mb-0 text-[#011957] dark:text-white font-bold">
        إنشاء بانر جديد
      </h5>
  
      <ol className="breadcrumb mt-[12px] md:mt-0 rtl:flex-row-reverse">
        <li className="breadcrumb-item inline-block relative text-sm mx-[11px]">
          <Link
            href="/dashboard"
            className="inline-block relative ltr:pl-[22px] rtl:pr-[22px] transition-all hover:text-primary-500"
          >
            <i className="material-symbols-outlined absolute ltr:left-0 rtl:right-0 !text-lg -mt-px text-primary-500 top-1/2 -translate-y-1/2">
              home
            </i>
            رئيسية
          </Link>
        </li>
        <li className="breadcrumb-item inline-block relative text-sm mx-[11px]">
          البانرات
        </li>
        <li className="breadcrumb-item inline-block relative text-sm mx-[11px]">
          إنشاء بانر جديد
        </li>
      </ol>
    </div>
  
    {/* Form */}
    <form onSubmit={handleSubmit}>
      <div className="gap-[25px]">
        <div className="lg:col-span-2">
          <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md shadow-md border border-gray-200 dark:border-[#172036]">
            {/* Card Header */}
            <div className="trezo-card-header mb-[20px] md:mb-[25px] flex items-center justify-between">
              <div className="trezo-card-title">
                <h5 className="!mb-0 text-[#011957] dark:text-white font-semibold">
                  أضف بانر جديد
                </h5>
              </div>
            </div>
  
            {/* Card Content */}
            <div className="trezo-card-content">
              <div className="sm:grid sm:grid-cols-2 sm:gap-[25px]">
                {/* Image Upload */}
                <div className="sm:col-span-2 mb-[20px]">
                  <label className="mb-[10px] text-[#011957] dark:text-white font-medium block">
                    صورة البانر
                  </label>
  
                  <div id="fileUploader">
                    <div className="relative flex items-center justify-center overflow-hidden rounded-md py-[88px] px-[20px] border border-[#BA6FEE] bg-[#F9F6FF] dark:bg-[#172036]">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-[40px] h-[40px] flex items-center justify-center rounded-md text-primary-500 text-xl mb-3 bg-white shadow">
                          <i className="ri-upload-2-line"></i>
                        </div>
                        <p className="leading-[1.5] mb-2 text-[#011957] dark:text-white">
                          <strong>اضغط لرفع</strong>
                          <br /> صورة البانر من هنا
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          حجم الصورة: حتى 50 ميجابايت
                        </p>
                      </div>
  
                      <input
                        type="file"
                        id="image"
                        accept="image/*"
                        className="absolute top-0 left-0 right-0 bottom-0 rounded-md z-[1] opacity-0 cursor-pointer"
                        onChange={handleImageChange}
                      />
                    </div>
  
                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="mt-[15px]">
                        <h6 className="text-[#011957] dark:text-white font-medium mb-3">
                          معاينة الصورة
                        </h6>
                        <div className="relative w-full max-w-md h-48 rounded-md overflow-hidden border border-[#BA6FEE] dark:border-[#172036]">
                          <Image
                            src={imagePreview}
                            alt="Banner Preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    )}
  
                    {formData.image && !imagePreview && (
                      <div className="mt-[15px]">
                        <h6 className="text-[#011957] dark:text-white font-medium mb-3">
                          الصورة الحالية
                        </h6>
                        <div className="relative w-full max-w-md h-48 rounded-md overflow-hidden border border-[#BA6FEE] dark:border-[#172036]">
                          <Image
                            src={formData.image}
                            alt="Current Banner"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
  
                {/* Arabic Description */}
                <div className="sm:col-span-2 mb-[20px]">
                  <label className="mb-[10px] text-[#011957] dark:text-white font-medium block">
                    وصف البانر (بالعربي)
                  </label>
                  <EditorProvider>
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
                    <Editor
                      value={editorAr}
                      onChange={(e) => setEditorAr(e.target.value)}
                      containerProps={{
                        style: {
                          borderColor: "#BA6FEE",
                          background: "#F9F6FF",
                          color: "#011957",
                          minHeight: "200px",
                        },
                      }}
                    />
                  </EditorProvider>
                </div>
  
                {/* English Description */}
                <div className="sm:col-span-2 mb-[20px]">
                  <label className="mb-[10px] text-[#011957] dark:text-white font-medium block">
                    وصف البانر (بالانجليزي)
                  </label>
                  <EditorProvider>
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
                    <Editor
                      value={editorEn}
                      onChange={(e) => setEditorEn(e.target.value)}
                      containerProps={{
                        style: {
                          borderColor: "#BA6FEE",
                          background: "#F9F6FF",
                          color: "#011957",
                          minHeight: "200px",
                        },
                      }}
                    />
                  </EditorProvider>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  
      {/* Footer Buttons */}
      <div className="trezo-card mb-[25px]">
        <div className="trezo-card-content flex gap-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard/banners")}
            className="font-medium transition-all rounded-md py-[10px] md:py-[12px] px-[20px] md:px-[22px] bg-danger-500 text-white hover:bg-danger-400"
          >
            إلغاء
          </button>
  
          <button
            type="submit"
            disabled={
              createBannerMutation.isPending || uploadImageMutation.isPending
            }
            className="font-medium transition-all rounded-md py-[10px] md:py-[12px] px-[20px] md:px-[22px] bg-primary-500 text-white hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="inline-block relative ltr:pl-[29px] rtl:pr-[29px]">
              {createBannerMutation.isPending || uploadImageMutation.isPending ? (
                <>
                  <i className="material-symbols-outlined ltr:left-0 rtl:right-0 absolute top-1/2 -translate-y-1/2 animate-spin">
                    sync
                  </i>
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <i className="material-symbols-outlined ltr:left-0 rtl:right-0 absolute top-1/2 -translate-y-1/2">
                    add
                  </i>
                  إنشاء بانر
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </form>
  </>
  
  );
}
