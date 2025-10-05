import * as React from "react";
import { useKhqr } from "@/hook";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Button } from "@repo/ui/components/button";
import { QRCodeSVG } from "qrcode.react";
import KhqrIcon from "@/assets/bakong/KHQR-Logo.png";
import { useState, useEffect, useRef } from "react";
import LoadingSpinner from "./loading-spinner";
import { FiClock } from "react-icons/fi";

import useSWR, { SWRConfiguration } from 'swr'
import { z } from 'zod'
import { ResponseResult, ReturnType } from "ts-khqr";

const qrSchema: z.ZodType<ReturnType<ResponseResult>> = z.object({
  status: z.object({
    code: z.number(),
    message: z.string().nullable(),
    errorCode: z.number().nullable(),
  }),
  data: z.object({
    qr: z.string(),
    md5: z.string(),
  }),
})

const useQr = (options?: SWRConfiguration) => {
  const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error('Failed to fetch data');
    }
    const data = await res.json();
    return qrSchema.parse(data); 
  };
  return useSWR('/api/veluy', fetcher, options)
}

export const KhqrDialog = () => {
  const { data, isLoading, error } = useQr()
  console.log("QR data: ",data , "error: ",error)
  const {
    isOpen,
    title,
    description,
    setIsOpen,
    sessionTime,
    expired,
    setSessionTime,
    setExpired,
    transactionStatus,
    qrstring,
    md5,
    amount,
    merchantName,
    resetTransaction,
  } = useKhqr();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const cardWidth = 190;
  const cardHeight = 260;
  const nameFontSize = 10;
  const amountFontSize = 14;

  // Notify parent component when MD5 hash is available for polling
  useEffect(() => {
    if (md5 && transactionStatus === "pending") {
      // The VeluyButton component will handle the actual status polling
      // This is just for logging/debugging
      console.log("QR code generated with MD5 hash:", md5);
    }
  }, [md5, transactionStatus]);

  const handleCancel = () => {
    setIsOpen(false);
    resetTransaction();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleTryAgain = () => {
    // generateQR();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {expired || transactionStatus === "expired" ? (
          <div className="flex flex-col items-center justify-center gap-2">
            <FiClock size={64} />
            <div>Session Expired</div>
            <div className="text-sm">
              Press Try Again to resume transaction.
            </div>
            <Button onClick={handleTryAgain}>Try Again</Button>
          </div>
        ) : transactionStatus === "completed" ? (
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="text-green-600 text-2xl">✓</div>
            <div>Payment Successful!</div>
            <div className="text-sm text-center">
              Your transaction has been completed successfully.
            </div>
          </div>
        ) : transactionStatus === "failed" ? (
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="text-red-600 text-2xl">✗</div>
            <div>Payment Failed</div>
            <div className="text-sm text-center">
              An error occurred while processing your payment.
            </div>
            <Button onClick={handleTryAgain}>Try Again</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between">
              <div>${amount} USD</div>
              {transactionStatus === "pending" && <Timer />}
            </div>
            <div className="flex items-center justify-center">
              <div
                style={{ width: cardWidth, height: cardHeight }}
                className={`flex flex-col rounded-[14px] bg-white text-black shadow-xs`}
              >
                <div className="flex h-[12%] items-center justify-center rounded-t-[14px] bg-[#E1232E]">
                  <div>
                    <img src={KhqrIcon} alt="khqr" width={36} height={8} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="relative -top-[1px] h-0 w-0 border-l-[13px] border-t-[13px] border-l-transparent border-t-red-600"></div>
                </div>
                <div className=" flex justify-center">
                  <div className="mx-[10%] my-[3%] w-[130px]">
                    <div style={{ fontSize: nameFontSize }}>{merchantName}</div>
                    <div
                      style={{ fontSize: amountFontSize }}
                      className={`text-[${amountFontSize}px] flex items-center font-bold`}
                    >
                      {amount}
                      <span className="ml-[8px] text-[8px]">USD</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="mx-[10%] my-[8%] h-[130px] w-[130px] bg-black">
                    {qrstring ? (
                      <QRCodeSVG value={qrstring} width="100%" height="100%" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <LoadingSpinner theme="light" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center">
              Scan with mobile banking app that supports KHQR
            </div>
            <Button onClick={handleCancel}>Cancel</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

function Timer() {
  const seconds = useKhqr((state) => state.sessionTime);
  const setSeconds = useKhqr((state) => state.setSessionTime);
  const setSessionExpired = useKhqr((state) => state.setExpired);

  useEffect(() => {
    if (seconds > 0) {
      const interval = setInterval(() => {
        setSeconds(seconds - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setSessionExpired(true);
    }
  }, [seconds, setSeconds, setSessionExpired]);

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const remainingSeconds = secs % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  return (
    <div className="flex items-center gap-2">
      <LoadingSpinner theme="light" />
      {formatTime(seconds)}
    </div>
  );
}
