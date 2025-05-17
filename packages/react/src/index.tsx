import * as React from "react";
import "./styles/globals.css";
import { Button } from "./components/ui/button";
import { PendingDialog } from "./components/pending-dialog";
import { usePendingDialogStore } from "./stores/use-pending-dialog-store";


export default function Main() {
  const { setIsOpen, setTitle, setDescription } = usePendingDialogStore();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Shadcn UI Example</h1>
      <div className="flex gap-2">
        <Button variant="default">Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
        <Button onClick={() => {
          setIsOpen(true);
          setTitle("Hello");
          setDescription("This is a test");
        }}>Open Dialog</Button>
      </div>
      <PendingDialog />
    </div>
  );
}
