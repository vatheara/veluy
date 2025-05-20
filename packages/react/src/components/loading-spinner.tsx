import * as React from "react";
import Spinner from "@/assets/loading.svg";
import SpinnerDark from "@/assets/loading-dark.svg";

export default function LoadingSpinner({theme}: {theme: "light" | "dark"}) {
  return (
      <img
        className="animate-spin"
        src={theme === "dark" ? SpinnerDark : Spinner}
        alt="loading-spinner"
      />
  );
}
