import { Button, Card, CardContent, Grid, Typography } from '@mui/material';
import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { getActivities } from '../services/api';

const ActivityList = ({ refreshToken, traineeId }) => {
    const [activities, setActivities] = useState([]);
    const [error, setError] = useState('');
    const [retryToken, setRetryToken] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchActivities = async () => {
            setError('');
            try {
                const response = traineeId ? await getActivities(traineeId) : await getActivities();
                setActivities(response.data);
            } catch {
                setError('Could not load activities. Please try again.');
            }
        };
        fetchActivities();
    }, [refreshToken, retryToken, traineeId]);
    
    return (
        <>
        {error && (
            <div role="alert">
                <Typography>{error}</Typography>
                <Button onClick={() => setRetryToken((current) => current + 1)}>Retry</Button>
            </div>
        )}
        <Grid className="activity-grid" container spacing={2}>
            {activities.map((activity) => (
                <Grid className="activity-grid__item" key={activity.id} container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
                    <Card className="activity-card" sx={{cursor: 'pointer'}} onClick= {() => navigate(traineeId ? `/trainees/${traineeId}/activities/${activity.id}` : `/activities/${activity.id}`)}>
                        <CardContent>
                            <Typography className="activity-card__type" variant='h6'>{activity.type}</Typography>
                            <Typography className="activity-card__metric">Duration: {activity.duration}</Typography>
                            <Typography className="activity-card__metric">Calories: {activity.caloriesBurned}</Typography>
                            {activity.exercises?.length > 0 && (
                                <Typography className="activity-card__metric">
                                    {activity.exercises.length} exercise{activity.exercises.length === 1 ? '' : 's'}
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
        </>
    )
}

export default ActivityList