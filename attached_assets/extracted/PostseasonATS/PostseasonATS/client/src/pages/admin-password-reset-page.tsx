import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Key, Copy, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminPasswordResetPage() {
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [temporaryPassword, setTemporaryPassword] = useState<string>("");
  const [resetUsername, setResetUsername] = useState<string>("");

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("POST", "/api/admin/reset-password", { userId });
      return await res.json();
    },
    onSuccess: (data) => {
      setTemporaryPassword(data.temporaryPassword);
      setResetUsername(data.username);
      toast({
        title: "Password reset successful",
        description: `Temporary password generated for ${data.username}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reset password",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleResetPassword = () => {
    if (!selectedUserId) {
      toast({
        title: "No user selected",
        description: "Please select a user to reset their password",
        variant: "destructive",
      });
      return;
    }
    resetPasswordMutation.mutate(selectedUserId);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(temporaryPassword);
    toast({
      title: "Copied!",
      description: "Temporary password copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const nonAdminUsers = users?.filter(u => !u.isAdmin) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2">Password Reset</h1>
        <p className="text-muted-foreground">
          Reset user passwords with a temporary password that must be changed on next login
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reset Password Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Reset Password
            </CardTitle>
            <CardDescription>
              Generate a temporary password for a user
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-select">Select User</Label>
              <Select 
                value={selectedUserId} 
                onValueChange={setSelectedUserId}
              >
                <SelectTrigger id="user-select" data-testid="select-user">
                  <SelectValue placeholder="Choose a user" />
                </SelectTrigger>
                <SelectContent>
                  {nonAdminUsers.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No users available
                    </div>
                  ) : (
                    nonAdminUsers.map((user) => (
                      <SelectItem 
                        key={user.id} 
                        value={user.id}
                        data-testid={`option-user-${user.id}`}
                      >
                        {user.displayName || user.username} (@{user.username})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleResetPassword}
              disabled={!selectedUserId || resetPasswordMutation.isPending}
              className="w-full"
              data-testid="button-reset-password"
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  Reset Password
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Temporary Password Display */}
        {temporaryPassword && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Temporary Password Generated
              </CardTitle>
              <CardDescription>
                Share this password with {resetUsername}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Username: {resetUsername}</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-muted rounded text-sm font-mono">
                        {temporaryPassword}
                      </code>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={copyToClipboard}
                        data-testid="button-copy-password"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Important:</strong> The user will be required to change this password upon their next login.
                  Make sure to communicate this temporary password to them securely.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How Password Reset Works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Select the user who needs a password reset</li>
            <li>Click "Reset Password" to generate a temporary password</li>
            <li>Copy and securely share the temporary password with the user</li>
            <li>The user logs in with their username and the temporary password</li>
            <li>They will be immediately prompted to set a new password</li>
            <li>Once they set a new password, they can use the app normally</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
