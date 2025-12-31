"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Users, Plus, Copy, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { createTeam, joinTeam } from "@/app/actions/teams";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function TeamPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [teamName, setTeamName] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await createTeam(teamName);
      if (result.success && result.team) {
        setGeneratedCode(result.team.code);
        toast.success("Team created successfully!");
      } else {
        toast.error(result.error || "Failed to create team");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await joinTeam(teamCode);
      if (result.success) {
        toast.success("Joined team successfully!");
        router.push("/dashboard");
      } else {
        toast.error(result.error || "Failed to join team");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Code copied to clipboard");
    }
  };

  const handleContinueToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b-2 border-border bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <DollarSign className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-secondary">PayUp</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8 fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-3">
              Set Up Your Team
            </h1>
            <p className="text-lg text-muted-foreground">
              Create a new team or join an existing one to start tracking expenses
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 fade-in-up-delay-1">
            <button
              onClick={() => setActiveTab("create")}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${activeTab === "create"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-card text-muted-foreground hover:bg-muted border-2 border-border"
                }`}
            >
              <Plus className="w-5 h-5 inline-block mr-2 -mt-1" />
              Create Team
            </button>
            <button
              onClick={() => setActiveTab("join")}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${activeTab === "join"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-card text-muted-foreground hover:bg-muted border-2 border-border"
                }`}
            >
              <Users className="w-5 h-5 inline-block mr-2 -mt-1" />
              Join Team
            </button>
          </div>

          {/* Create Team Tab */}
          {activeTab === "create" && (
            <Card className="bg-card border-2 border-border fade-in-up-delay-2">
              <CardHeader>
                <CardTitle className="text-2xl text-card-foreground">Create Your Team</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Set up a new team and invite your team members
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!generatedCode ? (
                  <form onSubmit={handleCreateTeam} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="teamName" className="text-card-foreground">
                        Team Name
                      </Label>
                      <Input
                        id="teamName"
                        type="text"
                        placeholder="e.g., Team 2025"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        required
                        disabled={isLoading}
                        className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary"
                      />
                      <p className="text-sm text-muted-foreground">
                        Choose a name that your team members will recognize
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-5 h-5 mr-2" />
                          Create Team
                        </>
                      )}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center p-6 bg-secondary/50 rounded-lg border-2 border-primary/20">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4 shadow-lg shadow-primary/20">
                        <Check className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        Team Created Successfully!
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Your team &quot;{teamName}&quot; is ready. Share this code with your members:
                      </p>
                      <div className="bg-card/50 border border-border rounded-lg p-4 mb-4 backdrop-blur-sm">
                        <div className="text-4xl font-bold text-primary tracking-wider mb-2 font-mono">
                          {generatedCode}
                        </div>
                        <button
                          onClick={copyToClipboard}
                          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {copied ? (
                            <>
                              <Check className="w-4 h-4 text-green-500" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy Code
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Team members can use this code to join your team
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Button
                        onClick={handleContinueToDashboard}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all hover:scale-105"
                      >
                        Continue to Dashboard
                      </Button>
                      <Button
                        onClick={() => {
                          setGeneratedCode(null);
                          setTeamName("");
                        }}
                        variant="outline"
                        className="w-full border-2 border-border text-foreground hover:bg-muted"
                      >
                        Create Another Team
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Join Team Tab */}
          {activeTab === "join" && (
            <Card className="bg-card border-2 border-border fade-in-up-delay-2">
              <CardHeader>
                <CardTitle className="text-2xl text-card-foreground">Join a Team</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Enter the 6-character code shared by your team leader
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleJoinTeam} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="teamCode" className="text-card-foreground">
                      Team Code
                    </Label>
                    <Input
                      id="teamCode"
                      type="text"
                      placeholder="ABC123"
                      value={teamCode}
                      onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                      required
                      maxLength={6}
                      disabled={isLoading}
                      className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary text-2xl text-center font-mono tracking-wider uppercase"
                      style={{ letterSpacing: "0.5em" }}
                    />
                    <p className="text-sm text-muted-foreground">
                      Ask your team leader for the team code
                    </p>
                  </div>

                  <div className="bg-muted/50 border-2 border-border rounded-lg p-4 space-y-2">
                    <h4 className="font-semibold text-card-foreground flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      What happens next?
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                      <li>You&apos;ll join the team immediately</li>
                      <li>See all team expenses and settlements</li>
                      <li>Start adding expenses that auto-split with team members</li>
                    </ul>
                  </div>

                  <Button
                    type="submit"
                    disabled={teamCode.length !== 6 || isLoading}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      "Join Team"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="mt-6 text-center fade-in-up-delay-3">
            <p className="text-sm text-muted-foreground">
              Need help?{" "}
              <Link href="#" className="text-primary hover:text-primary/80 transition-colors">
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-border py-6 bg-background">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 PayUp. Built for everyone.
          </p>
        </div>
      </footer>
    </div>
  );
}

