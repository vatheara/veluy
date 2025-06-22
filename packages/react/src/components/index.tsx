import { Button } from "@repo/ui/components/button";
import type { TransactionRoute, TransactionRouter } from "veluy/types";
import type { VeluyComponentProps, UseVeluyProps } from "../types";
import { useKhqr, type TransactionStatus } from "../hook";
import { useRef, useState, useCallback, useEffect } from "react";

export type AnyTransactionRoute = TransactionRoute<any>;
export type ProgressGranularity = "all" | "fine" | "coarse";
export type ErrorMessage<TError extends string> = TError;

export type inferEndpointOutput<TFileRoute extends AnyTransactionRoute> =
  TFileRoute["$types"]["output"];

export type inferEndpointInput<TFileRoute extends AnyTransactionRoute> =
  TFileRoute["$types"]["input"];

export type TransactionStatusResponse = {
  status: TransactionStatus;
  hash: string;
  message?: string;
  data?: any;
  progress?: number;
};

export type VeluyButtonProps<
  TRouter extends TransactionRouter,
  TEndpoint extends keyof TRouter,
> = VeluyComponentProps<TRouter, TEndpoint> & {
  /**
   * @see https://docs.uploadthing.com/theming#style-using-the-classname-prop
   */
  className?: string;
  /**
   * @see https://docs.uploadthing.com/theming#style-using-the-appearance-prop
   */
  appearance?: any;
  /**
   * @see https://docs.uploadthing.com/theming#content-customisation
   */
  content?: any;
  /**
   * Called when transaction completes successfully
   */
  onVeluyComplete?: (res: inferEndpointOutput<TRouter[TEndpoint]>) => void;
  /**
   * Called when transaction fails
   */
  onVeluyError?: (err: any) => void;
  /**
   * Called when transaction begins
   */
  onVeluyBegin?: (hash: string) => void;
  /**
   * Called when transaction status changes (every 5s check)
   */
  onStatusChange?: (status: TransactionStatusResponse) => void;
  /**
   * Called when transaction is cancelled
   */
  onVeluyCancelled?: (hash: string) => void;
  /**
   * Called when transaction expires
   */
  onVeluyExpired?: (hash: string) => void;
  /**
   * Status check interval in milliseconds (default: 5000ms)
   */
  statusCheckInterval?: number;
};

/** 
 * A subset of the standard RequestInit properties needed by Veluy internally.
 * @see RequestInit from lib.dom.d.ts
*/
export interface RequestInitEsque {
  /**
   * Sets the request's body.
   */
  body?: FormData | ReadableStream | string | null;

  /**
   * Sets the request's associated headers.
   */
  headers?: [string, string][] | Record<string, string>;

  /**
   * The request's HTTP-style method.
   */
  method?: string;
}

/**
 * A subset of the standard Response properties needed by Veluy internally.
 * @see Response from lib.dom.d.ts
 */
export interface ResponseEsque {
  status: number;
  statusText: string;
  ok: boolean;
  /**
   * @remarks
   * The built-in Response::json() method returns Promise<any>, but
   * that's not as type-safe as unknown. We use unknown because we're
   * more type-safe. You do want more type safety, right? 😉
   */
  json: <T = unknown>() => Promise<T>;
  text: () => Promise<string>;
  blob: () => Promise<Blob>;
  body: ReadableStream | null;

  headers: Headers;

  clone: () => ResponseEsque;
}

/**
 * A subset of the standard fetch function type needed by Veluy internally.
 * @see fetch from lib.dom.d.ts
 */
export type FetchEsque = (
  input: RequestInfo,
  init?: RequestInit | RequestInitEsque,
) => Promise<ResponseEsque>;

export interface GenerateTypedHelpersOptions {
  /**
   * URL to the Veluy API endpoint
   * @example "/api/veluy"
   * @example "https://www.example.com/api/veluy"
   *
   * If relative, host will be inferred from either the `VERCEL_URL` environment variable or `window.location.origin`
   *
   * @default (VERCEL_URL ?? window.location.origin) + "/api/veluy"
   */
  url?: string | URL;
  /**
   * Provide a custom fetch implementation.
   * @default `globalThis.fetch`
   */
  fetch?: FetchEsque | undefined;
}

export type RouteRegistry<TRouter extends TransactionRouter> = {
  [k in keyof TRouter]: k;
};

