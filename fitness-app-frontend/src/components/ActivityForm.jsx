import { Box, Button, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import React from 'react';
import { useState } from 'react';
import { addActivity } from '../services/api';

const initialActivity = {
    type: "RUNNING",
    duration: '',
    caloriesBurned: '',
    additionalMetrics: {}
};

const ActivityForm = ({ onActivityAdded }) => {
    const [activity, setActivity] = useState(initialActivity);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            await addActivity({
                ...activity,
                duration: Number(activity.duration),
                caloriesBurned: Number(activity.caloriesBurned)
            });
            setActivity(initialActivity);
            onActivityAdded();
        } catch {
            setError('Could not save this activity. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }
    
    return (
        <Box component="form" className="activity-form" onSubmit={handleSubmit}>
            {error && <Box role="alert">{error}</Box>}
            <FormControl fullWidth>
                <InputLabel>Activity Type</InputLabel>
                <Select
                    value= {activity.type}
                    onChange={(e) => setActivity({...activity, type: e.target.value})}>
                        <MenuItem value="RUNNING">Running</MenuItem>
                        <MenuItem value="WALKING">Walking</MenuItem>
                        <MenuItem value="CYCLING">Cycling</MenuItem>
                    </Select>
            </FormControl>
            <TextField fullWidth
                        className="activity-form__field"
                        label="Duration (Minutes)"
                        type='number'
                        value={activity.duration}
                        onChange={(e) => setActivity({...activity, duration: e.target.value})}/>
            
            <TextField fullWidth
                        className="activity-form__field"
                        label="Calories Burned"
                        type='number'
                        value={activity.caloriesBurned}
                        onChange={(e) => setActivity({...activity, caloriesBurned: e.target.value})}/>

            <Button className="activity-form__submit" type='submit' variant='contained' disabled={isSubmitting}>
                Add Activity
            </Button>
        </Box>
    )
}

export default ActivityForm