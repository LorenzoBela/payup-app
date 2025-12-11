import { getTeamDetails } from "@/app/actions/admin";
import { notFound } from "next/navigation";
import { TeamDetailsClient } from "./client";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function TeamDetailsPage({ params }: PageProps) {
    const { id } = await params;
    const team = await getTeamDetails(id);

    if (!team) {
        notFound();
    }

    return <TeamDetailsClient team={team} />;
}
