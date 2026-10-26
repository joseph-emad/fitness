import { Box, Button } from "@mui/material";
import { NavLink } from "react-router";

const AppLayout = ({ children, onLogout }) => (
  <Box className="app-layout">
    <Box component="aside" className="sidebar">
      <div className="brand-mark" aria-label="Pulse">
        Pulse<span className="brand-mark__dot">.</span>
      </div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        <NavLink className={({ isActive }) => `sidebar-nav__link${isActive ? " is-active" : ""}`} to="/activities">
          Workouts
        </NavLink>
      </nav>
      <Button className="logout-button" onClick={onLogout}>Log out</Button>
    </Box>
    <Box component="main" className="app-main">
      {children}
    </Box>
  </Box>
);

export default AppLayout;
