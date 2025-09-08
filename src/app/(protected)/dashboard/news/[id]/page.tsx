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
  ProductAttribute,
} from "../../../../../../services/apiProducts";
import { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import Image from "next/image";
import toast from "react-hot-toast";

interface ProductFormData {
  name_ar: string;
  name_en: string;
  category_id: string;
  description_ar: string;
  description_en: string;
  price: number;
  offer_price?: number;
  stock: number;
  is_best_seller: boolean;
  limited_time_offer: boolean;
  image_url?: string[];
}

export default function EditProductPage() {
  const [serverImages, setServerImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
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
      stock: 0,
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
        stock: product.stock || 0,
        is_best_seller: product.is_best_seller || false,
        limited_time_offer: product.limited_time_offer || false,
      });

      if (product.image_url) {
        setServerImages(product.image_url);
      }

      // تحسين تحميل الخصائص
      if (product.attributes && Array.isArray(product.attributes)) {
        setAttributes(product.attributes);
      } else if (product.attributes && typeof product.attributes === "object") {
        // إذا كانت الخصائص كائن وليس مصفوفة، نحولها إلى مصفوفة
        const attributesArray = Object.values(
          product.attributes
        ) as ProductAttribute[];
        setAttributes(attributesArray);
      } else {
        setAttributes([]);
      }
    }
  }, [product, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setSelectedImage(file);
  };

  // Attributes management functions
  const addAttribute = () => {
    const newAttribute: ProductAttribute = {
      attribute_name: "",
      attribute_value: "",
    };
    setAttributes([...(attributes || []), newAttribute]);
  };

  const removeAttribute = (index: number) => {
    if (!attributes) return;
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const updateAttribute = (
    index: number,
    field: keyof ProductAttribute,
    value: string
  ) => {
    if (!attributes) return;

    const updatedAttributes = [...attributes];
    updatedAttributes[index] = { ...updatedAttributes[index], [field]: value };
    setAttributes(updatedAttributes);
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
        attributes: attributes || [],
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
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className=" gap-[25px]">
        <div className="lg:col-span-2">
          <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
            <div className="trezo-card-header mb-[20px] md:mb-[25px] flex items-center justify-between">
              <div className="trezo-card-title">
                <h5 className="!mb-0">تعديل منتج</h5>
              </div>
            </div>

            <div className="trezo-card-content">
              <div className="sm:grid sm:grid-cols-2 sm:gap-[25px]">
                {/* العنوانين */}
                <div>
                  <label className="block font-medium mb-2">
                    اسم المنتج (ع)
                  </label>
                  <input
                    {...register("name_ar")}
                    className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-2">
                    اسم المنتج (EN)
                  </label>
                  <input
                    {...register("name_en")}
                    className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-2">
                    السعر الأساسي
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("price")}
                    className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-2">
                    سعر العرض (اختياري)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("offer_price")}
                    className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-2">المخزون</label>
                  <input
                    type="number"
                    {...register("stock")}
                    className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-2">أفضل مبيع</label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_best_seller"
                      className="w-4 h-4 text-primary-500 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      {...register("is_best_seller")}
                    />
                    <label
                      htmlFor="is_best_seller"
                      className="mr-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      تحديد كأفضل مبيع
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-2">عرض محدود</label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="limited_time_offer"
                      className="w-4 h-4 text-primary-500 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      {...register("limited_time_offer")}
                    />
                    <label
                      htmlFor="limited_time_offer"
                      className="mr-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      تحديد كعرض محدود
                    </label>
                  </div>
                </div>

                {/* التصنيف */}
                {product && (
                  <div className="mb-[20px] sm:mb-0">
                    <label className="mb-[10px] text-black dark:text-white font-medium block">
                      التصنيف
                    </label>
                    <select
                      {...register("category_id")}
                      className="h-[55px] rounded-md border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[13px] block w-full outline-0 cursor-pointer transition-all focus:border-primary-500"
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

                {/* الخبر بالعربية */}
                <div className="sm:col-span-2">
                  <EditorProvider>
                    <Controller
                      control={control}
                      name="description_ar"
                      render={({ field }) => (
                        <div className="sm:col-span-2">
                          <label className="block font-medium mb-2">
                            وصف المنتج (بالعربي)
                          </label>
                          <EditorProvider>
                            <Editor
                              style={{ minHeight: "200px" }}
                              value={field.value}
                              onChange={field.onChange}
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
                      )}
                    />
                  </EditorProvider>
                </div>

                {/* الخبر بالانجليزية */}
                <div className="sm:col-span-2">
                  <EditorProvider>
                    <Controller
                      control={control}
                      name="description_en"
                      render={({ field }) => (
                        <div className="sm:col-span-2">
                          <label className="block font-medium mb-2">
                            وصف المنتج (بالانجليزي)
                          </label>
                          <EditorProvider>
                            <Editor
                              style={{ minHeight: "200px" }}
                              value={field.value}
                              onChange={field.onChange}
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
                      )}
                    />
                  </EditorProvider>
                </div>

                {/* الصورة */}
                <div className="sm:col-span-2 mb-[20px] sm:mb-0">
                  <label className="mb-[10px] text-black dark:text-white font-medium block">
                    صورة المنتج
                  </label>

                  <div id="fileUploader">
                    <div className="relative flex items-center justify-center overflow-hidden rounded-md py-[88px] px-[20px] border border-gray-200 dark:border-[#172036]">
                      <div className="flex items-center justify-center">
                        <div className="w-[35px] h-[35px] border border-gray-100 dark:border-[#15203c] flex items-center justify-center rounded-md text-primary-500 text-lg ltr:mr-[12px] rtl:ml-[12px]">
                          <i className="ri-upload-2-line"></i>
                        </div>
                        <p className="leading-[1.5]">
                          <strong className="text-black dark:text-white">
                            اضغط لرفع
                          </strong>
                          <br /> صورة المنتج من هنا
                        </p>
                      </div>

                      <input
                        type="file"
                        id="image"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="absolute top-0 left-0 right-0 bottom-0 rounded-md z-[1] opacity-0 cursor-pointer"
                      />
                    </div>

                    {/* Image Preview */}
                    <div className="mt-[10px] flex flex-wrap gap-2">
                      {/* صور السيرفر */}
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

                      {/* صورة الرفع الجديدة */}
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
        </div>

        {/* Attributes Section */}
        <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
          <div className="trezo-card-header mb-[20px] md:mb-[25px] flex items-center justify-between">
            <div className="trezo-card-title">
              <h5 className="!mb-0">خصائص المنتج</h5>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({attributes ? attributes.length : 0} خاصية)
              </span>
            </div>
            <button
              type="button"
              onClick={addAttribute}
              className="font-medium inline-block transition-all rounded-md md:text-md py-[8px] px-[16px] bg-primary-500 text-white hover:bg-primary-400"
            >
              <i className="material-symbols-outlined ltr:mr-2 rtl:ml-2">add</i>
              إضافة خاصية
            </button>
          </div>

          <div className="trezo-card-content">
            {!attributes || attributes.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                لا توجد خصائص للمنتج. اضغط على &quot;إضافة خاصية&quot; لإضافة
                خاصية جديدة.
              </p>
            ) : (
              <div className="space-y-4">
                {attributes &&
                  attributes.map((attribute, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 dark:border-[#172036] rounded-md p-4"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h6 className="text-black dark:text-white font-medium">
                          خاصية {index + 1}
                        </h6>
                        <button
                          type="button"
                          onClick={() => removeAttribute(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <i className="material-symbols-outlined">delete</i>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="mb-[10px] text-black dark:text-white font-medium block">
                            اسم الخاصية
                          </label>
                          <input
                            type="text"
                            className="h-[45px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-500"
                            placeholder="مثل: اللون، الحجم، المادة"
                            value={attribute?.attribute_name || ""}
                            onChange={(e) =>
                              updateAttribute(
                                index,
                                "attribute_name",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div>
                          <label className="mb-[10px] text-black dark:text-white font-medium block">
                            قيمة الخاصية
                          </label>
                          <input
                            type="text"
                            className="h-[45px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-500"
                            placeholder="مثل: أحمر، كبير، قطن"
                            value={attribute?.attribute_value || ""}
                            onChange={(e) =>
                              updateAttribute(
                                index,
                                "attribute_value",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* الأزرار */}
      <div className="trezo-card mb-[25px]">
        <div className="trezo-card-content">
          <button
            type="reset"
            className="font-medium inline-block transition-all rounded-md md:text-md ltr:mr-[15px] rtl:ml-[15px] py-[10px] md:py-[12px] px-[20px] md:px-[22px] bg-danger-500 text-white hover:bg-danger-400"
          >
            إلغاء
          </button>

          <button
            type="submit"
            disabled={isSubmitting || isUploadingImage}
            className="font-medium inline-block transition-all rounded-md md:text-md py-[10px] md:py-[12px] px-[20px] md:px-[22px] bg-primary-500 text-white hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="inline-block relative ltr:pl-[29px] rtl:pr-[29px]">
              {isUploadingImage ? (
                <>
                  <i className="material-symbols-outlined ltr:left-0 rtl:right-0 absolute top-1/2 -translate-y-1/2 animate-spin">
                    sync
                  </i>
                  جاري رفع الصورة...
                </>
              ) : isSubmitting ? (
                <>
                  <i className="material-symbols-outlined ltr:left-0 rtl:right-0 absolute top-1/2 -translate-y-1/2 animate-spin">
                    sync
                  </i>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <i className="material-symbols-outlined ltr:left-0 rtl:right-0 absolute top-1/2 -translate-y-1/2">
                    save
                  </i>
                  حفظ التعديلات
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </form>
  );
}
