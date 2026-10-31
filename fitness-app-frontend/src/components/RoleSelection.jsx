import { Box, Button, Typography } from "@mui/material";
import { useState } from "react";
import { chooseRole } from "../services/api";

const RoleSelection = ({ onChosen }) => {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const select = async (role) => {
    setSaving(true);
    setError("");
    try {
      const response = await chooseRole(role);
      onChosen(response.data);
    } catch {
      setError("Could not save your choice. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box component="main" className="login-shell">
      <Box component="section" className="login-content">
        <div className="eyebrow">Welcome to Pulse</div>
        <h1>How will you use Pulse?</h1>
        <p>This choice is permanent. Trainees can send requests to coaches; coaches review the training of trainees who accept them.</p>
        <Button className="login-button" variant="contained" disabled={saving} onClick={() => select("USER")}>
          I'm a trainee
        </Button>
        <Button className="login-button" variant="contained" disabled={saving} onClick={() => select("COACH")}>
          I'm a coach
        </Button>
        {error && <Typography role="alert">{error}</Typography>}
      </Box>
    </Box>
  );
};

export default RoleSelection;
