"use client";

import * as React from "react";
import { Check, ChevronsUpDown, PlusCircle, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

type Team = {
    id: string;
    name: string;
    code: string;
    role: string;
    memberCount: number;
};

interface TeamSwitcherProps {
    teams: Team[];
    selectedTeam: Team | null;
    onTeamSelect: (team: Team) => void;
    className?: string;
    onCreateTeamClick?: () => void;
    onJoinTeamClick?: () => void;
}

export function TeamSwitcher({
    teams,
    selectedTeam,
    onTeamSelect,
    className,
    onCreateTeamClick,
    onJoinTeamClick,
}: TeamSwitcherProps) {
    const [open, setOpen] = React.useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    aria-label="Select a team"
                    className={cn("w-[200px] justify-between", className)}
                >
                    <Users className="mr-2 h-4 w-4" />
                    {selectedTeam ? selectedTeam.name : "Select a team"}
                    <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandList>
                        <CommandInput placeholder="Search team..." />
                        <CommandEmpty>No team found.</CommandEmpty>
                        <CommandGroup heading="Teams">
                            {teams.map((team) => (
                                <CommandItem
                                    key={team.id}
                                    onSelect={() => {
                                        onTeamSelect(team);
                                        setOpen(false);
                                    }}
                                    className="text-sm"
                                >
                                    <Users className="mr-2 h-4 w-4" />
                                    {team.name}
                                    <Check
                                        className={cn(
                                            "ml-auto h-4 w-4",
                                            selectedTeam?.id === team.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                    <CommandSeparator />
                    <CommandList>
                        <CommandGroup>
                            <CommandItem
                                onSelect={() => {
                                    setOpen(false);
                                    if (onCreateTeamClick) onCreateTeamClick();
                                }}
                            >
                                <PlusCircle className="mr-2 h-5 w-5" />
                                Create Team
                            </CommandItem>
                            <CommandItem
                                onSelect={() => {
                                    setOpen(false);
                                    if (onJoinTeamClick) onJoinTeamClick();
                                }}
                            >
                                <Users className="mr-2 h-5 w-5" />
                                Join Team
                            </CommandItem>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
