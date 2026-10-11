import type { ClientUserRole } from "@/server/db/schema";

export type CurrentUser =
  | { kind: "team"; email: string; initials: string }
  | { kind: "client"; email: string; initials: string; clientId: number; clientName: string; role: ClientUserRole }
  | { kind: "none"; email: string; initials: string };

/** Team sees every client; a client user sees only the client they belong to. */
export function canSeeClient(user: CurrentUser, clientId: number): boolean {
  if (user.kind === "team") return true;
  return user.kind === "client" && user.clientId === clientId;
}

/** Only approvers (and the team on their behalf) may decide an approval; viewers cannot. */
export function canDecideApproval(user: CurrentUser): boolean {
  return user.kind === "client" && user.role === "approver";
}
