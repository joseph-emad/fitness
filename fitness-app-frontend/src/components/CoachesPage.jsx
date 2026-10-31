import { Box, Button, Card, CardContent, TextField, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { cancelRequest, getCoaches, getSentRequests, sendTrainingRequest } from "../services/api";
import AppLayout from "./AppLayout";

const ACTIVE = ["PENDING", "ACCEPTED"];

const CoachesPage = ({ onLogout }) => {
  const [coaches, setCoaches] = useState([]);
  const [requests, setRequests] = useState([]);
  const [messages, setMessages] = useState({});
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [coachResponse, requestResponse] = await Promise.all([getCoaches(), getSentRequests()]);
      setCoaches(coachResponse.data);
      setRequests(requestResponse.data);
      setError("");
    } catch {
      setError("Could not load coaches. Please try again.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (action) => {
    try {
      await action();
      await load();
    } catch (e) {
      setError(e.response?.status === 409 ? "You already have an active request with this coach." : "Something went wrong. Please try again.");
    }
  };

  const hasActive = (coachId) => requests.some((r) => r.coachId === coachId && ACTIVE.includes(r.status));

  return (
    <AppLayout onLogout={onLogout}>
      <Box component="section" className="page-heading">
        <div>
          <div className="eyebrow">Get guidance</div>
          <h1>Coaches</h1>
          <p>Send a request; once a coach accepts, they can follow your training.</p>
        </div>
      </Box>
      {error && <Typography role="alert">{error}</Typography>}
      <Box component="section" className="coach-panel">
        <h2>Available coaches</h2>
        {coaches.length === 0 && <Typography>No coaches are available yet.</Typography>}
        {coaches.map((coach) => (
          <Card className="coach-card" key={coach.keycloakId}>
            <CardContent>
              <Typography variant="h6">{`${coach.firstName ?? ""} ${coach.lastName ?? ""}`.trim() || coach.email}</Typography>
              <Typography>{coach.email}</Typography>
              {!hasActive(coach.keycloakId) && (
                <>
                  <TextField
                    label="Message (optional)"
                    size="small"
                    fullWidth
                    margin="dense"
                    slotProps={{ htmlInput: { maxLength: 500 } }}
                    value={messages[coach.keycloakId] ?? ""}
                    onChange={(e) => setMessages({ ...messages, [coach.keycloakId]: e.target.value })}
                  />
                  <Button
                    variant="contained"
                    onClick={() => act(() => sendTrainingRequest(coach.keycloakId, messages[coach.keycloakId] ?? ""))}
                  >
                    Request training
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>
      <Box component="section" className="coach-panel">
        <h2>My requests</h2>
        {requests.length === 0 && <Typography>You haven't sent any requests.</Typography>}
        {requests.map((request) => (
          <Card className="coach-card" key={request.id}>
            <CardContent>
              <Typography variant="h6">{request.coachName}</Typography>
              <Typography className="request-status">Status: {request.status}</Typography>
              {request.message && <Typography>{request.message}</Typography>}
              {ACTIVE.includes(request.status) && (
                <Button onClick={() => act(() => cancelRequest(request.id))}>
                  {request.status === "ACCEPTED" ? "End coaching" : "Cancel request"}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>
    </AppLayout>
  );
};

export default CoachesPage;