export type EndpointArg<
  TRouter extends TransactionRouter,
  TEndpoint extends keyof TRouter,
> = TEndpoint | ((_: RouteRegistry<TRouter>) => TEndpoint);

/**
 * Hook for handling Veluy transactions with status polling
 */
function useVeluyTransaction<
  TRouter extends TransactionRouter,
  TEndpoint extends keyof TRouter,
>(
  endpoint: EndpointArg<TRouter, TEndpoint>,
  opts?: {
    url?: string | URL;
    fetch?: FetchEsque;
    onVeluyComplete?: (res: inferEndpointOutput<TRouter[TEndpoint]>) => void;
    onVeluyError?: (err: any) => void;
    onVeluyBegin?: (hash: string) => void;
    onStatusChange?: (status: TransactionStatusResponse) => void;
    onVeluyCancelled?: (hash: string) => void;
    onVeluyExpired?: (hash: string) => void;
    statusCheckInterval?: number;
  },
) {
  const [isTransacting, setTransacting] = useState(false);
  const [error, setError] = useState<any>(null);
  const [currentHash, setCurrentHash] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<TransactionStatus | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousStatusRef = useRef<TransactionStatus | null>(null);

  // Status checking function - uses MD5 hash from QR code
  const checkTransactionStatus = useCallback(async (md5Hash: string) => {
    if (!md5Hash) return;

    try {
      // Resolve endpoint for status check
      const resolvedEndpoint = typeof endpoint === 'function' 
        ? endpoint({} as RouteRegistry<TRouter>) 
        : endpoint;
      
      const baseUrl = opts?.url || '/api/veluy';
      const url = `${baseUrl}/${String(resolvedEndpoint)}`;
      
      const fetchFn = opts?.fetch || globalThis.fetch;
      const response = await fetchFn(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          md5Hash // Send MD5 hash from QR code for verification
        }),
      });

      if (!response.ok) {
        console.warn(`Status check failed: ${response.statusText}`);
        return;
      }

      const backendResponse = await response.json();
      
      // Map backend response to frontend TransactionStatusResponse format
      const statusResponse: TransactionStatusResponse = {
        status: backendResponse.success ? 'completed' : 'failed',
        hash: md5Hash,
        message: backendResponse.success ? 'Transaction verified' : 'Transaction failed',
        data: backendResponse.data,
        progress: 100
      };
      
      // Update current status
      setCurrentStatus(statusResponse.status);
      
      // Call status change callback if status changed
      if (previousStatusRef.current !== statusResponse.status) {
        opts?.onStatusChange?.(statusResponse);
        previousStatusRef.current = statusResponse.status;
      }
      
      // Handle final statuses
      switch (statusResponse.status) {
        case 'completed':
          // Stop polling and call success callback
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setTransacting(false);
          opts?.onVeluyComplete?.(statusResponse.data);
          break;
          
        case 'failed':
          // Stop polling and call error callback
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setTransacting(false);
          setError(new Error(statusResponse.message || 'Transaction failed'));
          opts?.onVeluyError?.(new Error(statusResponse.message || 'Transaction failed'));
          break;
          
        case 'cancelled':
          // Stop polling and call cancelled callback
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setTransacting(false);
          opts?.onVeluyCancelled?.(md5Hash);
          break;
          
        case 'expired':
          // Stop polling and call expired callback
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setTransacting(false);
          opts?.onVeluyExpired?.(md5Hash);
          break;
          
        case 'pending':
        case 'processing':
          // Continue polling for these statuses
          break;
      }
    } catch (err) {
      console.error('Status check error:', err);
    }
  }, [opts, endpoint]);

  // Start status polling using MD5 hash from QR code
  const startStatusPolling = useCallback((md5Hash: string) => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Set up new interval
    const interval = opts?.statusCheckInterval || 5000; // Default 5 seconds
    intervalRef.current = setInterval(() => {
      checkTransactionStatus(md5Hash);
    }, interval);
    
    // Also check immediately
    checkTransactionStatus(md5Hash);
  }, [checkTransactionStatus, opts?.statusCheckInterval]);

  // Stop status polling
  const stopStatusPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStatusPolling();
    };
  }, [stopStatusPolling]);

  const startTransaction = useCallback(async (input?: inferEndpointInput<TRouter[TEndpoint]>, md5Hash?: string) => {
    setTransacting(true);
    setError(null);
    setCurrentStatus('pending');
    previousStatusRef.current = null;
    
    try {
      // Generate transaction hash for tracking
      const hash = Math.random().toString(36).substring(2, 15);
      setCurrentHash(hash);
      
      // Call onVeluyBegin callback
      opts?.onVeluyBegin?.(hash);
      
      // If MD5 hash is provided (from QR code), start polling immediately
      if (md5Hash) {
        startStatusPolling(md5Hash);
        return { hash, md5Hash, status: 'pending' };
      }
      
      // Otherwise, this would be for transaction initiation (not used in current flow)
      // The actual transaction verification happens via QR code MD5 hash polling
      return { hash, status: 'pending' };
      
    } catch (err) {
      setError(err);
      setTransacting(false);
      opts?.onVeluyError?.(err);
      throw err;
    }
  }, [endpoint, opts, startStatusPolling]);

  const cancelTransaction = useCallback(() => {
    stopStatusPolling();
    setTransacting(false);
    if (currentHash) {
      opts?.onVeluyCancelled?.(currentHash);
    }
  }, [currentHash, opts, stopStatusPolling]);

  return {
    startTransaction,
    cancelTransaction,
    isTransacting,
    error,
    currentHash,
    currentStatus,
  };
}

