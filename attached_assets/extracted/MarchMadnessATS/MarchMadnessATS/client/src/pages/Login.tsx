import { useEffect } from "react";
import { useLocation } from "wouter";
import LoginForm from "@/components/auth/LoginForm";
import { useAuth } from "@/lib/auth";

const Login = () => {
  const [, navigate] = useLocation();
  const { user, isLoading } = useAuth();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-200px)]">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-200px)]">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;
