import { Box, Button, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { getTrainingPlan, saveTrainingPlan } from "../services/api";
import AppLayout from "./AppLayout";
import ChatPanel from "./ChatPanel";
import { useProfile } from "../profileContext";

const emptyPlan = () => ({ title: "", notes: "", weeks: [{ name: "Week 1", days: [{ name: "Day 1", exercises: [] }] }] });
const num = (value) => (value === "" ? null : Number(value));

const CoachingPage = ({ onLogout }) => {
  const { requestId } = useParams();
  const { profile } = useProfile();
  const isCoach = profile.role === "COACH";
  const [plan, setPlan] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    getTrainingPlan(requestId)
      .then((response) => setPlan(response.data))
      .catch((e) => {
        if (e.response?.status === 402) {
          setLocked(true);
          setPlan(false);
        } else {
          setPlan(e.response?.status === 404 ? (isCoach ? emptyPlan() : false) : null);
        }
      });
  }, [requestId, isCoach]);

  const update = (mutate) => setPlan((current) => {
    const copy = structuredClone(current);
    mutate(copy);
    return copy;
  });

  const save = async () => {
    try {
      const response = await saveTrainingPlan(requestId, plan);
      setPlan(response.data);
      setStatus("Plan saved.");
      setError("");
    } catch {
      setError("Could not save the plan. Add a title and a name for each exercise.");
    }
  };

  const renderEditor = () => (
    <>
      <TextField label="Plan title" fullWidth margin="dense" value={plan.title}
        onChange={(e) => update((p) => { p.title = e.target.value; })} />
      <TextField label="Notes" fullWidth multiline margin="dense" value={plan.notes ?? ""}
        onChange={(e) => update((p) => { p.notes = e.target.value; })} />
      {plan.weeks.map((week, w) => (
        <Box key={w} className="coach-card">
          <TextField label="Week name" size="small" value={week.name ?? ""}
            onChange={(e) => update((p) => { p.weeks[w].name = e.target.value; })} />
          <Button onClick={() => update((p) => p.weeks.splice(w, 1))}>Remove week</Button>
          {week.days.map((day, d) => (
            <Box key={d} sx={{ ml: 2 }}>
              <TextField label="Day name" size="small" value={day.name ?? ""}
                onChange={(e) => update((p) => { p.weeks[w].days[d].name = e.target.value; })} />
              <Button onClick={() => update((p) => p.weeks[w].days.splice(d, 1))}>Remove day</Button>
              {day.exercises.map((ex, x) => (
                <Box key={x} sx={{ ml: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <TextField label="Exercise" size="small" value={ex.name ?? ""}
                    onChange={(e) => update((p) => { p.weeks[w].days[d].exercises[x].name = e.target.value; })} />
                  <TextField label="Sets" size="small" type="number" value={ex.sets ?? ""}
                    onChange={(e) => update((p) => { p.weeks[w].days[d].exercises[x].sets = num(e.target.value); })} />
                  <TextField label="Reps" size="small" type="number" value={ex.reps ?? ""}
                    onChange={(e) => update((p) => { p.weeks[w].days[d].exercises[x].reps = num(e.target.value); })} />
                  <TextField label="Notes" size="small" value={ex.notes ?? ""}
                    onChange={(e) => update((p) => { p.weeks[w].days[d].exercises[x].notes = e.target.value; })} />
                  <Button onClick={() => update((p) => p.weeks[w].days[d].exercises.splice(x, 1))}>Remove</Button>
                </Box>
              ))}
              <Button onClick={() => update((p) => p.weeks[w].days[d].exercises.push({ name: "", sets: null, reps: null, notes: "" }))}>
                Add exercise
              </Button>
            </Box>
          ))}
          <Button onClick={() => update((p) => p.weeks[w].days.push({ name: `Day ${week.days.length + 1}`, exercises: [] }))}>
            Add day
          </Button>
        </Box>
      ))}
      <Button onClick={() => update((p) => p.weeks.push({ name: `Week ${p.weeks.length + 1}`, days: [] }))}>Add week</Button>
      <Button variant="contained" onClick={save}>Save plan</Button>
      {status && <Typography>{status}</Typography>}
    </>
  );

  const renderView = () => (
    <>
      <Typography variant="h6">{plan.title}</Typography>
      {plan.notes && <Typography>{plan.notes}</Typography>}
      {plan.weeks.map((week, w) => (
        <Box key={w} className="coach-card">
          <Typography variant="subtitle1">{week.name}</Typography>
          {week.days.map((day, d) => (
            <Box key={d} sx={{ ml: 2 }}>
              <Typography variant="subtitle2">{day.name}</Typography>
              {day.exercises.map((ex, x) => (
                <Typography key={x} sx={{ ml: 2 }}>
                  {ex.name}{ex.sets ? ` — ${ex.sets} sets` : ""}{ex.reps ? ` × ${ex.reps}` : ""}{ex.notes ? ` (${ex.notes})` : ""}
                </Typography>
              ))}
            </Box>
          ))}
        </Box>
      ))}
    </>
  );

  return (
    <AppLayout onLogout={onLogout}>
      <Box component="section" className="page-heading">
        <div>
          <div className="eyebrow">Coaching</div>
          <h1>Training plan</h1>
        </div>
      </Box>
      {error && <Typography role="alert">{error}</Typography>}
      <Box component="section" className="coach-panel">
        {plan === null && <Typography>Loading plan...</Typography>}
        {plan === false && locked && (
          <Typography>Your plan is locked until your coach confirms your payment. You can still chat below.</Typography>
        )}
        {plan === false && !locked && <Typography>Your coach hasn't created a plan yet.</Typography>}
        {plan && (isCoach ? renderEditor() : renderView())}
      </Box>
      <ChatPanel requestId={requestId} currentUserId={profile.keycloakId} />
    </AppLayout>
  );
};

export default CoachingPage;
