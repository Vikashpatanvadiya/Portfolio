"use client";

import { useActionState } from "react";
import { login } from "./actions";

export function LoginForm() {
  const [error, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="space-y-3">
      <input
        type="password"
        name="password"
        placeholder="password"
        autoFocus
        autoComplete="current-password"
        required
        className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        disabled={pending}
        className="w-full rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? "checking…" : "log in"}
      </button>
    </form>
  );
}