/**
 * @remarks It is not recommended using this directly as it requires manually binding generics. Instead, use `createVeluyButton`.
 * @example
 * <VeluyButton<OurTransactionRouter, "someEndpoint">
 *   endpoint="someEndpoint"
 *   onVeluyComplete={(res) => console.log(res)}
 *   onVeluyError={(err) => console.log(err)}
 *   onStatusChange={(status) => console.log('Status:', status)}
 * />
 */
export function VeluyButton<
  TRouter extends TransactionRouter,
  TEndpoint extends keyof TRouter,
>(
  props: TransactionRouter extends TRouter
    ? ErrorMessage<"You forgot to pass the generic">
    : VeluyButtonProps<TRouter, TEndpoint>,
) {
  // Cast back to VeluyButtonProps<TRouter> to get the correct type
  // since the ErrorMessage messes it up otherwise
  const $props = props as unknown as VeluyButtonProps<TRouter, TEndpoint>;

  const { 
    setIsOpen, 
    setTitle, 
    setDescription, 
    setTransactionHash, 
    setTransactionStatus,
    resetTransaction,
    generateQR,
    transactionStatus,
    transactionHash
  } = useKhqr();
  
  // Create our own status checking function for MD5 polling
  const checkTransactionStatus = useCallback(async (md5Hash: string) => {
    if (!md5Hash) return;

    try {
      // Resolve endpoint for status check
      const resolvedEndpoint = typeof $props.endpoint === 'function' 
        ? $props.endpoint({} as RouteRegistry<TRouter>) 
        : $props.endpoint;
      
      const baseUrl = $props.url || '/api/veluy';
      const url = `${baseUrl}/${String(resolvedEndpoint)}`;
      
      const fetchFn = $props.fetch || globalThis.fetch;
      const response = await fetchFn(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          md5Hash // Send MD5 hash from QR code for verification
        }),
      });

      if (!response.ok) {
        console.warn(`Status check failed: ${response.statusText}`);
        return;
      }

      const backendResponse = await response.json();
      
      // Map backend response to frontend TransactionStatusResponse format
      const statusResponse: TransactionStatusResponse = {
        status: backendResponse.success ? 'completed' : 'failed',
        hash: md5Hash,
        message: backendResponse.success ? 'Transaction verified' : 'Transaction failed',
        data: backendResponse.data,
        progress: 100
      };
      
      // Update transaction status
      setTransactionStatus(statusResponse.status);
      $props.onStatusChange?.(statusResponse);
      
      // Handle final statuses
      switch (statusResponse.status) {
        case 'completed':
          $props.onVeluyComplete?.(statusResponse.data);
          break;
        case 'failed':
          $props.onVeluyError?.(new Error(statusResponse.message || 'Transaction failed'));
          break;
      }
    } catch (err) {
      console.error('Status check error:', err);
      setTransactionStatus('failed');
      $props.onVeluyError?.(err as Error);
    }
  }, [$props, setTransactionStatus]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isTransacting, setTransacting] = useState(false);

  // Update dialog based on status changes
  useEffect(() => {
    if (!isTransacting && transactionStatus === 'idle') return;

    switch (transactionStatus) {
      case 'pending':
        setTitle("Transaction Pending");
        setDescription("Your transaction is waiting to be processed...");
        break;
      case 'processing':
        setTitle("Processing Transaction");
        setDescription("Your transaction is being processed...");
        break;
      case 'completed':
        setTitle("Transaction Complete");
        setDescription("Your transaction has been processed successfully!");
        setTransacting(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setTimeout(() => {
          setIsOpen(false);
          resetTransaction();
        }, 2000);
        break;
      case 'failed':
        setTitle("Transaction Failed");
        setDescription("An error occurred while processing your transaction.");
        setTransacting(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        break;
      case 'cancelled':
        setTitle("Transaction Cancelled");
        setDescription("Your transaction has been cancelled.");
        setTransacting(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setTimeout(() => {
          setIsOpen(false);
          resetTransaction();
        }, 2000);
        break;
      case 'expired':
        setTitle("Transaction Expired");
        setDescription("Your transaction has expired. Please try again.");
        setTransacting(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        break;
    }
  }, [transactionStatus, isTransacting, setTitle, setDescription, setIsOpen, resetTransaction]);

  const handleTransaction = useCallback(async () => {
    try {
      // Reset any previous transaction state
      resetTransaction();
      
      // Set up dialog
      setTitle("Initiating Transaction");
      setDescription("Please wait while your transaction is being initiated...");
      setIsOpen(true);
      
      // Generate QR code for payment
      generateQR();

      // Start transaction with input if provided (basic initialization)
      const input = 'input' in $props ? $props.input : undefined;
      const hash = Math.random().toString(36).substring(2, 15);
      setTransactionHash(hash);
      setTransactionStatus('pending');
      setTransacting(true);
      $props.onVeluyBegin?.(hash);
      
    } catch (error) {
      // Update dialog on error
      setTitle("Transaction Failed");
      setDescription("An error occurred while initiating your transaction. Please try again.");
      setTransactionStatus('failed');
      console.error('Transaction error:', error);
    }
  }, [$props, setIsOpen, setTitle, setDescription, resetTransaction, generateQR, setTransactionHash, setTransactionStatus]);

  // Watch for MD5 hash from QR code and start polling (only once when MD5 becomes available)
  const { md5 } = useKhqr();
  const hasStartedPolling = useRef(false);
  
  useEffect(() => {
    if (md5 && transactionStatus === 'pending' && !hasStartedPolling.current) {
      hasStartedPolling.current = true;
      
      // Start status polling with the MD5 hash from QR code
      const interval = $props.statusCheckInterval || 5000;
      const pollInterval = setInterval(() => {
        checkTransactionStatus(md5);
      }, interval);
      
      // Store interval reference for cleanup
      intervalRef.current = pollInterval;
      
      // Check immediately
      checkTransactionStatus(md5);
    }
  }, [md5, transactionStatus, checkTransactionStatus, $props.statusCheckInterval]);

  // Reset polling flag when transaction is reset
  useEffect(() => {
    if (transactionStatus === 'idle') {
      hasStartedPolling.current = false;
    }
  }, [transactionStatus]);

  const handleCancel = useCallback(() => {
    // Stop polling
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTransacting(false);
    setTransactionStatus('cancelled');
    setIsOpen(false);
    resetTransaction();
  }, [setIsOpen, setTransactionStatus, resetTransaction]);

  return (
    <>
      <Button 
        onClick={handleTransaction}
        disabled={isTransacting || $props.disabled}
        className={$props.className}
      >
        {isTransacting ? `${transactionStatus || 'Processing'}...` : ($props.content?.buttonText || "Start Transaction")}
      </Button>
      
      {isTransacting && (
        <Button 
          onClick={handleCancel}
          variant="outline"
          className="ml-2"
        >
          Cancel
        </Button>
      )}
    </>
  );
}

export const generateVeluyButton = <TRouter extends TransactionRouter>(
  opts?: GenerateTypedHelpersOptions,
) => {
  const url = opts?.url;
  const fetch = opts?.fetch ?? globalThis.fetch;

  const TypedButton = <TEndpoint extends keyof TRouter>(
    props: Omit<
      VeluyButtonProps<TRouter, TEndpoint>,
      keyof GenerateTypedHelpersOptions
    >,
  ) => (
    <VeluyButton<TRouter, TEndpoint>
      {...(props as any)}
      url={url}
      fetch={fetch}
    />
  );
  return TypedButton;
};


