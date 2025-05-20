import * as React from "react";
import { useKhqr } from "@/hook";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { QRCodeSVG } from "qrcode.react";
import KhqrIcon from "@/assets/bakong/KHQR-Logo.png";
import { useState, useEffect, useRef } from "react";
import { KHQR, TAG, CURRENCY } from "ts-khqr";
import LoadingSpinner from "./loading-spinner";
import { FiClock } from "react-icons/fi";


export const KhqrDialog = () => {
  const { isOpen, title, description, onConfirm, onCancel, setIsOpen, sessionTime, expired, setSessionTime, setExpired } = useKhqr();
  const [qrstring, setQrstring] = useState("");
  const [md5, setMd5] = useState("");

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const cardWidth = 190;
  const cardHeight = 260;
  const nameFontSize = 10;
  const amountFontSize = 14;

  const generateQR = () => {
    setSessionTime(180);
    setExpired(false);
    const result = KHQR.generate({
      tag: TAG.INDIVIDUAL,
      accountID: "va_theara1@aclb",
      merchantName: "Domnossrai",
      currency: CURRENCY.USD,
      amount: 9,
    });

    if (result.data) {
      setQrstring(result.data.qr);
      setMd5(result.data.md5);
      // console.log(result.data.md5);
    }
  };

  useEffect(() => {
    if (isOpen) {
      generateQR();
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (md5 && !expired) {
        console.log("handle check hash")
      }
    }, 3000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [expired, md5 ]);

  const handleCancel = () => {
    setIsOpen(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {expired ? (
          <div className="flex flex-col items-center justify-center gap-2">
            <FiClock size={64} />
            <div>Session Expired</div>
            <div className="text-sm">
              Press Try Again to resume transaction.
            </div>
            <Button onClick={generateQR}>Try Again</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between">
              <div>${9} per month</div>
              <Timer />
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
                    <div style={{ fontSize: nameFontSize }}>Domnossrai</div>
                    <div
                      style={{ fontSize: amountFontSize }}
                      className={`text-[${amountFontSize}px] flex items-center font-bold`}
                    >
                      {9}
                      <span className="ml-[8px] text-[8px]">USD</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="mx-[10%] my-[8%] h-[130px] w-[130px] bg-black">
                    <QRCodeSVG value={qrstring} />
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
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={onConfirm}>Confirm</Button>
        </DialogFooter>
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
        // console.log("still running");
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
