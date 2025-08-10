import { useState, useEffect, useCallback } from 'react';
import { authClient } from '@/lib/auth-client';

interface User {
  id: string;
  email: string;
  name: string;
  balance: number;
}

interface BalanceHook {
  user: User | null;
  balance: number;
  loading: boolean;
  error: string | null;
  refreshBalance: () => Promise<void>;
  addCoins: (amount: number) => Promise<void>;
  subtractCoins: (amount: number) => Promise<void>;
}

export function useBalance(): BalanceHook {
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = authClient.useSession();

  const fetchBalance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!session?.user) {
        setUser(null);
        setBalance(0);
        return;
      }
      
      const response = await fetch('/api/balance');
      
      if (!response.ok) {
        if (response.status === 401) {
          setUser(null);
          setBalance(0);
          return;
        }
        throw new Error('Failed to fetch balance');
      }
      
      const data = await response.json();
      setUser(data);
      setBalance(data.balance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching balance:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  const refreshBalance = useCallback(async () => {
    await fetchBalance();
  }, [fetchBalance]);

  const addCoins = useCallback(async (amount: number) => {
    if (!session?.user) return;
    
    try {
      setError(null);
      const response = await fetch('/api/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'add',
          amount
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add coins');
      }
      
      const data = await response.json();
      setBalance(data.balance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add coins');
      console.error('Error adding coins:', err);
    }
  }, [session?.user]);

  const subtractCoins = useCallback(async (amount: number) => {
    if (!session?.user) return;
    
    try {
      setError(null);
      const response = await fetch('/api/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'subtract',
          amount
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to subtract coins');
      }
      
      const data = await response.json();
      setBalance(data.balance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subtract coins');
      console.error('Error subtracting coins:', err);
    }
  }, [session?.user]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    user,
    balance,
    loading,
    error,
    refreshBalance,
    addCoins,
    subtractCoins
  };
}
