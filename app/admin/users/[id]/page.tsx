import { getUserDetails } from "@/app/actions/admin";
import { notFound } from "next/navigation";
import { UserDetailsClient } from "./client";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function UserDetailsPage({ params }: PageProps) {
    const { id } = await params;
    const user = await getUserDetails(id);

    if (!user) {
        notFound();
    }

    return <UserDetailsClient user={user} />;
}
