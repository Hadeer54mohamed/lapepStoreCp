"use client";

import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { useQuery } from "@tanstack/react-query";

import { getProducts } from "../../services/apiProducts";

const RecentProperty: React.FC = () => {
  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts(),
  });

  if (products?.total === 0) {
    return (
      <section
        className="trezo-card bg-white dark:bg-[#0c1427] p-[20px] md:p-[25px] rounded-md"
        aria-label="الأخبار الأخيرة"
      >
        <div className="trezo-card-header mb-[15px] flex items-center justify-between">
          <div className="trezo-card-title">
            <h2 className="!mb-0 text-lg font-semibold">الأخبار الأخيرة</h2>
          </div>
        </div>
        <div className="trezo-card-content">
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            لا يوجد منتجات متاحة
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="trezo-card bg-white dark:bg-[#0c1427] p-[20px] md:p-[25px] rounded-md"
      aria-label="الأخبار الأخيرة"
    >
      <header className="trezo-card-header mb-[15px] flex items-center justify-between">
        <div className="trezo-card-title">
          <h2 className="!mb-0 text-lg font-semibold">الأخبار الأخيرة</h2>
        </div>
      </header>

      <div className="trezo-card-content" id="recentPropertiesSlides">
        <Swiper
          slidesPerView={1}
          pagination={{
            clickable: true,
          }}
          autoplay={{
            delay: 4000,
            disableOnInteraction: true,
          }}
          modules={[Autoplay, Pagination]}
          aria-label="عرض شرائح المنتجات الأخيرة"
        >
          {products?.products.slice(0, 3).map((product) => (
            <SwiperSlide key={product.id}>
              <article
                className="product-slide"
                aria-label={`منتج: ${product.name_ar}`}
              >
                <div
                  className="rounded-[5px] h-[112px] bg-cover bg-no-repeat bg-center"
                  style={{
                    backgroundImage: `url(${product.image_url})`,
                  }}
                  role="img"
                  aria-label={`صورة المنتج: ${product.name_ar}`}
                ></div>

                <div className="flex items-center justify-between mb-[8px] mt-[15px]">
                  <h3 className="!text-lg !mb-0 !text-orange-500">
                    <Link
                      href={`/dashboard/products`}
                      aria-label={`عرض تفاصيل المنتج: ${product.name_ar}`}
                      className="hover:underline focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded"
                    >
                      {product.name_ar}
                    </Link>
                  </h3>
                </div>
              </article>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default RecentProperty;
