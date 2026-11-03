import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { acceptRequest, confirmPayment, declineRequest, getReceivedRequests, rejectPayment } from "../services/api";
import AppLayout from "./AppLayout";
import PaymentSettings from "./PaymentSettings";

const TraineesPage = ({ onLogout }) => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const response = await getReceivedRequests();
      setRequests(response.data);
      setError("");
    } catch {
      setError("Could not load requests. Please try again.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const answer = async (action) => {
    try {
      await action();
      await load();
    } catch {
      setError("Could not update the request. Please try again.");
    }
  };

  const pending = requests.filter((r) => r.status === "PENDING");
  const accepted = requests.filter((r) => r.status === "ACCEPTED");

  return (
    <AppLayout onLogout={onLogout}>
      <Box component="section" className="page-heading">
        <div>
          <div className="eyebrow">Your athletes</div>
          <h1>Trainees</h1>
          <p>Answer training requests and review accepted trainees' progress.</p>
        </div>
      </Box>
      {error && <Typography role="alert">{error}</Typography>}
      <PaymentSettings />
      <Box component="section" className="coach-panel">
        <h2>Pending requests</h2>
        {pending.length === 0 && <Typography>No pending requests.</Typography>}
        {pending.map((request) => (
          <Card className="coach-card" key={request.id}>
            <CardContent>
              <Typography variant="h6">{request.traineeName}</Typography>
              <Typography>{request.traineeEmail}</Typography>
              {request.goal && <Typography>Goal: {request.goal}</Typography>}
              {request.message && <Typography>{request.message}</Typography>}
              <Button variant="contained" onClick={() => answer(() => acceptRequest(request.id))}>Accept</Button>
              <Button onClick={() => answer(() => declineRequest(request.id))}>Decline</Button>
            </CardContent>
          </Card>
        ))}
      </Box>
      <Box component="section" className="coach-panel">
        <h2>My trainees</h2>
        {accepted.length === 0 && <Typography>No accepted trainees yet.</Typography>}
        {accepted.map((request) => (
          <Card className="coach-card" key={request.id}>
            <CardContent>
              <Typography variant="h6">{request.traineeName}</Typography>
              {request.goal && <Typography>Goal: {request.goal}</Typography>}
              {request.paymentStatus && request.paymentStatus !== "NOT_REQUIRED" && (
                <Typography>
                  Payment: {request.paymentStatus.replace("_", " ")} ({(request.priceCents / 100).toFixed(2)} {request.currency})
                </Typography>
              )}
              {request.paymentStatus === "PENDING_CONFIRMATION" && (
                <>
                  <Typography>
                    Trainee says they paid via {request.paymentMethodLabel}
                    {request.paymentReference ? ` (ref: ${request.paymentReference})` : ""}
                  </Typography>
                  <Button variant="contained" onClick={() => answer(() => confirmPayment(request.id))}>Confirm payment</Button>
                  <Button onClick={() => answer(() => rejectPayment(request.id))}>Reject</Button>
                </>
              )}
              <Button variant="contained" onClick={() => navigate(`/trainees/${request.traineeId}`)}>
                View training
              </Button>
              <Button onClick={() => navigate(`/coaching/${request.id}`)}>Plan &amp; messages</Button>
            </CardContent>
          </Card>
        ))}
      </Box>
    </AppLayout>
  );
};

export default TraineesPage;
