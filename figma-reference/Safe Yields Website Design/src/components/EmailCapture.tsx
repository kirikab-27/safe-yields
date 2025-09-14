import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Mail } from "lucide-react";

export function EmailCapture() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail("");
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  return (
    <section className="py-20 bg-gradient-to-r from-green-950/20 to-transparent">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-green-400" />
          </div>
          
          <h2 className="text-3xl font-bold mb-4">Get Weekly Safety Reports</h2>
          <p className="text-gray-400 mb-8">
            Stay updated on protocol safety scores, new audits, and risk alerts.
          </p>

          {isSubscribed ? (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-green-400">
              Thanks for subscribing! Check your email for confirmation.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-3">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 bg-gray-900 border-gray-700 focus:border-green-400"
              />
              <Button 
                type="submit" 
                className="bg-green-500 hover:bg-green-600 text-black font-medium px-8"
              >
                Subscribe
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}