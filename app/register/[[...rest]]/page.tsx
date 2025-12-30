import { SignUp } from "@clerk/nextjs";

export default function RegisterPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background relative overflow-hidden">
            <style dangerouslySetInnerHTML={{__html: `
                button.cl-socialButtonsIconButton,
                button.cl-socialButtonsBlockButton,
                .cl-socialButtonsIconButton,
                .cl-socialButtonsBlockButton {
                    background-color: #ff5c00 !important;
                    background: #ff5c00 !important;
                    border-color: #ff5c00 !important;
                    border: 1px solid #ff5c00 !important;
                    color: white !important;
                }
                button.cl-socialButtonsIconButton:hover,
                button.cl-socialButtonsBlockButton:hover,
                .cl-socialButtonsIconButton:hover,
                .cl-socialButtonsBlockButton:hover {
                    background-color: rgba(255, 92, 0, 0.9) !important;
                    background: rgba(255, 92, 0, 0.9) !important;
                }
            `}} />
            {/* Background Effects */}
            <div className="absolute top-0 left-0 -z-10 w-[80vw] h-[80vh] opacity-10 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-radial from-primary/20 to-transparent blur-3xl" />
            </div>

            <SignUp
                forceRedirectUrl="/dashboard"
                signInUrl="/signin"
                appearance={{
                    variables: {
                        colorPrimary: '#ff5c00',
                        colorBackground: '#09090b',
                        colorInputBackground: '#18181b',
                        colorText: '#ffffff',
                        borderRadius: '0rem',
                    },
                    elements: {
                        rootBox: "w-full max-w-md",
                        card: "bg-background/50 backdrop-blur-md border border-white/10 shadow-none rounded-none p-8",
                        headerTitle: "text-2xl font-bold tracking-tight text-foreground",
                        headerSubtitle: "text-muted-foreground",
                        socialButtonsBlockButton: "rounded-none transition-colors",
                        socialButtonsIconButton: "rounded-none transition-colors",
                        dividerLine: "bg-white/10",
                        dividerText: "text-muted-foreground",
                        formFieldLabel: "text-muted-foreground uppercase text-xs tracking-wider",
                        formFieldInput: "rounded-none border-white/10 bg-white/5 text-foreground focus:border-primary transition-colors",
                        footerActionLink: "text-primary hover:text-primary/90 transition-colors",
                        formButtonPrimary: "rounded-none bg-primary hover:bg-primary/90 text-primary-foreground transition-colors shadow-none uppercase tracking-wider font-medium text-sm h-10",
                    }
                }}
            />
        </div>
    );
}
