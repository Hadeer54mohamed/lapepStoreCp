import supabase from "./supabase";

export interface User {
  id?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  city?: string;
  address?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  profile_image_url?: string;
  preferred_language?: string;
  created_at?: string;
  updated_at?: string;
  role?: string;
  is_active?: boolean;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id?: string;
  quantity: number;
  price: number;
  created_at?: string;
  updated_at?: string;
  // Relation to product
  products?: {
    id?: string;
    name_ar: string;
    name_en: string;
    price: number;
    image_url?: string[];
  };
}

export interface Payment {
  id?: string;
  order_id?: string;
  payment_method: string;
  amount: number;
  payment_status: "pending" | "completed" | "failed";
  transaction_id?: string;
  created_at?: string;
}

export interface Order {
  id?: string;
  user_id?: string;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  total_price: number;
  created_at?: string;
  updated_at?: string;
  user?: User;
  profiles?: User;
  order_items?: OrderItem[];
  payments?: Payment[];
}

export async function getOrders(
  page = 1,
  limit = 10,
  filters?: {
    status?: string;
    search?: string;
    date?: string;
  }
): Promise<{ orders: Order[]; total: number }> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase.from("orders").select(
    `
    *,
    profiles!orders_user_id_fkey(*),
    order_items!order_items_order_id_fkey(
      id,
      quantity,
      price,
      products!order_items_product_id_fkey(
        id,
        name_ar,
        name_en,
        price,
        image_url
      )
    ),
    payments!payments_order_id_fkey(
      id,
      payment_method,
      amount,
      payment_status,
      transaction_id,
      created_at
    )
  `,
    { count: "exact" }
  );

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  // Skip database search for now, handle all search client-side
  // This avoids UUID operator issues with Supabase

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

  query = query.order("created_at", { ascending: false });

  const { data: orders, error, count } = await query.range(from, to);

  if (error) {
    console.error("خطأ في جلب الطلبات:", error.message);
    throw new Error("تعذر تحميل الطلبات");
  }

  console.log("Orders with profiles:", orders);
  console.log("Search filter:", filters?.search);
  console.log("Total count from database:", count);

  // Enhanced client-side filtering for comprehensive search
  if (filters?.search && orders) {
    const searchTerm = filters.search.toLowerCase().trim();
    console.log("Client-side filtering with search term:", searchTerm);
    console.log("Orders before filtering:", orders.length);

    if (searchTerm.length === 0) {
      return {
        orders: orders || [],
        total: count ?? 0,
      };
    }

    const filteredOrders = orders.filter((order) => {
      try {
        // Search in order ID (full ID or partial)
        const matchesOrderId = order.id?.toLowerCase().includes(searchTerm);

        // Search in user ID
        const matchesUserId = order.user_id?.toLowerCase().includes(searchTerm);

        // Search in customer name
        const matchesName = order.profiles?.full_name
          ?.toLowerCase()
          .includes(searchTerm);

        // Search in phone number (remove any spaces or special characters)
        const cleanPhone = order.profiles?.phone?.replace(/\D/g, "") || "";
        const cleanSearchTerm = searchTerm.replace(/\D/g, "");
        const matchesPhone =
          cleanPhone.includes(cleanSearchTerm) ||
          order.profiles?.phone?.toLowerCase().includes(searchTerm);

        // Search in order ID display format (first 8 characters)
        const orderIdDisplay = order.id?.slice(0, 8).toLowerCase();
        const matchesOrderIdDisplay = orderIdDisplay?.includes(searchTerm);

        // Search in email if available
        const matchesEmail = order.profiles?.email
          ?.toLowerCase()
          .includes(searchTerm);

        // Search in order number format (just the first part)
        const orderNumber = order.id?.split("-")[0]?.toLowerCase();
        const matchesOrderNumber = orderNumber?.includes(searchTerm);

        const matches =
          matchesOrderId ||
          matchesUserId ||
          matchesName ||
          matchesPhone ||
          matchesOrderIdDisplay ||
          matchesEmail ||
          matchesOrderNumber;

        if (matches) {
          console.log("Order matches search:", order.id?.slice(0, 8), {
            matchesOrderId,
            matchesUserId,
            matchesName,
            matchesPhone,
            matchesOrderIdDisplay,
            matchesEmail,
            matchesOrderNumber,
            searchTerm,
          });
        }

        return matches;
      } catch (error) {
        console.error("Error in search filter:", error);
        return false;
      }
    });

    console.log("Orders after filtering:", filteredOrders.length);

    // If no results found, return all orders to avoid empty state when search fails
    if (filteredOrders.length === 0 && orders.length > 0) {
      console.log("No search matches found, showing all orders");
    }

    return {
      orders: filteredOrders,
      total: filteredOrders.length,
    };
  }

  return {
    orders: orders || [],
    total: count ?? 0,
  };
}

