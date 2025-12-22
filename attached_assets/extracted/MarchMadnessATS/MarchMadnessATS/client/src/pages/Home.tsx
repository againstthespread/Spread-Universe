import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BasketballIcon from "@/components/ui/basketball-icon";
import { useAuth } from "@/lib/auth";

const Home = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="py-12 md:py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-block text-accent mb-4">
            <BasketballIcon className="text-6xl" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            NCAA March Madness Pick'Em
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Test your college basketball knowledge by making picks against the spread 
            in our March Madness tournament challenge.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button className="text-lg py-6 px-8 bg-secondary hover:bg-secondary/90 text-white">
                Join the Challenge
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="text-lg py-6 px-8 border-primary text-primary">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-12 bg-gray-50 rounded-lg my-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-primary text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold mx-auto">
                    1
                  </div>
                </div>
                <h3 className="text-xl font-bold text-center mb-3">Make Your Picks</h3>
                <p className="text-gray-600 text-center">
                  For each tournament game, pick which team will cover the spread. Points increase as the tournament progresses!
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold mx-auto">
                    2
                  </div>
                </div>
                <h3 className="text-xl font-bold text-center mb-3">Earn Points</h3>
                <p className="text-gray-600 text-center">
                  Each correct pick earns you points: 10 for Round of 64, 20 for Round of 32, all the way up to 320 for the championship!
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold mx-auto">
                    3
                  </div>
                </div>
                <h3 className="text-xl font-bold text-center mb-3">Win the Tournament</h3>
                <p className="text-gray-600 text-center">
                  Compete against other players and climb the leaderboard. The player with the most points at the end wins!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Points Breakdown */}
      <div className="py-12 my-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-primary text-center mb-8">
            Points System
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white shadow-md rounded-lg p-4 text-center">
              <h3 className="font-bold mb-2">Round of 64</h3>
              <div className="text-2xl font-bold text-primary">10 pts</div>
            </div>
            <div className="bg-white shadow-md rounded-lg p-4 text-center">
              <h3 className="font-bold mb-2">Round of 32</h3>
              <div className="text-2xl font-bold text-primary">20 pts</div>
            </div>
            <div className="bg-white shadow-md rounded-lg p-4 text-center">
              <h3 className="font-bold mb-2">Sweet 16</h3>
              <div className="text-2xl font-bold text-primary">40 pts</div>
            </div>
            <div className="bg-white shadow-md rounded-lg p-4 text-center">
              <h3 className="font-bold mb-2">Elite 8</h3>
              <div className="text-2xl font-bold text-primary">80 pts</div>
            </div>
            <div className="bg-white shadow-md rounded-lg p-4 text-center">
              <h3 className="font-bold mb-2">Final Four</h3>
              <div className="text-2xl font-bold text-primary">160 pts</div>
            </div>
            <div className="bg-white shadow-md rounded-lg p-4 text-center bg-gray-50 border-2 border-secondary">
              <h3 className="font-bold mb-2 text-secondary">Championship</h3>
              <div className="text-2xl font-bold text-secondary">320 pts</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-12 bg-primary text-white rounded-lg my-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Play?</h2>
          <p className="text-xl mb-8">
            Join now to start making your picks and compete with other basketball fans!
          </p>
          <Link href="/register">
            <Button className="text-lg py-6 px-8 bg-accent hover:bg-accent/90 text-primary font-bold">
              Sign Up Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
