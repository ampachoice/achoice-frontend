// Single source of truth for "where does this logged-in user belong."
// Before this existed, the same role → route logic was duplicated
// separately in LoginPage.jsx (correct), AdminLoginPage.jsx (never
// existed there at all — it always hardcoded /admin/dashboard), and
// ProtectedRoute.jsx (didn't have it — role mismatches just bounced to
// '/' with no idea where the user actually belonged). Any file that
// needs to know "where should this user go" should import this instead
// of re-deriving the answer.
export function getHomePathForUser(user) {
  if (!user) return "/login";

  if (user.role === "admin") return "/admin/dashboard";

  if (user.role === "staff") {
    const profile = user.staffProfile || user.staff_profile;
    return profile?.can_manage_loans ? "/staff/loans" : "/staff/agro";
  }

  if (user.role === "seller") return "/seller/dashboard";

  // buyer, or any other/unknown role
  return "/products";
}
