import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Typography, Box, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Button
} from '@mui/material';
import axios from 'axios';
import dayjs from 'dayjs';

const EmployeeHistory = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState(null);

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`/api/employees/${id}`, {
                    headers: { 'x-auth-token': token }
                });
                setEmployee(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchEmployee();
    }, [id]);

    if (!employee) return <div>Loading...</div>;

    return (
        <Container maxWidth="md">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">Change History for {employee.name}</Typography>
                <Button variant="outlined" onClick={() => navigate(-1)}>
                    Back
                </Button>
            </Box>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Current Details</Typography>
                <Typography>Name: {employee.name}</Typography>
                <Typography>Email: {employee.email}</Typography>
                <Typography>Address: {employee.address}</Typography>
                <Typography>Experience: {employee.experience} years</Typography>
                <Typography>Last Company: {employee.lastWorkCompany}</Typography>
                <Typography>Date of Resignation: {dayjs(employee.dateOfResignation).format('MMM D, YYYY')}</Typography>
                <Typography>Joining Date: {dayjs(employee.joiningDate).format('MMM D, YYYY')}</Typography>
            </Paper>
            <Typography variant="h6" gutterBottom>Change History</Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Changed At</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Experience</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {employee.history.length > 0 ? (
                            [...employee.history].reverse().map((history, index) => (
                                <TableRow key={index}>
                                    <TableCell>{dayjs(history.changedAt).format('MMM D, YYYY h:mm A')}</TableCell>
                                    <TableCell>{history.data.name}</TableCell>
                                    <TableCell>{history.data.email}</TableCell>
                                    <TableCell>{history.data.experience} years</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} align="center">No history available</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};

export default EmployeeHistory;