"use client";

import { useTeam } from "@/components/dashboard/team-provider";
import { TeamSwitcher } from "@/components/team-switcher";

export function MobileTeamSwitcher() {
    const { teams, selectedTeam, setSelectedTeam } = useTeam();

    return (
        <TeamSwitcher
            teams={teams}
            selectedTeam={selectedTeam}
            onTeamSelect={setSelectedTeam}
            className="w-full max-w-full text-sm"
        />
    );
}
