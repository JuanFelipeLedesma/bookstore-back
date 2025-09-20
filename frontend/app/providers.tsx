"use client";
import { ReactNode } from "react";
import { AuthorsProvider } from "@/context/AuthorsContext";

export default function Providers({ children }: { children: ReactNode }) {
  return <AuthorsProvider>{children}</AuthorsProvider>;
}
