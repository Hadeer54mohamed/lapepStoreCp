"use client";

import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import {
  useBanner,
  useUpdateBanner,
  useUploadBannerImage,
  useDeleteBannerImage,
} from "../../../../../../hooks/useBanners";
import { UpdateBannerData } from "../../../../../../../services/apiBanners";
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

export default function EditBannerPage() {
  const router = useRouter();
  const params = useParams();
  const bannerId = Number(params.id);

  const { data: banner, isLoading, error } = useBanner(bannerId);
  const updateBannerMutation = useUpdateBanner();
  const uploadImageMutation = useUploadBannerImage();
  const deleteImageMutation = useDeleteBannerImage();

  const [formData, setFormData] = useState<UpdateBannerData>({
    desc_ar: "",
    desc_en: "",
    image: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [originalImage, setOriginalImage] = useState<string>("");

  // Text Editor states
  const [editorAr, setEditorAr] = useState("اكتب وصف البانر بالعربية...");
  const [editorEn, setEditorEn] = useState(
    "Write the banner description in English..."
  );

  // Update form data when banner is loaded
  useEffect(() => {
    if (banner) {
      setFormData({
        desc_ar: banner.desc_ar || "",
        desc_en: banner.desc_en || "",
        image: banner.image || "",
      });
      setOriginalImage(banner.image || "");
      setEditorAr(banner.desc_ar || "اكتب وصف البانر بالعربية...");
      setEditorEn(
        banner.desc_en || "Write the banner description in English..."
      );
    }
  }, [banner]);

  // Handle error
  useEffect(() => {
    if (error) {
      console.error("Error fetching banner:", error);
      alert("حدث خطأ أثناء تحميل البانر");
      router.push("/dashboard/banners");
    }
  }, [error, router]);

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
      let imageUrl = formData.image;

      // Upload new image if provided
      if (imageFile) {
        // Delete old image if it exists and is different
        if (originalImage && originalImage !== imageUrl) {
          try {
            await deleteImageMutation.mutateAsync(originalImage);
          } catch (error) {
            console.warn("Could not delete old image:", error);
          }
        }

        imageUrl = await uploadImageMutation.mutateAsync(imageFile);
      }

      // Update banner
      const bannerData: UpdateBannerData = {
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

      await updateBannerMutation.mutateAsync({
        id: bannerId,
        data: bannerData,
      });

      router.push("/dashboard/banners");
    } catch (error) {
      console.error("Error updating banner:", error);
      alert("حدث خطأ أثناء تحديث البانر");
    }
  };

  if (isLoading) {
    return (
      <>
        <Head>
          <title>تعديل البانر - جاري التحميل</title>
          <meta name="description" content="تعديل البانر" />
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <main
          className="flex items-center justify-center min-h-screen"
          dir="rtl"
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              جاري تحميل البانر...
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>تعديل البانر</title>
        <meta name="description" content="تعديل البانر" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <main className="p-6 space-y-6" dir="rtl">
        {/* Header Section */}
        <header className="flex justify-between items-center">
          <section className="text-right">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              تعديل البانر
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              تعديل بيانات البانر
            </p>
          </section>
          <Link
            href="/dashboard/banners"
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <i className="material-symbols-outlined">arrow_back</i>
            العودة للقائمة
          </Link>
        </header>

        {/* Form Section */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  صورة البانر
                </label>
                <div className="space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />

                  {imagePreview && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        معاينة الصورة الجديدة:
                      </p>
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        width={400}
                        height={192}
                        className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                      />
                    </div>
                  )}

                  {formData.image && !imagePreview && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        الصورة الحالية:
                      </p>
                      <Image
                        src={formData.image}
                        alt="Current"
                        width={400}
                        height={192}
                        className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Arabic Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  وصف البانر (بالعربي)
                </label>
                <EditorProvider>
                  <Editor
                    value={editorAr}
                    onChange={(e) => {
                      setEditorAr(e.target.value);
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

              {/* English Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  وصف البانر (بالانجليزي)
                </label>
                <EditorProvider>
                  <Editor
                    value={editorEn}
                    onChange={(e) => {
                      setEditorEn(e.target.value);
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

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={
                    updateBannerMutation.isPending ||
                    uploadImageMutation.isPending
                  }
                  className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateBannerMutation.isPending ||
                  uploadImageMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <i className="material-symbols-outlined">save</i>
                      حفظ التغييرات
                    </>
                  )}
                </button>

                <Link
                  href="/dashboard/banners"
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                  <i className="material-symbols-outlined">cancel</i>
                  إلغاء
                </Link>
              </div>
            </form>
          </div>
        </section>
      </main>
    </>
  );
}
