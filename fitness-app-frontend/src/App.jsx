import { Box, Button } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "react-oauth2-code-pkce";
import { useDispatch, useSelector } from "react-redux";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router";
import { logout, setCredentials } from "./store/authSlice";
import "./App.css";
import { ProfileContext } from "./profileContext";
import { getProfile } from "./services/api";
import ActivityDetail from "./components/ActivityDetail";
import ActivityForm from "./components/ActivityForm";
import ActivityList from "./components/ActivityList";
import AppLayout from "./components/AppLayout";
import CoachesPage from "./components/CoachesPage";
import RoleSelection from "./components/RoleSelection";
import TraineeActivitiesPage from "./components/TraineeActivitiesPage";
import TraineesPage from "./components/TraineesPage";

const ActivitiesPage = ({ onLogout }) => {
  const [refreshToken, setRefreshToken] = useState(0);

  return (
    <AppLayout onLogout={onLogout}>
      <Box component="section" className="page-heading">
        <div>
          <div className="eyebrow">Your movement, measured</div>
          <h1>Training log</h1>
          <p>Build consistency, one session at a time.</p>
        </div>
      </Box>
      <Box className="activities-layout">
        <Box component="section" className="entry-panel">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Make it count</div>
              <h2>Log a session</h2>
            </div>
            <span className="section-number">01</span>
          </div>
          <ActivityForm onActivityAdded={() => setRefreshToken((current) => current + 1)} />
        </Box>
        <Box component="section" className="history-panel">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Your recent work</div>
              <h2>Activity history</h2>
            </div>
            <span className="section-number">02</span>
          </div>
          <ActivityList refreshToken={refreshToken} />
        </Box>
      </Box>
    </AppLayout>
  );
}

function App() {
  const { token, tokenData, logIn, logOut } = useContext(AuthContext);
  const dispatch = useDispatch();
  const storedToken = useSelector((state) => state.auth.token);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState(false);
  const credentialsReady = Boolean(token) && storedToken === token;

  const handleLogout = () => {
    dispatch(logout());
    logOut();
  };

  useEffect(() => {
    if (token){
      dispatch(setCredentials({token, user: tokenData}));
    }
  }, [token, tokenData, dispatch]);

  useEffect(() => {
    if (!credentialsReady) {
      setProfile(null);
      return;
    }
    setProfileError(false);
    getProfile(tokenData.sub)
      .then((response) => setProfile(response.data))
      .catch(() => setProfileError(true));
  }, [credentialsReady, tokenData]);

  const renderAuthenticated = () => {
    if (profileError) {
      return <Box className="app-route-shell" role="alert">Could not load your profile. Please refresh and try again.</Box>;
    }
    if (!profile) {
      return <Box className="app-route-shell">Loading...</Box>;
    }
    if (!profile.roleChosen) {
      return <RoleSelection onChosen={setProfile} />;
    }
    const isCoach = profile.role === "COACH";
    return (
      <ProfileContext.Provider value={{ profile }}>
        <Box component="section" className="app-route-shell">
          <Routes>
            <Route path="/activities" element={<ActivitiesPage onLogout={handleLogout} />} />
            <Route path="/activities/:id" element={<ActivityDetail onLogout={handleLogout} />} />
            {isCoach ? (
              <>
                <Route path="/trainees" element={<TraineesPage onLogout={handleLogout} />} />
                <Route path="/trainees/:traineeId" element={<TraineeActivitiesPage onLogout={handleLogout} />} />
                <Route path="/trainees/:traineeId/activities/:id" element={<ActivityDetail onLogout={handleLogout} />} />
              </>
            ) : (
              <Route path="/coaches" element={<CoachesPage onLogout={handleLogout} />} />
            )}
            <Route path="*" element={<Navigate to="/activities" replace />} />
          </Routes>
        </Box>
      </ProfileContext.Provider>
    );
  };

  return (
    <Router>
      {!token ? (
      <Box component="main" className="login-shell">
        <Box component="section" className="login-content">
          <div className="brand-mark" aria-label="Pulse">Pulse<span className="brand-mark__dot">.</span></div>
          <div className="eyebrow">Training, with intention</div>
          <h1>Your effort deserves a record.</h1>
          <p>Keep your sessions together and make every workout part of a bigger picture.</p>
          <Button
            className="login-button"
            variant="contained"
            onClick={() => {logIn(); }}
          >
            Log in
          </Button>
           
          <Button
            className="login-button"
            variant="contained"
            onClick={() => logIn(undefined, { kc_action: "register" })}
          >
            Sign up
          </Button>
        </Box>
      </Box>
            ) : renderAuthenticated()}
    </Router>
  )
}

export default App
