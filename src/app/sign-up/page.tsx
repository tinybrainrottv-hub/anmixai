"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#010104]">
      <SignUp routing="path" path="/sign-up" />
    </div>
  );
}

