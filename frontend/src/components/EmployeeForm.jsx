import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Container, Typography, TextField, Button, Box, Paper,
    FormControl, InputLabel, MenuItem, Select, Grid
} from '@mui/material';
import axios from 'axios';
import dayjs from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers';

const EmployeeForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        address: '',
        experience: 0,
        lastWorkCompany: '',
        dateOfResignation: dayjs(),
        joiningDate: dayjs()
    });
    const [errors, setErrors] = useState({});
    useEffect(() => {
        if (id) {
            const fetchEmployee = async () => {
                console.log("Fetching employee with ID:", id);
                const token = localStorage.getItem('token');
                console.log("Token used:", token);

                try {
                    const res = await axios.get(`/api/employees/${id}`, {
                        headers: { 'x-auth-token': token }
                    });
                    console.log("Employee fetched:", res.data);

                    setFormData({
                        name: res.data.name || '',
                        email: res.data.email || '',
                        address: res.data.address || '',
                        experience: res.data.experience || 0,
                        lastWorkCompany: res.data.lastWorkCompany || '',
                        dateOfResignation: dayjs(res.data.dateOfResignation),
                        joiningDate: dayjs(res.data.joiningDate)
                    });
                } catch (err) {
                    console.error("Error fetching employee:", err);
                }
            };

            fetchEmployee();
        }
    }, [id]);
      

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.includes('@')) newErrors.email = 'Valid email is required';
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (formData.experience < 0) newErrors.experience = 'Experience must be positive';
        if (!formData.lastWorkCompany.trim()) newErrors.lastWorkCompany = 'Last company is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            const token = localStorage.getItem('token');
            const data = {
                ...formData,
                dateOfResignation: formData.dateOfResignation.toISOString(),
                joiningDate: formData.joiningDate.toISOString()
            };

            if (id) {
                await axios.put(`/api/employees/${id}`, data, {
                    headers: { 'x-auth-token': token }
                });
            } else {
                await axios.post('/api/employees', data, {
                    headers: { 'x-auth-token': token }
                });
            }
            navigate('/dashboard');
        } catch (err) {
            setErrors({ submit: err.response?.data?.message || 'Error saving employee' });
        }
    };

    return (
        <Container maxWidth="md">
            <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
                <Typography variant="h5" gutterBottom>
                    {id ? 'Edit Employee' : 'Add Employee'}
                </Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                error={!!errors.name}
                                helperText={errors.name}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                error={!!errors.email}
                                helperText={errors.email}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Address"
                                multiline
                                rows={2}
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                error={!!errors.address}
                                helperText={errors.address}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Experience (years)"
                                type="number"
                                value={formData.experience}
                                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                error={!!errors.experience}
                                helperText={errors.experience}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Last Work Company"
                                value={formData.lastWorkCompany}
                                onChange={(e) => setFormData({ ...formData, lastWorkCompany: e.target.value })}
                                error={!!errors.lastWorkCompany}
                                helperText={errors.lastWorkCompany}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <DatePicker
                                label="Date of Resignation"
                                value={formData.dateOfResignation}
                                onChange={(date) => setFormData({ ...formData, dateOfResignation: date })}
                                renderInput={(params) => <TextField fullWidth {...params} />}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <DatePicker
                                label="Joining Date"
                                value={formData.joiningDate}
                                onChange={(date) => setFormData({ ...formData, joiningDate: date })}
                                renderInput={(params) => <TextField fullWidth {...params} />}
                            />
                        </Grid>
                    </Grid>
                    {errors.submit && (
                        <Typography color="error" sx={{ mt: 2 }}>
                            {errors.submit}
                        </Typography>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                        <Button
                            variant="contained"
                            type="submit"
                            sx={{ mr: 2 }}
                        >
                            {id ? 'Update' : 'Add'} Employee
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/dashboard')}
                        >
                            Cancel
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default EmployeeForm;