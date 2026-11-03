import { Box, Button, Card, CardContent, MenuItem, TextField, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { cancelRequest, claimPayment, getCoaches, getSentRequests, sendTrainingRequest } from "../services/api";
import AppLayout from "./AppLayout";

const ACTIVE = ["PENDING", "ACCEPTED"];

const CoachesPage = ({ onLogout }) => {
  const [coaches, setCoaches] = useState([]);
  const [requests, setRequests] = useState([]);
  const [messages, setMessages] = useState({});
  const [goals, setGoals] = useState({});
  const [methodChoice, setMethodChoice] = useState({});
  const [references, setReferences] = useState({});
  const navigate = useNavigate();
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
              <Typography>
                {coach.coachPriceCents > 0 ? `Price: ${(coach.coachPriceCents / 100).toFixed(2)} ${coach.currency}` : "Free"}
              </Typography>
              {(coach.paymentMethods ?? []).length > 0 && (
                <Typography>Accepts: {coach.paymentMethods.map((m) => m.label).join(", ")}</Typography>
              )}
              {!hasActive(coach.keycloakId) && (
                <>
                  <TextField
                    label="Your goal"
                    required
                    size="small"
                    fullWidth
                    margin="dense"
                    slotProps={{ htmlInput: { maxLength: 500 } }}
                    value={goals[coach.keycloakId] ?? ""}
                    onChange={(e) => setGoals({ ...goals, [coach.keycloakId]: e.target.value })}
                  />
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
                    disabled={!(goals[coach.keycloakId] ?? "").trim()}
                    onClick={() => act(() => sendTrainingRequest(coach.keycloakId, goals[coach.keycloakId].trim(), messages[coach.keycloakId] ?? ""))}
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
              {request.goal && <Typography>Goal: {request.goal}</Typography>}
              {request.message && <Typography>{request.message}</Typography>}
              {request.paymentStatus === "UNPAID" && request.status === "ACCEPTED" && (
                <Box>
                  <Typography>
                    Payment due: {(request.priceCents / 100).toFixed(2)} {request.currency}. Pay your coach, then confirm below.
                  </Typography>
                  {(coaches.find((c) => c.keycloakId === request.coachId)?.paymentMethods ?? []).map((m) => (
                    <Typography key={m.id}>{m.label}{m.instructions ? `: ${m.instructions}` : ""}</Typography>
                  ))}
                  <TextField select label="Payment method" size="small" margin="dense" sx={{ minWidth: 200 }}
                    value={methodChoice[request.id] ?? ""}
                    onChange={(e) => setMethodChoice({ ...methodChoice, [request.id]: e.target.value })}>
                    {(coaches.find((c) => c.keycloakId === request.coachId)?.paymentMethods ?? []).map((m) => (
                      <MenuItem key={m.id} value={m.id}>{m.label}</MenuItem>
                    ))}
                  </TextField>
                  <TextField label="Reference (optional)" size="small" margin="dense"
                    value={references[request.id] ?? ""}
                    onChange={(e) => setReferences({ ...references, [request.id]: e.target.value })} />
                  <Button variant="contained" disabled={!methodChoice[request.id]}
                    onClick={() => act(() => claimPayment(request.id, methodChoice[request.id], references[request.id] ?? ""))}>
                    I've paid
                  </Button>
                </Box>
              )}
              {request.paymentStatus === "PENDING_CONFIRMATION" && (
                <Typography>Waiting for your coach to confirm your payment.</Typography>
              )}
              {request.paymentStatus === "PAID" && <Typography>Payment confirmed.</Typography>}
              {request.status === "ACCEPTED" && (
                <Button variant="contained" onClick={() => navigate(`/coaching/${request.id}`)}>
                  Plan &amp; messages
                </Button>
              )}
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
