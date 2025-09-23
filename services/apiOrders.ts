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

export interface ProductInfo {
  id?: string;
  name_ar: string;
  name_en: string;
  price: number;
  image_url?: string[];
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
  products?: ProductInfo;
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
  // Guest checkout customer fields
  customer_first_name?: string;
  customer_last_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_street_address?: string;
  customer_city?: string;
  customer_state?: string;
  customer_postcode?: string;
  order_notes?: string;
  created_at?: string;
  updated_at?: string;
  user?: User;
  profiles?: User;
  order_items?: OrderItem[];
  payments?: Payment[];
}

// Helper functions for customer data display
export function getCustomerName(order: Order): string {
  // Display only actual customer name from guest checkout fields
  if (order.customer_first_name && order.customer_last_name) {
    return `${order.customer_first_name} ${order.customer_last_name}`;
  }

  if (order.customer_first_name || order.customer_last_name) {
    return order.customer_first_name || order.customer_last_name || "";
  }

  return "غير محدد";
}

export function getCustomerPhone(order: Order): string | undefined {
  return order.customer_phone; // No profiles table
}

export function getCustomerEmail(order: Order): string | undefined {
  return order.customer_email; // No profiles table
}

export function getCustomerCity(order: Order): string | undefined {
  return order.customer_city; // No profiles table
}

export function getCustomerAddress(order: Order): string {
  const components = [
    order.customer_street_address,
    order.customer_city,
    order.customer_state,
    order.customer_postcode,
  ].filter(Boolean);

  return components.join(", ") || "غير محدد";
}

export function isGuestOrder(order: Order): boolean {
  return (
    !order.user_id &&
    !!(
      order.customer_first_name ||
      order.customer_last_name ||
      order.customer_phone
    )
  );
}

