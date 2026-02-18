import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { LogIn, Wallet, Eye, EyeOff, Vote } from "lucide-react";
import { motion } from "framer-motion";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const wallet = useWallet();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Optional wallet signature verification
      if (wallet.isConnected) {
        const sig = await wallet.signMessage(`Sign in to BlockVote\nTimestamp: ${Date.now()}`);
        if (!sig) {
          toast({ title: "Wallet signature required", variant: "destructive" });
          setIsSubmitting(false);
          return;
        }
      }
      await login(data.email, data.password);
      toast({ title: "Welcome back!" });
      // Role-based redirect handled by auth context user
      const savedUser = localStorage.getItem("bv_user");
      if (savedUser) {
        const user = JSON.parse(savedUser);
        navigate(user.role === "admin" ? "/admin" : "/voter");
      }
    } catch (err: any) {
      toast({ title: err.message || "Login failed", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md p-8"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20">
            <Vote className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your BlockVote account</p>
        </div>

        {/* Demo credentials */}
        <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs">
          <p className="mb-1 font-semibold text-primary">Demo Credentials</p>
          <p className="text-muted-foreground">Admin: admin@blockvote.io / Admin@123</p>
          <p className="text-muted-foreground">Voter: voter@blockvote.io / Voter@123</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input {...register("email")} type="email" placeholder="you@example.com" className="mt-1 bg-secondary/50" />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div>
            <Label>Password</Label>
            <div className="relative mt-1">
              <Input {...register("password")} type={showPw ? "text" : "password"} className="bg-secondary/50 pr-10" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-2.5 text-muted-foreground">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div>
            <Label>MetaMask (Optional)</Label>
            {wallet.isConnected ? (
              <div className="mt-1 flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm">
                <Wallet className="h-4 w-4 text-primary" />
                <span className="truncate font-mono text-xs">{wallet.address}</span>
              </div>
            ) : (
              <Button type="button" variant="outline" onClick={wallet.connect} disabled={wallet.isConnecting} className="mt-1 w-full">
                <Wallet className="mr-2 h-4 w-4" />
                {wallet.isConnecting ? "Connecting..." : "Connect MetaMask"}
              </Button>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full glow-primary">
            <LogIn className="mr-2 h-4 w-4" />
            {isSubmitting ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/auth/register" className="font-medium text-primary hover:underline">Create Account</Link>
        </p>
      </motion.div>
    </div>
  );
}
