import ChangePasswordForm from "@/components/Settings/ChangePasswordForm";
import Nav from "@/components/Settings/Nav";
import Link from "next/link";

export default function Page() {
  return (
    <>
  {/* Header + Breadcrumb */}
  <div className="mb-[25px] md:flex items-center justify-between">
    <h5 className="!mb-0 text-[#011957] dark:text-white">
      تغيير كلمة المرور
    </h5>

    <ol className="breadcrumb mt-[12px] md:mt-0 flex items-center">
      <li className="breadcrumb-item inline-block relative text-sm mx-[11px]">
        <Link
          href="/dashboard/ecommerce/"
          className="inline-flex items-center gap-1 relative ltr:pl-[22px] rtl:pr-[22px] transition-all hover:text-primary-500 text-[#011957] dark:text-gray-300"
        >
          <i className="material-symbols-outlined absolute ltr:left-0 rtl:right-0 !text-lg text-primary-500 top-1/2 -translate-y-1/2">
            home
          </i>
          رئيسية
        </Link>
      </li>

      <li className="breadcrumb-item inline-block relative text-sm mx-[11px] text-[#011957] dark:text-gray-300">
        الإعدادات
      </li>

      <li className="breadcrumb-item inline-block relative text-sm mx-[11px] text-primary-500">
        تغيير كلمة المرور
      </li>
    </ol>
  </div>

  {/* Card */}
  <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md shadow-sm">
    <div className="trezo-card-content">
      {/* Nav */}
      <Nav />

      {/* Form */}
      <div className="mt-[20px]">
        <ChangePasswordForm />
      </div>
    </div>
  </div>
</>

  );
}
