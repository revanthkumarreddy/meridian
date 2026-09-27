export const USERS = [
  { id: "revanth", name: "Revanth" },
  { id: "anjali", name: "Anjali" },
] as const;

export type UserId = (typeof USERS)[number]["id"];

export function userName(id: UserId) {
  return USERS.find((user) => user.id === id)?.name ?? "Revanth";
}
