"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { addClient, type ClientState } from "@/app/clients/actions";

export function AddClientForm({ businesses }: { businesses: { id: number; name: string }[] }) {
  const [state, action, pending] = useActionState<ClientState, FormData>(addClient, null);
  return (
    <form action={action} className="bg-card rounded-card flex flex-col gap-3 border p-4 sm:flex-row sm:items-start">
      <Input name="name" placeholder="Client name" aria-label="Client name" required className="sm:flex-1" />
      <Select name="businessId" aria-label="Business" defaultValue={businesses[0]?.id} className="sm:w-48">
        {businesses.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </Select>
      <Button type="submit" disabled={pending}>
        <Plus /> Add client
      </Button>
      {state?.error && (
        <p className="text-danger text-xs sm:basis-full" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
