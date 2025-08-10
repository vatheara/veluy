"use client";
import { KhqrDialog } from "../../../../packages/react/src";
import { VeluyButton } from "@/utils/veluy";
import { useState } from "react";
import { useBalance } from "@/hooks/useBalance";
import { authClient } from "@/lib/auth-client";
import { AuthModal } from "@/components/auth/auth-modal";
import { UserMenu } from "@/components/auth/user-menu";

interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  price: number;
  originalPrice?: number;
  popular?: boolean;
  bonus?: string;
  gradient: string;
  icon: string;
}

const coinPackages: CoinPackage[] = [
  {
    id: "starter",
    name: "Starter Pack",
    coins: 100,
    price: 0.99,
    gradient: "from-blue-500 to-blue-600",
    icon: "💎",
  },
  {
    id: "popular",
    name: "Popular Pack",
    coins: 500,
    price: 4.99,
    originalPrice: 5.99,
    popular: true,
    bonus: "+20% Bonus",
    gradient: "from-purple-500 to-purple-600",
    icon: "⭐",
  },
  {
    id: "premium",
    name: "Premium Pack",
    coins: 1000,
    price: 9.99,
    originalPrice: 12.99,
    bonus: "+25% Bonus",
    gradient: "from-yellow-500 to-orange-500",
    icon: "👑",
  },
  {
    id: "ultimate",
    name: "Ultimate Pack",
    coins: 2500,
    price: 19.99,
    originalPrice: 29.99,
    bonus: "+50% Bonus",
    gradient: "from-pink-500 to-rose-500",
    icon: "🚀",
  },
];

export default function Home() {
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");
  const { user, balance, loading, error, refreshBalance, addCoins } = useBalance();
  const { data: session, isPending: sessionLoading } = authClient.useSession();

  const handlePurchase = (pkg: CoinPackage) => {
    // Check if user is authenticated
    if (!session?.user) {
      setAuthModalMode("signin");
      setAuthModalOpen(true);
      return;
    }
    
    setSelectedPackage(pkg);
    console.log("Selected package:", pkg);
  };

  const openSignUp = () => {
    setAuthModalMode("signup");
    setAuthModalOpen(true);
  };

  const openSignIn = () => {
    setAuthModalMode("signin");
    setAuthModalOpen(true);
  };

  const handlePurchaseComplete = async (pkg: CoinPackage, res: any) => {
    console.log("Purchase completed:", res);
    
    // Add coins to user balance
    await addCoins(pkg.coins);
    
    // Show success message
    alert(`Successfully purchased ${pkg.name}! ${pkg.coins} coins have been added to your balance.`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Auth */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex-1">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Buy Coins
            </h1>
          </div>
          
          {/* Authentication Section */}
          <div className="flex items-center gap-4">
            {sessionLoading ? (
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            ) : session?.user ? (
              <UserMenu user={session.user} />
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={openSignIn}
                  className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={openSignUp}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="text-center mb-12">
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-6">
            {session?.user 
              ? "Choose from our carefully crafted packages below to purchase coins and unlock premium features."
              : "Sign up to start purchasing coins and unlock premium features. Choose from our carefully crafted packages below."
            }
          </p>
          
          {/* User Balance Display - Only show if authenticated */}
          {session?.user && (
            <div className="inline-flex items-center gap-4 bg-white dark:bg-slate-800 rounded-2xl px-6 py-4 shadow-lg border border-slate-200 dark:border-slate-700">
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-slate-600 dark:text-slate-300">Loading balance...</span>
                </div>
              ) : error ? (
                <div className="flex items-center gap-2 text-red-500">
                  <span>❌</span>
                  <span>Error loading balance</span>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      💰
                    </div>
                    <div className="text-left">
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {balance.toLocaleString()} coins
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        Current Balance
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={refreshBalance}
                    className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    title="Refresh balance"
                  >
                    🔄
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Coin Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-12">
          {coinPackages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                pkg.popular 
                  ? "border-purple-500 shadow-purple-500/25" 
                  : "border-slate-200 dark:border-slate-700"
              }`}
            >
              {/* Popular Badge */}
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Icon and Gradient Background */}
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${pkg.gradient} flex items-center justify-center text-2xl mb-4 mx-auto`}>
                {pkg.icon}
              </div>

              {/* Package Info */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {pkg.name}
                </h3>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {pkg.coins.toLocaleString()}
                  <span className="text-sm font-normal text-slate-500 ml-1">coins</span>
                </div>
                {pkg.bonus && (
                  <div className="text-green-600 dark:text-green-400 font-semibold text-sm">
                    {pkg.bonus}
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    ${pkg.price}
                  </span>
                  {pkg.originalPrice && (
                    <span className="text-lg text-slate-500 line-through">
                      ${pkg.originalPrice}
                    </span>
                  )}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  ${(pkg.price / pkg.coins * 100).toFixed(2)} per 100 coins
                </div>
              </div>

              {/* Purchase Button */}
              {session?.user ? (
                <VeluyButton
                  endpoint="yearlySub"
                  className={`w-full bg-gradient-to-r ${pkg.gradient} hover:opacity-90 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 border-0`}
                  content={{ buttonText: "Purchase" }}
                  onVeluyComplete={(res) => handlePurchaseComplete(pkg, res)}
                  onVeluyError={(err: any) => {
                    console.error("Purchase error:", err);
                    alert("Purchase failed. Please try again.");
                  }}
                  onStatusChange={(status) => {
                    console.log("Payment status:", status);
                  }}
                  onVeluyCancelled={() => {
                    console.log("Purchase cancelled");
                  }}
                />
              ) : (
                <button
                  onClick={() => handlePurchase(pkg)}
                  className={`w-full bg-gradient-to-r ${pkg.gradient} hover:opacity-90 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300`}
                >
                  Sign In to Purchase
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Features Section */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-8">
              What you get with coins
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-2xl mb-4 mx-auto">
                  🎯
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Premium Features</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  Unlock exclusive features and advanced capabilities
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl mb-4 mx-auto">
                  ⚡
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Faster Processing</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  Priority processing and faster response times
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center text-2xl mb-4 mx-auto">
                  🎁
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Bonus Rewards</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  Earn bonus coins and special rewards
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-slate-500 dark:text-slate-400">
          <p className="text-sm">
            Secure payments powered by Veluy • All transactions are encrypted and safe
          </p>
        </div>
      </div>

      {/* Payment Dialog */}
      <KhqrDialog />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
}
