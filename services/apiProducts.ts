import { decode } from "base64-arraybuffer";
import supabase from "./supabase";

export interface ProductAttribute {
  id?: string;
  product_id?: string;
  attribute_name: string;
  attribute_value: string;
}

export interface Product {
  id?: string;
  title: string; // Required field
  name_en?: string;
  name_ar?: string;
  price: number; // Required field
  offer_price?: number;
  images?: string[]; // text[] in database
  image_url?: string[]; // text[] in database
  description_ar?: string;
  description_en?: string;
  category_id?: string;
  stock_quantity?: number; // integer with default 0
  is_best_seller?: boolean; // boolean with default false
  limited_time_offer?: boolean; // boolean with default false
  created_at?: string;
  updated_at?: string;
  // Keep for backward compatibility
  stock?: number;
  description?: string;
  attributes?: ProductAttribute[];
}

export async function getProducts(
  page = 1,
  limit = 10,
  filters?: {
    categoryId?: string;
    search?: string;
    date?: string;
    isBestSeller?: boolean;
    limitedTimeOffer?: boolean;
  }
): Promise<{ products: Product[]; total: number }> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase.from("products").select(
    `
      *
    `,
    { count: "exact" }
  );

  if (filters?.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters?.search) {
    query = query.or(
      `name_ar.ilike.%${filters.search}%,name_en.ilike.%${filters.search}%`
    );
  }

  if (filters?.date) {
    const now = new Date();
    const startDate = new Date();

    switch (filters.date) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    query = query.gte("created_at", startDate.toISOString());
  }

  if (filters?.isBestSeller !== undefined) {
    query = query.eq("is_best_seller", filters.isBestSeller);
  }

  if (filters?.limitedTimeOffer !== undefined) {
    query = query.eq("limited_time_offer", filters.limitedTimeOffer);
  }

  query = query.order("created_at", { ascending: false });

  const { data: products, error, count } = await query.range(from, to);

  if (error) {
    console.error("خطأ في جلب المنتجات:", error.message);
    throw new Error("تعذر تحميل المنتجات");
  }

  // معالجة الخصائص لكل منتج
  const processedProducts = await Promise.all(
    (products || []).map(async (product) => {
      let processedAttributes = [];

      if (product.attributes) {
        if (Array.isArray(product.attributes)) {
          processedAttributes = product.attributes;
        } else if (typeof product.attributes === "object") {
          processedAttributes = Object.values(product.attributes);
        }
      }

      // إذا لم تكن هناك خصائص في البيانات، احصل عليها من جدول منفصل
      if (processedAttributes.length === 0) {
        const { data: attributesData } = await supabase
          .from("product_attributes")
          .select("id, product_id, attribute_name, attribute_value")
          .eq("product_id", product.id);

        processedAttributes = attributesData || [];
      }

      return {
        ...product,
        attributes: processedAttributes,
      };
    })
  );

  return {
    products: processedProducts,
    total: count ?? 0,
  };
}

export async function getProductById(id: string): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("خطأ في جلب المنتج:", error);
    throw new Error(`تعذر تحميل المنتج: ${error.message}`);
  }

  if (!data) {
    throw new Error("لم يتم العثور على المنتج");
  }

  // Map database fields to interface for backward compatibility
  const product: Product = {
    ...data,
    image_url: data.images || data.image_url,
    stock: data.stock_quantity,
    description: data.description_ar || data.description_en, // Backward compatibility
    attributes: [], // No attributes in current schema
  };

  return product;
}

export async function createProduct(productData: Product): Promise<Product> {
  const { ...productInput } = productData;

  // Generate a unique ID since database expects text not null
  const generateProductId = () => {
    return `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Map the product data to match database schema exactly
  const dbProduct = {
    id: productInput.id || generateProductId(), // Generate ID if not provided
    title: productInput.title,
    name_en: productInput.name_en || null,
    name_ar: productInput.name_ar || null,
    price: Number(productInput.price), // Ensure it's a number
    offer_price: productInput.offer_price
      ? Number(productInput.offer_price)
      : null,
    images: productInput.images || productInput.image_url || null,
    image_url: productInput.image_url || productInput.images || null,
    description_ar:
      productInput.description_ar || productInput.description || null,
    description_en: productInput.description_en || null,
    category_id: productInput.category_id || null,
    stock_quantity: productInput.stock_quantity || productInput.stock || 0,
    is_best_seller: productInput.is_best_seller ?? false,
    limited_time_offer: productInput.limited_time_offer ?? false,
  };

  // Create the product first
  const { data: createdProduct, error: productError } = await supabase
    .from("products")
    .insert([dbProduct])
    .select()
    .single();

  if (productError) {
    console.error("خطأ في إنشاء المنتج:", productError);
    console.error("Product data sent:", dbProduct);
    console.error("Original input data:", productInput);
    throw new Error(`تعذر إنشاء المنتج: ${productError.message}`);
  }

  console.log("Product created successfully:", createdProduct);

  return createdProduct;
}

export async function uploadProductImage(
  file: File | { base64: string; name: string },
  folder = "products"
): Promise<string> {
  let fileExt: string;
  let fileName: string;
  let fileData: File | ArrayBuffer;

  if (file instanceof File) {
    fileExt = file.name.split(".").pop()!;
    fileName = `${folder}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;
    fileData = file;
  } else {
    // Base64 case
    fileExt = file.name.split(".").pop()!;
    fileName = `${folder}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;
    fileData = decode(file.base64);
  }

  const { error } = await supabase.storage
    .from("product-images")
    .upload(fileName, fileData, {
      contentType: file instanceof File ? file.type : `image/${fileExt}`,
    });

  if (error) {
    console.error("خطأ أثناء رفع صورة المنتج:", error.message);
    throw new Error("تعذر رفع صورة المنتج");
  }

  const { data: publicUrlData } = supabase.storage
    .from("product-images")
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

export async function deleteProduct(id: string) {
  // First, get the product to check if it has images
  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("image_url")
    .eq("id", id)
    .single();

  if (fetchError) {
    console.error("Supabase fetch error:", fetchError);
    throw new Error("حدث خطأ أثناء جلب بيانات المنتج");
  }

  // Delete the images if they exist
  if (product?.image_url && product.image_url.length > 0) {
    for (const imageUrl of product.image_url) {
      const path = new URL(imageUrl).pathname;
      const match = path.match(
        /\/storage\/v1\/object\/public\/product-images\/(.+)/
      );
      const filePath = match?.[1];

      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from("product-images")
          .remove([filePath]);

        if (storageError) {
          console.error("فشل حذف صورة المنتج:", storageError);
        }
      }
    }
  }

  // Delete the product (attributes will be deleted automatically due to CASCADE)
  const { error: deleteError } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (deleteError) {
    throw new Error("حدث خطأ أثناء حذف المنتج");
  }
}

export async function updateProduct(
  id: string,
  updatedProduct: Partial<Product>
) {
  const { stock, ...product } = updatedProduct;

  // Map stock to stock_quantity for database compatibility
  const dbProduct = {
    ...product,
    stock_quantity: product.stock_quantity || stock || 0,
  };

  // Update the product
  const { data, error } = await supabase
    .from("products")
    .update(dbProduct)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("خطأ في تحديث المنتج:", error.message);
    throw new Error("تعذر تحديث المنتج");
  }

  return data;
}