export async function getOrderById(id: string): Promise<Order> {
  // Get order with profile data and order items using join
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      `
      *,
      profiles!orders_user_id_fkey(*),
      order_items!order_items_order_id_fkey(
        id,
        quantity,
        price,
        products!order_items_product_id_fkey(
          id,
          name_ar,
          name_en,
          price,
          image_url
        )
      ),
      payments!payments_order_id_fkey(
        id,
        payment_method,
        amount,
        payment_status,
        transaction_id,
        created_at
      )
    `
    )
    .eq("id", id)
    .single();

  if (orderError) {
    console.error("خطأ في جلب الطلب:", orderError.message);
    throw new Error("تعذر تحميل الطلب");
  }

  console.log("Order data with profiles and items:", order);

  return order;
}

export async function updateOrderStatus(
  id: string,
  status: Order["status"]
): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("خطأ في تحديث حالة الطلب:", error.message);
    throw new Error("تعذر تحديث حالة الطلب");
  }

  return data;
}

export async function deleteOrder(id: string): Promise<void> {
  const { error } = await supabase.from("orders").delete().eq("id", id);

  if (error) {
    console.error("خطأ في حذف الطلب:", error.message);
    throw new Error("تعذر حذف الطلب");
  }
}

export async function getOrderStats(): Promise<{
  total: number;
  pending: number;
  paid: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}> {
  const { data, error } = await supabase.from("orders").select("status");

  if (error) {
    console.error("خطأ في جلب إحصائيات الطلبات:", error.message);
    throw new Error("تعذر تحميل إحصائيات الطلبات");
  }

  console.log("Debug - Raw orders data from getOrderStats:", data);

  const stats = {
    total: data?.length || 0,
    pending: data?.filter((order) => order.status === "pending").length || 0,
    paid: data?.filter((order) => order.status === "paid").length || 0,
    shipped: data?.filter((order) => order.status === "shipped").length || 0,
    delivered:
      data?.filter((order) => order.status === "delivered").length || 0,
    cancelled:
      data?.filter((order) => order.status === "cancelled").length || 0,
  };

  console.log("Debug - Calculated stats:", stats);
  return stats;
}

