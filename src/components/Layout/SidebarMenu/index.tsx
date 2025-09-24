"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLogout } from "@/components/Authentication/useLogout";

interface SidebarMenuProps {
  toggleActive: () => void;
}

interface AccordionItemProps {
  index: number;
  openIndex: number | null;
  toggleAccordion: (index: number) => void;
  icon: string;
  title: string;
  links: { href: string; label: string; icon?: string }[];
}

const AccordionItem: React.FC<AccordionItemProps> = ({
  index,
  openIndex,
  toggleAccordion,
  icon,
  title,
  links,
}) => {
  const pathname = usePathname();

  return (
    <div className="accordion-item rounded-md mb-[5px] whitespace-nowrap">
      <button
        className={`accordion-button flex items-center transition-all py-[9px] px-[14px] rounded-md font-medium w-full relative hover:bg-[#F3EBFF] ${
          openIndex === index ? "text-[#6043FD]" : "text-gray-700 dark:text-gray-300"
        }`}
        type="button"
        onClick={() => toggleAccordion(index)}
      >
        <i
          className={`material-symbols-outlined ltr:mr-3 rtl:ml-3 text-[22px] transition-colors ${
            openIndex === index ? "text-[#6043FD]" : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {icon}
        </i>
        {title}
      </button>

      <div className={`${openIndex === index ? "block" : "hidden"}`}>
        <ul className="sidebar-sub-menu">
          {links.map((link) => (
            <li key={link.href} className="sidemenu-item mb-[4px] last:mb-0">
              <Link
                href={link.href}
                className={`sidemenu-link flex items-center py-[9px] pl-[38px] rounded-md font-medium transition-all w-full text-left hover:bg-[#F3EBFF] ${
                  pathname.startsWith(link.href)
                    ? "text-[#6043FD] bg-[#F3EBFF]"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {link.icon && (
                  <i
                    className={`ri-${link.icon} ltr:mr-3 rtl:ml-3 text-[22px] transition-colors ${
                      pathname.startsWith(link.href)
                        ? "text-[#6043FD]"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  ></i>
                )}
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const SidebarMenu: React.FC<SidebarMenuProps> = ({ toggleActive }) => {
  const pathname = usePathname();
  const { logout } = useLogout();

  const initialIndex =
    pathname.startsWith("/dashboard/news")
      ? 0
      : pathname.startsWith("/dashboard/blog")
      ? 2
      : pathname.startsWith("/dashboard/testimonial")
      ? 5
      : pathname.startsWith("/dashboard/banners")
      ? 6
      : pathname.startsWith("/dashboard/my-profile")
      ? 29
      : null;

  const [openIndex, setOpenIndex] = React.useState<number | null>(initialIndex);

  const toggleAccordion = (index: number) => {
    setOpenIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  return (
    <div className="sidebar-area bg-white dark:bg-[#0c1427] fixed z-[7] top-0 h-screen transition-all rounded-r-md">
      <div className="logo bg-white dark:bg-[#0c1427] border-b border-gray-100 dark:border-[#172036] px-[25px] pt-[19px] pb-[7px] absolute z-[2] right-0 top-0 left-0">
        <Link href="/dashboard" className="flex items-center">
          <Image src="/images/ENS.png" alt="logo-icon" width={150} height={150} />
        </Link>

        <button
          type="button"
          className="burger-menu absolute top-[24px] left-[25px] hover:text-[#6043FD]"
          onClick={toggleActive}
        >
          <i className="material-symbols-outlined">close</i>
        </button>
      </div>

      <div className="pt-[89px] px-[22px] pb-[20px] h-screen overflow-y-auto sidebar-custom-scrollbar">
        <div className="accordion">
          <span className="block relative font-medium uppercase text-gray-400 mb-[8px] text-xs">
            رئيسي
          </span>

          {/* المنتجات */}
          <AccordionItem
            index={0}
            openIndex={openIndex}
            toggleAccordion={toggleAccordion}
            icon="newspaper"
            title="المنتجات"
            links={[
              { href: "/dashboard/news", label: "قائمة المنتجات", icon: "list-check-2" },
              { href: "/dashboard/news/create-news", label: "إنشاء منتج", icon: "newspaper-line" },
              { href: "/dashboard/news/categories", label: "تصنيفات", icon: "price-tag-3-line" },
            ]}
          />

          {/* الطلبات */}
          <Link
            href="/dashboard/orders"
            className={`sidemenu-link flex items-center py-[9px] pl-[38px] rounded-md font-medium transition-all hover:bg-[#F3EBFF] ${
              pathname.startsWith("/dashboard/orders")
                ? "text-[#6043FD] bg-[#F3EBFF]"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <i
              className={`ri-multi-image-fill ltr:mr-3 rtl:ml-3 text-[22px] ${
                pathname.startsWith("/dashboard/orders")
                  ? "text-[#6043FD]"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            ></i>
            قائمة الطلبات
          </Link>

          {/* مقالات */}
          <AccordionItem
            index={2}
            openIndex={openIndex}
            toggleAccordion={toggleAccordion}
            icon="auto_stories"
            title="مقالات"
            links={[
              { href: "/dashboard/blog", label: "قائمة المقالات", icon: "list-check-2" },
              { href: "/dashboard/blog/create-blog", label: "إنشاء مقال", icon: "newspaper-line" },
            ]}
          />

          {/* توصيات العملاء */}
          <AccordionItem
            index={5}
            openIndex={openIndex}
            toggleAccordion={toggleAccordion}
            icon="auto_stories"
            title="توصيات العملاء"
            links={[
              { href: "/dashboard/testimonial", label: "قائمة التوصيات", icon: "list-check-2" },
              { href: "/dashboard/testimonial/create-testimonial", label: "إنشاء توصية", icon: "newspaper-line" },
            ]}
          />

          {/* البانرات */}
          <AccordionItem
            index={6}
            openIndex={openIndex}
            toggleAccordion={toggleAccordion}
            icon="image"
            title="البانرات"
            links={[
              { href: "/dashboard/banners", label: "قائمة البانرات", icon: "list-check-2" },
              { href: "/dashboard/banners/create", label: "إنشاء بانر جديد", icon: "add-line" },
            ]}
          />

          <span className="block relative font-medium uppercase text-gray-400 mb-[8px] text-xs [&:not(:first-child)]:mt-[22px]">
            أخري
          </span>

          {/* ملفي الشخصي */}
          <Link
            href="/dashboard/my-profile"
            className={`accordion-button flex items-center py-[9px] pl-[14px] rounded-md transition-all hover:bg-[#F3EBFF] ${
              pathname.startsWith("/dashboard/my-profile")
                ? "text-[#6043FD] bg-[#F3EBFF]"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <i
              className={`material-symbols-outlined ltr:mr-3 rtl:ml-3 text-[22px] ${
                pathname.startsWith("/dashboard/my-profile")
                  ? "text-[#6043FD]"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              account_circle
            </i>
            ملفي الشخصي
          </Link>

          {/* إعدادات */}
          <AccordionItem
            index={29}
            openIndex={openIndex}
            toggleAccordion={toggleAccordion}
            icon="settings"
            title="إعدادات"
            links={[
              { href: "/dashboard/my-profile/edit", label: "إعدادات الحساب" },
              { href: "/dashboard/my-profile/change-password", label: "تغيير كلمة المرور" },
              { href: "/dashboard/add-user", label: "أضف مستخدم" },
            ]}
          />

          {/* تسجيل الخروج */}
          <button
            onClick={() => logout()}
            className="accordion-button flex items-center py-[9px] pl-[14px] rounded-md transition-all hover:bg-[#F3EBFF] text-gray-500 dark:text-gray-400"
          >
            <i className="material-symbols-outlined ltr:mr-3 rtl:ml-3 text-[22px]">logout</i>
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
};

export default SidebarMenu;
