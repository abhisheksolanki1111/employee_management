import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Typography, Button, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, IconButton, Box, useMediaQuery
} from '@mui/material';
import { Add, Edit, Delete, History } from '@mui/icons-material';
import axios from 'axios';

const Dashboard = () => {
    const [employees, setEmployees] = useState([]);
    const navigate = useNavigate();
    const isMobile = useMediaQuery('(max-width:600px)');

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('/api/employees', {
                    headers: { 'x-auth-token': token }
                });
                setEmployees(res.data);
            } catch (err) {
                if (err.response?.status === 401) navigate('/login');
            }
        };
        fetchEmployees();
    }, [navigate]);

    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/employees/${id}`, {
                headers: { 'x-auth-token': token }
            });
            setEmployees(employees.filter(emp => emp._id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 20 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Employee Management</Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate('/employee/add')}
                >
                    Add Employee
                </Button>
            </Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            {!isMobile && <TableCell>Email</TableCell>}
                            {!isMobile && <TableCell>Address</TableCell>}
                            <TableCell>Experience</TableCell>
                            {!isMobile && <TableCell>Last Company</TableCell>}
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {employees.map((employee) => (
                            <TableRow key={employee._id}>
                                <TableCell>{employee.name}</TableCell>
                                {!isMobile && <TableCell>{employee.email}</TableCell>}
                                {!isMobile && <TableCell>{employee.address}</TableCell>}
                                <TableCell>{employee.experience} yrs</TableCell>
                                {!isMobile && <TableCell>{employee.lastWorkCompany}</TableCell>}
                                <TableCell>
                                    <IconButton onClick={() => navigate(`/employee/edit/${employee._id}`)}>
                                        <Edit color="primary" />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(employee._id)}>
                                        <Delete color="error" />
                                    </IconButton>
                                    <IconButton onClick={() => navigate(`/employee/history/${employee._id}`)}>
                                        <History color="action" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};

export default Dashboard;