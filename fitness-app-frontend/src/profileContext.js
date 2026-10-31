import { createContext, useContext } from "react";

export const ProfileContext = createContext({ profile: null, refreshProfile: () => {} });

export const useProfile = () => useContext(ProfileContext);
