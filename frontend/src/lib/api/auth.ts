import client from "./client";
import type { TokenResponse, User } from "./types";

export function register(email: string, username: string, password: string) {
  return client.post<TokenResponse>("/auth/register", { email, username, password });
}

export function login(email: string, password: string) {
  return client.post<TokenResponse>("/auth/login", { email, password });
}

export function getMe() {
  return client.get<User>("/auth/me");
}
