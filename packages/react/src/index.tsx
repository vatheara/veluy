import "./styles/globals.css";
import { KhqrDialog } from "./components/khqr-dialog";
import { useKhqr, type TransactionStatus } from "./hook/use-khqr";

export { KhqrDialog, useKhqr };
export type { TransactionStatus };

export {
  //   UploadButton,
  //   UploadDropzone,
  //   Uploader,
  //   generateUploadButton,
  //   generateUploadDropzone,
  //   generateUploader,
  VeluyButton,
  generateVeluyButton,
} from "./components";

export type * from "./types";
