import { z } from "zod";

export const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  job_title: z.string().optional(),
  about: z.string().optional(),
});

export const profileSchema = z.object({
  full_name: z.string().min(1, "الاسم مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  phone: z.string().optional(),
  job_title: z.string().optional(),
  address: z.string().optional(),
  about: z.string().optional(),
});

export const gallerySchema = z.object({
  title_ar: z.string().min(1, "Arabic title is required"),
  title_en: z.string().min(1, "English title is required"),
  description_ar: z.string().optional(),
  description_en: z.string().optional(),
  images: z.array(z.string()).min(1, "At least one image is required"),
});

export type SignUpFormData = z.infer<typeof signUpSchema>;
export type GalleryFormData = z.infer<typeof gallerySchema>;
