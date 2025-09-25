"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useSignIn } from "./useSignIn";

const SignInForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { login, isPending, isError } = useSignIn();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) return;
    login({ email, password });
  };

  return (
    <div className="auth-main-content bg-[#F7F7F7] dark:bg-[#0a0e19] py-16 md:py-20 lg:py-28 min-h-screen flex items-center">
    <div className="mx-auto px-4 md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1255px] w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        
        {/* الصورة الجانبية */}
        <div className="hidden lg:block rounded-[20px] overflow-hidden shadow-md order-2 lg:order-1">
          <Image
            src="/images/ens.jpg"
            alt="sign-in-image"
            className="rounded-[20px] object-cover"
            width={600}
            height={750}
          />
        </div>
  
        {/* الفورم */}
        <div className="bg-white dark:bg-[#0c1427] rounded-[20px] shadow-xl p-8 md:p-10 order-1 lg:order-2 border border-[#f0f0f0] dark:border-[#172036]">
          
          {/* اللوجو */}
          <div className="flex justify-center mb-6">
            <Image src="/images/ENS.png" alt="logo-icon" width={120} height={120} />
          </div>
  
          <h1 className="text-center text-2xl font-bold text-[#011957] dark:text-white mb-8">
            مرحباً بعودتك <span className="inline-block animate-wave">👋</span>
          </h1>
  
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* البريد الإلكتروني */}
            <div>
              <label className="mb-2 block text-[#011957] dark:text-white font-medium">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                id="email"
                value={email}
                disabled={isPending}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@ens.com"
                autoComplete="email"
                className="h-[50px] rounded-md border border-[#BA6FEE] bg-[#F9F6FF] dark:bg-[#15203c] px-4 w-full text-[#011957] dark:text-white placeholder-gray-400 focus:border-[#6043FD] focus:ring-2 focus:ring-[#9861FB] outline-none transition"
              />
            </div>
  
            {/* كلمة المرور */}
            <div className="relative">
              <label className="mb-2 block text-[#011957] dark:text-white font-medium">
                كلمة المرور
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                disabled={isPending}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="h-[50px] rounded-md border border-[#BA6FEE] bg-[#F9F6FF] dark:bg-[#15203c] px-4 w-full text-[#011957] dark:text-white placeholder-gray-400 focus:border-[#6043FD] focus:ring-2 focus:ring-[#9861FB] outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-10 text-gray-500 hover:text-[#6043FD] transition"
              >
                <i className={`ri-${showPassword ? "eye-line" : "eye-off-line"}`}></i>
              </button>
            </div>
  
            {/* رسالة الخطأ */}
            {isError && (
              <p className="text-[#E10E0E] text-sm font-medium">
                البريد الإلكتروني أو كلمة المرور غير صحيحة
              </p>
            )}
  
            {/* زر الدخول */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 px-6 rounded-md bg-gradient-to-r from-[#6043FD] to-[#9861FB] text-white font-semibold shadow-md hover:from-[#5033e0] hover:to-[#8750e0] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </button>
          </form>
  
          {/* هل نسيت كلمة المرور */}
          <div className="text-center mt-6">
            <a
              href="/authentication/forgot-password"
              className="text-sm text-[#6043FD] hover:underline"
            >
              هل نسيت كلمة المرور؟
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  );
};

export default SignInForm;
