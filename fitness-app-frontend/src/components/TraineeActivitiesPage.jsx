import { Box } from "@mui/material";
import { useParams } from "react-router";
import ActivityList from "./ActivityList";
import AppLayout from "./AppLayout";

const TraineeActivitiesPage = ({ onLogout }) => {
  const { traineeId } = useParams();

  return (
    <AppLayout onLogout={onLogout}>
      <Box component="section" className="page-heading">
        <div>
          <div className="eyebrow">Read-only view</div>
          <h1>Trainee activity</h1>
        </div>
      </Box>
      <Box component="section" className="history-panel">
        <ActivityList traineeId={traineeId} />
      </Box>
    </AppLayout>
  );
};

export default TraineeActivitiesPage;
