import { useEffect } from "react";
import { useLocation } from "wouter";
import AdminPanel from "@/components/admin/AdminPanel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth";
import { AlertTriangle } from "lucide-react";

const Admin = () => {
  const [, navigate] = useLocation();
  const { user, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 text-center">
        <p>Loading...</p>
      </div>
    );
  }

  // If logged in but not admin, show access denied
  if (user && !user.isAdmin) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Alert variant="destructive" className="max-w-lg">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access the admin panel. Please contact an administrator if you believe this is an error.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!user) return null;

  return <AdminPanel />;
};

export default Admin;
