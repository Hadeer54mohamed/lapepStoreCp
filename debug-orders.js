// Debug script for testing orders connection
// Run this in the browser console on the dashboard

async function debugOrders() {
  console.log("=== DEBUGGING ORDERS ISSUE ===");

  try {
    // Import the test function (you need to import this in your dashboard)
    // For now, we'll run direct Supabase queries

    console.log("1. Testing direct Supabase connection...");

    // Test basic orders query
    const response1 = await fetch("/api/debug-orders-basic");
    console.log("Basic orders API response:", response1.status);

    // Test orders with relations
    const response2 = await fetch("/api/debug-orders-full");
    console.log("Full orders API response:", response2.status);

    console.log("If both responses are 404, the issue is in the API routes");
    console.log("If they work, the issue is in the React components");
  } catch (error) {
    console.error("Debug script error:", error);
  }
}

// Instructions for manual testing:
console.log(`
🔍 DEBUGGING ORDERS ISSUE - Manual Steps:

1. Open Dashboard orders page
2. Open browser developer tools (F12)
3. Go to Console tab
4. Run: debugOrders()

OR manually check:

1. Network tab - check if API calls are being made
2. Check console for any JavaScript errors
3. Check if Supabase queries are returning data
4. Verify that orders table has data

Quick fixes to try:
- Refresh the page
- Clear browser cache
- Check if you're on the right Supabase project
- Verify environment variables are correct
`);

// Export for use in React components
if (typeof module !== "undefined" && module.exports) {
  module.exports = { debugOrders };
}
