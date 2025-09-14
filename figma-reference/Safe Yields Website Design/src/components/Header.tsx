import { Shield } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800 backdrop-blur-md bg-black/80">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-black" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
              Safe Yields
            </span>
          </div>
        </div>
        
        <div className="hidden md:block text-sm text-gray-400">
          Not Financial Advice. Always DYOR.
        </div>
      </div>
    </header>
  );
}