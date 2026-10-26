import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { getActivityDetail } from '../services/api';
import { Box, Card, CardContent, Divider, Typography } from '@mui/material';
import AppLayout from './AppLayout';

const ActivityDetail = ({ onLogout }) => {
    const { id } = useParams();
    const [activity, setActivity] = useState(null);
    const [recommendation, setRecommendation] = useState(null);

    useEffect(() => {
        const fetchActivityDetail = async () =>{
            try {
                const response = await getActivityDetail(id);
                setActivity(response.data);
                setRecommendation(response.data.recommendation);

            } catch (error) {
                console.error(error);
            }
        }

        fetchActivityDetail();
    }, [id]);
    
    if (!activity) {
        return <AppLayout onLogout={onLogout}><Typography className="loading-state">Loading...</Typography></AppLayout>
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

            {recommendation && (
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
                            <Typography paragraph>{activity.recommendation}</Typography>
                        </Box>
                        
                        <Divider className="detail-divider" sx={{ my: 2 }} />
                        <Box className="recommendation-section">
                            <Typography variant="h6" component="h3">Improvements</Typography>
                            {activity?.improvements?.map((improvement, index) => (
                                <Typography key={index} paragraph>• {activity.improvements}</Typography>
                            ))}
                        </Box>
                        
                        <Divider className="detail-divider" sx={{ my: 2 }} />
                        <Box className="recommendation-section">
                            <Typography variant="h6" component="h3">Suggestions</Typography>
                            {activity?.suggestions?.map((suggestion, index) => (
                                <Typography key={index} paragraph>• {suggestion}</Typography>
                            ))}
                        </Box>
                        
                        <Divider className="detail-divider" sx={{ my: 2 }} />
                        <Box className="recommendation-section">
                            <Typography variant="h6" component="h3">Safety Guidelines</Typography>
                            {activity?.safety?.map((safety, index) => (
                                <Typography key={index} paragraph>• {safety}</Typography>
                            ))}
                        </Box>
                    </CardContent>
                </Card>
            )}
        </AppLayout>
    )
}

export default ActivityDetail