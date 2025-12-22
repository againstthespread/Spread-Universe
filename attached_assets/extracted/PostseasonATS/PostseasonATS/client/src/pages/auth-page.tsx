import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({ 
    username: "", 
    password: "", 
    displayName: ""
  });

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(registerData);
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left side - Forms */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <i className="fas fa-football-ball text-primary text-5xl mb-4"></i>
            <h1 className="text-4xl font-bold mb-2">NFL Playoffs ATS</h1>
            <p className="text-muted-foreground">Welcome back! Sign in to make your picks.</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Sign In</CardTitle>
                  <CardDescription>Enter your credentials to access your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-username">Username</Label>
                      <Input
                        id="login-username"
                        type="text"
                        placeholder="Enter your username"
                        value={loginData.username}
                        onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                        required
                        data-testid="input-login-username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                        data-testid="input-login-password"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                      data-testid="button-login"
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>Register to start making picks</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-username">Username</Label>
                      <Input
                        id="register-username"
                        type="text"
                        placeholder="Choose a username"
                        value={registerData.username}
                        onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                        required
                        data-testid="input-register-username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-displayName">Display Name (Optional)</Label>
                      <Input
                        id="register-displayName"
                        type="text"
                        placeholder="Your display name"
                        value={registerData.displayName}
                        onChange={(e) => setRegisterData({ ...registerData, displayName: e.target.value })}
                        data-testid="input-register-displayname"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Choose a password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        required
                        data-testid="input-register-password"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                      data-testid="button-register"
                    >
                      {registerMutation.isPending ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero section */}
      <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-background p-8">
        <div className="max-w-md text-center space-y-6">
          <i className="fas fa-trophy text-primary text-7xl"></i>
          <h2 className="text-3xl font-bold">NFL Playoffs Pick'em</h2>
          <p className="text-lg text-muted-foreground">
            Pick winners against the spread throughout the NFL playoffs. 
            Earn increasing points as the stakes get higher - from Wild Card (125 pts) 
            to the Super Bowl (1000 pts).
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 bg-card rounded-md">
              <div className="text-2xl font-bold text-primary">125</div>
              <div className="text-sm text-muted-foreground">Wild Card</div>
            </div>
            <div className="p-4 bg-card rounded-md">
              <div className="text-2xl font-bold text-primary">250</div>
              <div className="text-sm text-muted-foreground">Divisional</div>
            </div>
            <div className="p-4 bg-card rounded-md">
              <div className="text-2xl font-bold text-primary">500</div>
              <div className="text-sm text-muted-foreground">Conference</div>
            </div>
            <div className="p-4 bg-card rounded-md">
              <div className="text-2xl font-bold text-primary">1000</div>
              <div className="text-sm text-muted-foreground">Super Bowl</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