// Debug function to check what's happening with the data
export async function debugOrderData() {
  console.log("=== DEBUG ORDER DATA ===");

  // Check the specific order
  const orderId = "ef417740-bfa7-4af0-bed5-f8d9652bbef6";
  const userId = "bac56e0c-d524-4fc6-9971-a034fc1655bb";

  console.log("Checking order:", orderId);
  console.log("Checking user:", userId);

  // Check if the order exists
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  console.log("Order data:", order);
  console.log("Order error:", orderError);

  // Check if the profile exists
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  console.log("Profile data:", profile);
  console.log("Profile error:", profileError);

  // Check all profiles
  const { data: allProfiles, error: allProfilesError } = await supabase
    .from("profiles")
    .select("*");

  console.log("All profiles:", allProfiles);
  console.log("All profiles error:", allProfilesError);

  // Try the join query manually
  const { data: joinResult, error: joinError } = await supabase
    .from("orders")
    .select(
      `
      *,
      profiles!orders_user_id_fkey(*)
    `
    )
    .eq("id", orderId)
    .single();

  console.log("Join result:", joinResult);
  console.log("Join error:", joinError);

  // Try different join approaches
  const { data: joinResult2, error: joinError2 } = await supabase
    .from("orders")
    .select(
      `
      *,
      profiles(*)
    `
    )
    .eq("id", orderId)
    .single();

  console.log("Join result 2:", joinResult2);
  console.log("Join error 2:", joinError2);

  // If no profile exists for this user, create one
  if (!profile && !profileError) {
    console.log("No profile found for user, creating one...");

    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        full_name: "Test User",
        phone: "+1234567890",
        city: "Test City",
        address: "Test Address",
      })
      .select()
      .single();

    console.log("Created profile:", newProfile);
    console.log("Create error:", createError);
  }

  // If no profiles exist at all, create some test data
  if (!allProfiles || allProfiles.length === 0) {
    console.log("No profiles exist, creating test data...");

    // Create test profiles
    const testProfiles = [
      {
        id: crypto.randomUUID(),
        full_name: "أحمد محمد",
        phone: "+201234567890",
        city: "القاهرة",
        address: "شارع التحرير",
      },
      {
        id: crypto.randomUUID(),
        full_name: "فاطمة علي",
        phone: "+201987654321",
        city: "الإسكندرية",
        address: "شارع الكورنيش",
      },
    ];

    // First create test products
    const testProducts = [
      {
        id: crypto.randomUUID(),
        name_ar: "iPhone 15 Pro",
        name_en: "iPhone 15 Pro",
        price: 1200,
        image_url: ["/images/products/product1.jpg"],
      },
      {
        id: crypto.randomUUID(),
        name_ar: "Samsung Galaxy S24",
        name_en: "Samsung Galaxy S24",
        price: 900,
        image_url: ["/images/products/product2.jpg"],
      },
      {
        id: crypto.randomUUID(),
        name_ar: "سماعات AirPods",
        name_en: "AirPods Pro",
        price: 250,
        image_url: ["/images/products/product3.jpg"],
      },
    ];

    const createdProducts = [];
    for (const product of testProducts) {
      const { data: createdProduct, error: productCreateError } = await supabase
        .from("products")
        .insert(product)
        .select()
        .single();

      console.log("Created test product:", createdProduct);
      if (productCreateError) {
        console.log("Product create error:", productCreateError);
      }
      if (createdProduct) {
        createdProducts.push(createdProduct);
      }
    }

    for (const profile of testProfiles) {
      const { data: createdProfile, error: createError } = await supabase
        .from("profiles")
        .insert(profile)
        .select()
        .single();

      console.log("Created test profile:", createdProfile);
      if (createError) {
        console.log("Profile create error:", createError);
      }

      // Create an order for this profile
      if (createdProfile) {
        const { data: createdOrder, error: orderCreateError } = await supabase
          .from("orders")
          .insert({
            user_id: profile.id,
            status: "pending",
            total_price: Math.floor(Math.random() * 1000) + 100,
          })
          .select()
          .single();

        console.log("Created test order:", createdOrder);
        if (orderCreateError) {
          console.log("Order create error:", orderCreateError);
        }

        // Create order items for this order
        if (createdOrder && createdProducts.length > 0) {
          const orderItems = [];
          // Add 1-3 random products to each order
          const numItems = Math.floor(Math.random() * 3) + 1;

          for (let i = 0; i < numItems; i++) {
            const randomProduct =
              createdProducts[
                Math.floor(Math.random() * createdProducts.length)
              ];
            const quantity = Math.floor(Math.random() * 3) + 1;

            orderItems.push({
              order_id: createdOrder.id,
              product_id: randomProduct.id,
              quantity: quantity,
              price: randomProduct.price,
            });
          }

          const { data: createdOrderItems, error: orderItemsError } =
            await supabase.from("order_items").insert(orderItems).select();

          console.log("Created order items:", createdOrderItems);
          console.log("Order items error:", orderItemsError);
        }
      }
    }
  }

  return { order, profile, allProfiles, joinResult, joinResult2 };
}

// Function to check current database state
export async function checkDatabaseState() {
  console.log("=== CHECKING DATABASE STATE ===");

  // Check orders
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("*");

  console.log("All orders:", orders);
  console.log("Orders error:", ordersError);

  // Check profiles
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("*");

  console.log("All profiles:", profiles);
  console.log("Profiles error:", profilesError);

  // Check products
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*");

  console.log("All products:", products);
  console.log("Products error:", productsError);

  return { orders, profiles, products };
}

// Function to create test payment data for orders
export async function createTestPaymentData() {
  console.log("=== Creating Test Payment Data ===");

  // Get all orders
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, total_price");

  if (ordersError) {
    console.error("Error fetching orders:", ordersError);
    return;
  }

  if (!orders || orders.length === 0) {
    console.log("No orders found to add payment data");
    return;
  }

  const paymentMethods = ["paypal", "stripe", "cod"];
  const paymentStatuses = ["pending", "completed", "failed"];

  for (const order of orders) {
    // Check if payment already exists for this order
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id")
      .eq("order_id", order.id)
      .single();

    if (!existingPayment) {
      const paymentData = {
        order_id: order.id,
        payment_method:
          paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        amount: order.total_price,
        payment_status:
          paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)],
        transaction_id: `TXN_${Math.random()
          .toString(36)
          .substr(2, 9)
          .toUpperCase()}`,
      };

      const { data: createdPayment, error: paymentError } = await supabase
        .from("payments")
        .insert(paymentData)
        .select()
        .single();

      console.log("Created payment for order:", order.id, createdPayment);
      if (paymentError) {
        console.log("Payment create error:", paymentError);
      }
    }
  }
}
