import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";

const LoginPage = () => {
  const navigate = useNavigate();
  const { signIn, isLoading, isAuthenticated, profile } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    console.log("LoginPage useEffect - isAuthenticated:", isAuthenticated, "profile:", profile);
    if (isAuthenticated && profile) {
      const role = profile?.preferences?.role;
      console.log("Redirecting authenticated user, role:", role);
      navigate("/");
    }
  }, [isAuthenticated, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone || !password) {
      toast.error("Please enter phone number and password");
      return;
    }

    try {
      console.log("Attempting login with:", phone);
      const profile = await signIn(phone, password);
      console.log("Login successful, profile:", profile);
      toast.success("Signed in successfully!");

      // Redirect immediately after successful login
      const role = profile?.preferences?.role;
      console.log("User role:", role);
      navigate("/");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Failed to sign in. Please set up Supabase credentials.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-950 via-violet-900 to-purple-950 p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">Welcome Back</CardTitle>
          <CardDescription className="text-white/70">
            Sign in to continue your learning journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white">Phone or Email</Label>
              <Input
                id="phone"
                type="text"
                placeholder="0912345678 or abdella@mewada.com"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          <div className="mt-4 space-y-2">
            <p className="text-center text-white/70">
              Need an account? Contact your teacher for credentials.
            </p>
            <p className="text-center text-sm">
              <Link to="/teachers" className="text-white/60 hover:text-white underline">
                Teacher Dashboard
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
