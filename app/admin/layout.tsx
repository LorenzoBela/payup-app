import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { isSuperAdmin } from "@/lib/auth-utils";
import { AdminLayout } from "./components/admin-layout";

export default async function AdminRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Get current user
    const user = await currentUser();
    
    if (!user) {
        redirect("/signin");
    }

    // Check if user is a SuperAdmin
    const isAdmin = await isSuperAdmin(user.id);
    
    if (!isAdmin) {
        // Redirect non-admin users to the regular dashboard
        redirect("/dashboard");
    }

    return <AdminLayout>{children}</AdminLayout>;
}

