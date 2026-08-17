import AsyncStorage from "@react-native-async-storage/async-storage";
import usersData from "../users.json";

export type UserRole = "USER" | "PROFESSIONAL";

export interface AppUser {
  id: string;
  name: string;
  mobile: string;
  otp: string;
  role: UserRole;
  status: string;
  professionalType?: string;
  qualification?: string;
  registrationNumber?: string;
  serviceArea?: string;
}

const SESSION_KEY = "@ruralcare_session";

const users: AppUser[] = usersData.users as AppUser[];

export function findUser(
  mobile: string,
  otp: string
): AppUser | null {
  const user = users.find(
    (item) =>
      item.mobile === mobile &&
      item.otp === otp
  );

  return user ?? null;
}

export async function saveSession(
  user: AppUser
): Promise<void> {
  await AsyncStorage.setItem(
    SESSION_KEY,
    JSON.stringify(user)
  );
}

export async function getSession(): Promise<AppUser | null> {
  const session =
    await AsyncStorage.getItem(SESSION_KEY);

  if (!session) {
    return null;
  }

  try {
    return JSON.parse(session) as AppUser;
  } catch {
    return null;
  }
}

export async function updateSessionStatus(
  status: string
): Promise<AppUser | null> {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const updatedUser: AppUser = {
    ...session,
    status,
  };

  await saveSession(updatedUser);

  return updatedUser;
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}