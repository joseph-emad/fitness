import { Box, Button } from "@mui/material";
import { NavLink } from "react-router";
import { useProfile } from "../profileContext";

const AppLayout = ({ children, onLogout }) => {
  const { profile } = useProfile();
  const linkClass = ({ isActive }) => `sidebar-nav__link${isActive ? " is-active" : ""}`;

  return (
  <Box className="app-layout">
    <Box component="aside" className="sidebar">
      <div className="brand-mark" aria-label="Pulse">
        Pulse<span className="brand-mark__dot">.</span>
      </div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        <NavLink className={linkClass} to="/activities">
          Workouts
        </NavLink>
        {profile?.role === "COACH" ? (
          <NavLink className={linkClass} to="/trainees">Trainees</NavLink>
        ) : (
          <NavLink className={linkClass} to="/coaches">Coaches</NavLink>
        )}
      </nav>
      <Button className="logout-button" onClick={onLogout}>Log out</Button>
    </Box>
    <Box component="main" className="app-main">
      {children}
    </Box>
  </Box>
  );
};

export default AppLayout;
