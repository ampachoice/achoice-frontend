export function getHomePathForUser(user) {
  if (!user || !user.role) return "/login"

  const role = String(user.role).toLowerCase()

  if (role === "admin") return "/admin/dashboard"

  if (role === "staff") {
    const profile = user.staffProfile || user.staff_profile
    return profile?.can_manage_loans ? "/staff/loans" : "/staff/agro"
  }

  if (role === "seller") return "/seller/dashboard"

  if (role === "buyer") return "/products"

  return "/login"
}