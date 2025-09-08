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
import { useCategories } from "@/components/news/categories/useCategories";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createProduct,
  uploadProductImage,
  Product,
  ProductAttribute,
} from "../../../../../../services/apiProducts";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { UUID } from "crypto";

import Image from "next/image";
import Link from "next/link";

type ProductFormValues = {
  name_ar: string;
  name_en: string;
  category_id: UUID;
  description_ar: string;
  description_en: string;
  price: number;
  offer_price?: number;
  stock: number;
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
        price: 0,
        stock: 0,
        is_best_seller: false,
        limited_time_offer: false,
        images: [],
      },
    });

  // Attributes management
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);

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

  // Attributes management functions
  const addAttribute = () => {
    const newAttribute: ProductAttribute = {
      attribute_name: "",
      attribute_value: "",
    };
    setAttributes([...attributes, newAttribute]);
  };

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const updateAttribute = (
    index: number,
    field: keyof ProductAttribute,
    value: string
  ) => {
    const updatedAttributes = [...attributes];
    updatedAttributes[index] = { ...updatedAttributes[index], [field]: value };
    setAttributes(updatedAttributes);
  };

  const onSubmit = async (data: ProductFormValues) => {
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
        name_ar: data.name_ar,
        name_en: data.name_en,
        description_ar: data.description_ar,
        description_en: data.description_en,
        category_id: data.category_id,
        price: data.price,
        offer_price:
          data.offer_price && data.offer_price > 0
            ? data.offer_price
            : undefined,
        stock: data.stock,
        is_best_seller: data.is_best_seller,
        limited_time_offer: data.limited_time_offer,
        image_url: uploadedImageUrls,
        attributes: attributes,
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
      <div className="mb-[25px] md:flex items-center justify-between">
        <h5 className="!mb-0"> انشاء منتج</h5>

        <ol className="breadcrumb mt-[12px] md:mt-0 rtl:flex-row-reverse">
          <li className="breadcrumb-item inline-block relative text-sm mx-[11px] ltr:first:ml-0 rtl:first:mr-0 ltr:last:mr-0 rtl:last:ml-0">
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
          <li className="breadcrumb-item inline-block  relative text-sm mx-[11px] ltr:first:ml-0 rtl:first:mr-0 ltr:last:mr-0 rtl:last:ml-0">
            المنتجات
          </li>
          <li className="breadcrumb-item inline-block  relative text-sm mx-[11px] ltr:first:ml-0 rtl:first:mr-0 ltr:last:mr-0 rtl:last:ml-0">
            انشاء منتج
          </li>
        </ol>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className=" gap-[25px]">
          <div className="lg:col-span-2">
            <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
              <div className="trezo-card-header mb-[20px] md:mb-[25px] flex items-center justify-between">
                <div className="trezo-card-title">
                  <h5 className="!mb-0">أضف منتج</h5>
                </div>
              </div>

              <div className="trezo-card-content">
                <div className="sm:grid sm:grid-cols-2 sm:gap-[25px]">
                  <div className="mb-[20px] sm:mb-0">
                    <label className="mb-[10px] text-black dark:text-white font-medium block">
                      اسم المنتج (بالعربي)
                    </label>
                    <input
                      type="text"
                      className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-500"
                      placeholder="يجب الايزيد عن 100 حرف"
                      id="name_ar"
                      {...register("name_ar", {
                        required: "يجب ادخال اسم المنتج",
                        max: {
                          value: 100,
                          message: "يجب الايزيد عن 100 حرف",
                        },
                      })}
                    />
                    {errors?.name_ar?.message && (
                      <span className="text-red-700 text-sm">
                        {errors.name_ar.message}
                      </span>
                    )}
                  </div>
                  <div className="mb-[20px] sm:mb-0">
                    <label className="mb-[10px] text-black dark:text-white font-medium block">
                      اسم المنتج (بالانجليزي)
                    </label>
                    <input
                      type="text"
                      className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-500"
                      placeholder="يجب الايزيد عن 100 حرف"
                      id="name_en"
                      {...register("name_en", {
                        required: "يجب ادخال اسم المنتج",
                        max: {
                          value: 100,
                          message: "يجب الايزيد عن 100 حرف",
                        },
                      })}
                    />
                    {errors?.name_en?.message && (
                      <span className="text-red-700 text-sm">
                        {errors.name_en.message}
                      </span>
                    )}
                  </div>

                  <div className="mb-[20px] sm:mb-0">
                    <label className="mb-[10px] text-black dark:text-white font-medium block">
                      التصنيف
                    </label>
                    <select
                      className="h-[55px] rounded-md border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[13px] block w-full outline-0 cursor-pointer transition-all focus:border-primary-500"
                      {...register("category_id")}
                      onChange={handleCategoryChange}
                    >
                      <option value="">اختر التصنيف</option>
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

                  <div className="mb-[20px] sm:mb-0">
                    <label className="mb-[10px] text-black dark:text-white font-medium block">
                      السعر الأساسي
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-500"
                      placeholder="0.00"
                      id="price"
                      {...register("price", {
                        required: "يجب ادخال السعر",
                        min: {
                          value: 0,
                          message: "السعر يجب أن يكون أكبر من 0",
                        },
                      })}
                    />
                    {errors?.price?.message && (
                      <span className="text-red-700 text-sm">
                        {errors.price.message}
                      </span>
                    )}
                  </div>

                  <div className="mb-[20px] sm:mb-0">
                    <label className="mb-[10px] text-black dark:text-white font-medium block">
                      سعر العرض (اختياري)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-500"
                      placeholder="اتركه فارغاً إذا لم يكن هناك خصم"
                      id="offer_price"
                      {...register("offer_price", {
                        min: {
                          value: 0,
                          message: "سعر العرض يجب أن يكون أكبر من أو يساوي 0",
                        },
                        validate: (value) => {
                          if (value && value <= 0) {
                            return "سعر العرض يجب أن يكون أكبر من 0";
                          }
                          return true;
                        },
                      })}
                    />
                    {errors?.offer_price?.message && (
                      <span className="text-red-700 text-sm">
                        {errors.offer_price.message}
                      </span>
                    )}
                  </div>

                  <div className="mb-[20px] sm:mb-0">
                    <label className="mb-[10px] text-black dark:text-white font-medium block">
                      المخزون
                    </label>
                    <input
                      type="number"
                      className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-500"
                      placeholder="0"
                      id="stock"
                      {...register("stock", {
                        required: "يجب ادخال المخزون",
                        min: {
                          value: 0,
                          message: "المخزون يجب أن يكون أكبر من أو يساوي 0",
                        },
                      })}
                    />
                    {errors?.stock?.message && (
                      <span className="text-red-700 text-sm">
                        {errors.stock.message}
                      </span>
                    )}
                  </div>

                  <div className="mb-[20px] sm:mb-0">
                    <label className="mb-[10px] text-black dark:text-white font-medium block">
                      أفضل مبيع
                    </label>
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

                  <div className="mb-[20px] sm:mb-0">
                    <label className="mb-[10px] text-black dark:text-white font-medium block">
                      عرض محدود
                    </label>
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

                  <div className="sm:col-span-2 mb-[20px] sm:mb-0">
                    <label className="mb-[10px] text-black dark:text-white font-medium block">
                      وصف المنتج (بالعربي)
                    </label>
                    <EditorProvider>
                      <Editor
                        value={editorAr}
                        onChange={(e) => {
                          setEditorAr(e.target.value);
                          setValue("description_ar", e.target.value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
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
                      وصف المنتج (بالانجليزي)
                    </label>
                    <EditorProvider>
                      <Editor
                        value={editorEn}
                        onChange={(e) => {
                          setEditorEn(e.target.value);
                          setValue("description_en", e.target.value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
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
                      صور المنتج
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
                            <br /> صور المنتج من هنا
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            يمكنك رفع حتى 5 صور، حجم كل صورة: حتى 50 ميجابايت
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {selectedImages.length}/5 صور مختارة
                          </p>
                        </div>

                        <input
                          type="file"
                          id="images"
                          accept="image/*"
                          multiple
                          className="absolute top-0 left-0 right-0 bottom-0 rounded-md z-[1] opacity-0 cursor-pointer"
                          onChange={handleFileChange}
                        />
                        {errors?.images?.message && (
                          <span className="text-red-700 text-sm">
                            {errors.images.message}
                          </span>
                        )}
                      </div>

                      {/* Images Preview */}
                      {selectedImages.length > 0 && (
                        <div className="mt-[15px]">
                          <div className="flex items-center justify-between mb-3">
                            <h6 className="text-black dark:text-white font-medium">
                              الصور المختارة ({selectedImages.length})
                            </h6>
                            <button
                              type="button"
                              onClick={handleRemoveAllImages}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              حذف الكل
                            </button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {selectedImages.map((image, index) => (
                              <div key={index} className="relative group">
                                <div className="relative w-full h-[100px] rounded-md overflow-hidden border border-gray-200 dark:border-[#172036]">
                                  <Image
                                    src={URL.createObjectURL(image)}
                                    alt={`product-preview-${index}`}
                                    fill
                                    className="object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                                    <button
                                      type="button"
                                      className="opacity-0 group-hover:opacity-100 bg-red-500 text-white w-[25px] h-[25px] flex items-center justify-center rounded-full text-xs transition-all duration-200 hover:bg-red-600"
                                      onClick={() => handleRemoveImage(index)}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                                  {image.name}
                                </p>
                              </div>
                            ))}
                          </div>
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
            {attributes.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                لا توجد خصائص للمنتج. اضغط على &quot;إضافة خاصية&quot; لإضافة
                خاصية جديدة.
              </p>
            ) : (
              <div className="space-y-4">
                {attributes.map((attribute, index) => (
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
                          value={attribute.attribute_name}
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
                          value={attribute.attribute_value}
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

        <div className="trezo-card mb-[25px]">
          <div className="trezo-card-content">
            <button
              type="reset"
              className="font-medium inline-block transition-all rounded-md md:text-md ltr:mr-[15px] rtl:ml-[15px] py-[10px] md:py-[12px] px-[20px] md:px-[22px] bg-danger-500 text-white hover:bg-danger-400"
            >
              ألغاء
            </button>

            <button
              type="submit"
              disabled={isPending || isUploadingImages}
              className="font-medium inline-block transition-all rounded-md md:text-md py-[10px] md:py-[12px] px-[20px] md:px-[22px] bg-primary-500 text-white hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="inline-block relative ltr:pl-[29px] rtl:pr-[29px]">
                {isUploadingImages ? (
                  <>
                    <i className="material-symbols-outlined ltr:left-0 rtl:right-0 absolute top-1/2 -translate-y-1/2 animate-spin">
                      sync
                    </i>
                    جاري رفع الصور...
                  </>
                ) : isPending ? (
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
                    انشاء منتج
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      </form>
    </>
  );
};

export default CreateProductForm;