export function getOrderCustomerType(
  order: Order
): "registered" | "guest" | "unknown" {
  if (order.user_id) {
    return "registered";
  }

  if (
    order.customer_first_name ||
    order.customer_last_name ||
    order.customer_phone
  ) {
    return "guest";
  }

  return "unknown";
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

  // Get orders without problematic relations
  let query = supabase.from("orders").select(
    `
    *,
    order_items!order_items_order_id_fkey(
      id,
      product_id,
      quantity,
      price,
      created_at
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

  // Manually fetch product details for order items
  if (orders && orders.length > 0) {
    // Get all unique product IDs from all order items
    const productIds = orders
      .flatMap((order) => order.order_items || [])
      .map((item) => item.product_id)
      .filter(Boolean)
      .filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates

    if (productIds.length > 0) {
      // Fetch products data
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, title, name_ar, name_en, price, images, image_url")
        .in("id", productIds);

      if (!productsError && products) {
        // Map products data to order items
        orders.forEach((order) => {
          if (order.order_items) {
            order.order_items.forEach(
              (item: OrderItem & { products?: ProductInfo }) => {
                const product = products.find((p) => p.id === item.product_id);
                if (product) {
                  item.products = {
                    id: product.id,
                    name_ar: product.name_ar || product.title,
                    name_en: product.name_en || product.title,
                    price: product.price,
                    image_url: product.image_url || product.images,
                  };
                }
              }
            );
          }
        });
      } else if (productsError) {
        console.error("Error fetching products:", productsError);
      }
    }
  }

  // Enhanced client-side filtering for comprehensive search
  if (filters?.search && orders) {
    const searchTerm = filters.search.toLowerCase().trim();

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

        // Search in customer name (guest checkout fields only)
        const guestName =
          order.customer_first_name && order.customer_last_name
            ? `${order.customer_first_name} ${order.customer_last_name}`
            : order.customer_first_name || order.customer_last_name;
        const customerName = guestName;
        const matchesName = customerName?.toLowerCase().includes(searchTerm);

        // Search in phone number (guest checkout fields only)
        const customerPhone = order.customer_phone;
        const cleanPhone = customerPhone?.replace(/\D/g, "") || "";
        const cleanSearchTerm = searchTerm.replace(/\D/g, "");
        const matchesPhone =
          cleanPhone.includes(cleanSearchTerm) ||
          customerPhone?.toLowerCase().includes(searchTerm);

        // Search in order ID display format (first 8 characters)
        const orderIdDisplay = order.id?.slice(0, 8).toLowerCase();
        const matchesOrderIdDisplay = orderIdDisplay?.includes(searchTerm);

        // Search in email if available (guest checkout fields only)
        const customerEmail = order.customer_email;
        const matchesEmail = customerEmail?.toLowerCase().includes(searchTerm);

        // Search in guest checkout city and address
        const matchesCity = order.customer_city
          ?.toLowerCase()
          .includes(searchTerm);
        const matchesAddress = order.customer_street_address
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
          matchesCity ||
          matchesAddress ||
          matchesOrderNumber;

        if (matches) {
          console.log("Order matches search:", order.id?.slice(0, 8), {
            matchesOrderId,
            matchesUserId,
            matchesName,
            matchesPhone,
            matchesOrderIdDisplay,
            matchesEmail,
            matchesCity,
            matchesAddress,
            matchesOrderNumber,
            searchTerm,
            customerName,
            customerPhone,
            customerEmail,
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
  // Get order with order items (no profiles relation)
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      `
      *,
      order_items!order_items_order_id_fkey(
        id,
        product_id,
        quantity,
        price,
        created_at
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

  // Manually fetch product details for order items
  if (order && order.order_items && order.order_items.length > 0) {
    const productIds = order.order_items
      .map((item: OrderItem) => item.product_id)
      .filter(Boolean);

    if (productIds.length > 0) {
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, title, name_ar, name_en, price, images, image_url")
        .in("id", productIds);

      if (!productsError && products) {
        order.order_items.forEach(
          (item: OrderItem & { products?: ProductInfo }) => {
            const product = products.find((p) => p.id === item.product_id);
            if (product) {
              item.products = {
                id: product.id,
                name_ar: product.name_ar || product.title,
                name_en: product.name_en || product.title,
                price: product.price,
                image_url: product.image_url || product.images,
              };
            }
          }
        );
      }
    }
  }

  return order;
}

// Helper function to check if order exists
export async function checkOrderExists(id: string): Promise<boolean> {
  console.log(`Checking if order exists: ${id}`);

  const { data, error } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", id)
    .single();

  console.log("Order existence check result:", { data, error });

  if (error) {
    if (error.code === "PGRST116") {
      console.log("Order not found (PGRST116)");
      return false;
    }
    console.error("Error checking order existence:", error);
    return false;
  }

  const exists = !!data;
  console.log(`Order exists: ${exists}`);
  return exists;
}

// Debug function for specific order
export async function debugSpecificOrder(id: string) {
  console.log(`=== DEBUGGING ORDER: ${id} ===`);

  // Check if order exists at all
  const { data: allOrders, error: allError } = await supabase
    .from("orders")
    .select("id, status")
    .limit(5);

  console.log("Sample orders in database:", allOrders);
  console.log("Error getting all orders:", allError);

  // Search for the specific order
  const { data: specificOrder, error: specificError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id);

  console.log("Specific order search (array):", specificOrder);
  console.log("Specific order error:", specificError);

  // Try single query
  const { data: singleOrder, error: singleError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  console.log("Single order result:", singleOrder);
  console.log("Single order error:", singleError);

  return {
    allOrders,
    specificOrder,
    singleOrder,
    errors: { allError, specificError, singleError },
  };
}

// Simple update test function
export async function testSimpleUpdate(id: string, newStatus: string) {
  console.log(`=== TESTING SIMPLE UPDATE FOR ORDER: ${id} ===`);

  // Method 1: Direct update
  console.log("Method 1: Direct update");
  const { error: directError } = await supabase
    .from("orders")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  console.log("Direct update error:", directError);

  // Method 2: Check if we can read the current order
  console.log("Method 2: Check read permissions");
  const { data: readOrder, error: readError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  console.log("Read order result:", readOrder, readError);

  // Method 3: Test with different fields
  console.log("Method 3: Test updating different field");
  const { data: testField, error: testFieldError } = await supabase
    .from("orders")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("updated_at");

  console.log("Test field update result:", testField, testFieldError);

  return { directError, readOrder, testField };
}

export async function updateOrderStatus(
  id: string,
  status: Order["status"]
): Promise<Order> {
  console.log(`Updating order ${id} to status: ${status}`);

  // First, check if the order exists
  const orderExists = await checkOrderExists(id);
  if (!orderExists) {
    // Run debug function to understand why order is not found
    await debugSpecificOrder(id);
    throw new Error("الطلب غير موجود أو تم حذفه");
  }

  // Get current order data
  const { data: currentOrder, error: getCurrentError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (getCurrentError || !currentOrder) {
    console.error("خطأ في جلب بيانات الطلب:", getCurrentError);
    throw new Error("لم يتم العثور على الطلب");
  }

  console.log(`Order found with current status: ${currentOrder.status}`);

  // Check if we're trying to update to the same status
  if (currentOrder.status === status) {
    console.log(
      "Status is already the same, but will proceed with update anyway"
    );
  }

  // Use the reliable update approach (update then fetch separately)
  // This avoids RLS policy issues with update+select in one query
  console.log("Updating order with reliable approach:", {
    id,
    status,
    updated_at: new Date().toISOString(),
  });

  // Step 1: Perform the update without select
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    console.error("خطأ في تحديث حالة الطلب:", updateError);
    throw new Error(`تعذر تحديث حالة الطلب: ${updateError.message}`);
  }

  console.log("Update completed successfully");

  // Step 2: Fetch the updated order separately
  const { data: updatedOrder, error: fetchError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !updatedOrder) {
    console.error("Failed to fetch updated order:", fetchError);
    throw new Error("تم التحديث ولكن فشل في جلب البيانات المحدثة");
  }

  console.log(
    `Order ${id} updated successfully to status: ${updatedOrder.status}`
  );
  console.log("Updated order data:", updatedOrder);

  return updatedOrder;
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
  const { data: joinResult } = await supabase
    .from("orders")
    .select(
      `
      *,
      profiles!orders_user_id_fkey(*)
    `
    )
    .eq("id", orderId)
    .single();

  // Try different join approaches
  const { data: joinResult2 } = await supabase
    .from("orders")
    .select(
      `
      *,
      profiles(*)
    `
    )
    .eq("id", orderId)
    .single();

  // If no profile exists for this user, create one
  if (!profile && !profileError) {
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
// Test function to check database connectivity and orders
export async function testOrdersConnection() {
  console.log("=== Testing Orders Connection ===");

  try {
    // Test basic orders fetch
    const {
      data: allOrders,
      error: allOrdersError,
      count,
    } = await supabase.from("orders").select("*", { count: "exact" }).limit(5);

    console.log("Basic orders test:");
    console.log("- Orders found:", allOrders?.length || 0);
    console.log("- Total count:", count);
    console.log("- Error:", allOrdersError);
    if (allOrders && allOrders.length > 0) {
      console.log("- Sample order:", allOrders[0]);
      console.log(
        "- Order ID type:",
        typeof allOrders[0].id,
        "Value:",
        allOrders[0].id
      );
      console.log("- Guest fields:", {
        firstName: allOrders[0].customer_first_name,
        lastName: allOrders[0].customer_last_name,
        phone: allOrders[0].customer_phone,
        hasUserID: !!allOrders[0].user_id,
      });
    }

    // Test order_items fetch
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .limit(5);

    console.log("Order items test:");
    console.log("- Items found:", orderItems?.length || 0);
    console.log("- Error:", itemsError);
    console.log("- Sample item:", orderItems?.[0]);

    // Test products fetch
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .limit(5);

    console.log("Products test:");
    console.log("- Products found:", products?.length || 0);
    console.log("- Error:", productsError);
    console.log("- Sample product:", products?.[0]);

    return {
      ordersCount: allOrders?.length || 0,
      totalCount: count,
      hasError: !!(allOrdersError || itemsError || productsError),
      errors: { allOrdersError, itemsError, productsError },
    };
  } catch (error) {
    console.error("Test connection error:", error);
    return {
      ordersCount: 0,
      totalCount: 0,
      hasError: true,
      errors: { connectionError: error },
    };
  }
}

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
