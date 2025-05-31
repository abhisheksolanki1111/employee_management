import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, TextField, Button, Box, Link, Paper } from '@mui/material';
import axios from 'axios';

const AuthPage = ({ isLogin }) => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const validate = () => {
        const newErrors = {};
        if (!formData.email.includes('@')) newErrors.email = 'Valid email is required';
        if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            const url = isLogin ? '/auth/login' : '/auth/register';
            const res = await axios.post(`/api${url}`, formData);
            localStorage.setItem('token', res.data.token);
            navigate('/dashboard');
        } catch (err) {
            setErrors({ submit: err.response?.data?.message || 'Authentication failed' });
        }
    };

    return (
        <Container maxWidth="xs">
            <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
                <Typography variant="h4" align="center" gutterBottom>
                    {isLogin ? 'Login' : 'Register'}
                </Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        error={!!errors.email}
                        helperText={errors.email}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        error={!!errors.password}
                        helperText={errors.password}
                    />
                    {errors.submit && (
                        <Typography color="error" sx={{ mt: 1 }}>
                            {errors.submit}
                        </Typography>
                    )}
                    <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        {isLogin ? 'Login' : 'Register'}
                    </Button>
                    <Typography align="center">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <Link href={isLogin ? '/register' : '/login'} underline="hover">
                            {isLogin ? 'Register' : 'Login'}
                        </Link>
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
};

export default AuthPage;