import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { getActivityDetail, getActivityRecommendation } from '../services/api';
import { Box, Card, CardContent, Divider, Typography } from '@mui/material';
import AppLayout from './AppLayout';

const ActivityDetail = ({ onLogout }) => {
    const { id, traineeId } = useParams();
    const [activity, setActivity] = useState(null);
    const [recommendation, setRecommendation] = useState(null);
    const [activityError, setActivityError] = useState(false);
    const [recommendationError, setRecommendationError] = useState(false);

    useEffect(() => {
        getActivityDetail(id, traineeId)
            .then((response) => setActivity(response.data))
            .catch((error) => {
                console.error(error);
                setActivityError(true);
            });
        getActivityRecommendation(id, traineeId)
            .then((response) => setRecommendation(response.data))
            .catch((error) => {
                console.error(error);
                setRecommendationError(true);
            });
    }, [id, traineeId]);
    
    if (!activity) {
        return (
            <AppLayout onLogout={onLogout}>
                <Typography className="loading-state" role={activityError ? 'alert' : undefined}>
                    {activityError ? 'Could not load this activity.' : 'Loading...'}
                </Typography>
            </AppLayout>
        );
    }
    return (
        <AppLayout onLogout={onLogout}>
            <Box component="section" className="detail-heading">
                <div className="eyebrow">Your training archive</div>
                <h1>Session report</h1>
            </Box>
            <Card className="detail-card">
                <CardContent>
                    <Typography className="detail-summary-heading" variant="h5" gutterBottom>Activity Details</Typography>
                    <div className="metrics-grid">
                        <div className="metric-card"><span className="eyebrow">Activity</span><Typography className="metric-value">{activity.type}</Typography></div>
                        <div className="metric-card"><span className="eyebrow">Duration</span><Typography className="metric-value">{activity.duration} min</Typography></div>
                        <div className="metric-card"><span className="eyebrow">Energy</span><Typography className="metric-value">{activity.caloriesBurned} kcal</Typography></div>
                        <div className="metric-card"><span className="eyebrow">Logged</span><Typography className="metric-value">{new Date(activity.createdAt).toLocaleString()}</Typography></div>
                    </div>
                </CardContent>
            </Card>

            {activity.exercises?.length > 0 && (
                <Card className="detail-card">
                    <CardContent>
                        <Typography className="detail-summary-heading" variant="h5" component="h2">
                            Exercises
                        </Typography>
                        <Box className="exercise-details">
                            {activity.exercises.map((exercise, index) => (
                                <Box className="exercise-details__item" key={`${exercise.name}-${index}`}>
                                    <Typography className="exercise-details__name">
                                        {exercise.name}
                                    </Typography>
                                    <Typography className="exercise-details__metrics">
                                        {exercise.sets} sets × {exercise.reps} reps · {exercise.weightKg} kg · {exercise.restSeconds}s rest
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </CardContent>
                </Card>
            )}

            {recommendation ? (
                <Card className="detail-card recommendation-card">
                    <CardContent>
                        <div className="recommendation-heading">
                            <div>
                                <div className="eyebrow">Next steps</div>
                                <Typography variant="h5" component="h2">AI Recommendation</Typography>
                            </div>
                            <span className="recommendation-tag">Session insight</span>
                        </div>
                        <Box className="recommendation-section">
                            <Typography variant="h6" component="h3">Analysis</Typography>
                            <Typography paragraph>{recommendation.recommendation}</Typography>
                        </Box>
                        
                        <Divider className="detail-divider" sx={{ my: 2 }} />
                        <Box className="recommendation-section">
                            <Typography variant="h6" component="h3">Improvements</Typography>
                            {recommendation.improvements?.map((improvement, index) => (
                                <Typography key={index} paragraph>• {improvement}</Typography>
                            ))}
                        </Box>
                        
                        <Divider className="detail-divider" sx={{ my: 2 }} />
                        <Box className="recommendation-section">
                            <Typography variant="h6" component="h3">Suggestions</Typography>
                            {recommendation.suggestions?.map((suggestion, index) => (
                                <Typography key={index} paragraph>• {suggestion}</Typography>
                            ))}
                        </Box>
                        
                        <Divider className="detail-divider" sx={{ my: 2 }} />
                        <Box className="recommendation-section">
                            <Typography variant="h6" component="h3">Safety Guidelines</Typography>
                            {recommendation.safety?.map((safety, index) => (
                                <Typography key={index} paragraph>• {safety}</Typography>
                            ))}
                        </Box>
                    </CardContent>
                </Card>
            ) : recommendationError ? (
                <Typography className="loading-state" role="status">
                    AI recommendation is not available yet.
                </Typography>
            ) : null}
        </AppLayout>
    )
}

export default ActivityDetail