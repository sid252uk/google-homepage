import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">TableFlow</h1>
          <p className="text-muted-foreground mt-2">Restaurant Table Management</p>
        </div>
        <SignIn />
      </div>
    </div>
  )
}
