import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";

const SignUpPage = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !phone || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      await register({ fullName, phone, password });
      toast.success("Account created successfully!");
      navigate("/grades");
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-950 via-violet-900 to-purple-950 p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">Registration Disabled</CardTitle>
          <CardDescription className="text-white/70">
            Public registration is not available
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex justify-center">
            <AlertCircle className="h-16 w-16 text-yellow-400" />
          </div>
          <p className="text-white/80">
            Student accounts can only be created by teachers. Please contact your teacher to get your login credentials.
          </p>
          <Button
            onClick={() => navigate("/login")}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black font-semibold"
          >
            Go to Sign In
          </Button>
          <p className="text-sm text-white/60">
            Already have an account?{" "}
            <Link to="/login" className="text-yellow-400 hover:underline">
              Sign in here
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUpPage;
