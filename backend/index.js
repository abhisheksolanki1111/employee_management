require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Connect to MongoDB with improved settings
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Models
const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        select: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const EmployeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
    },
    address: {
        type: String,
        required: [true, 'Please add an address'],
        maxlength: [100, 'Address cannot be more than 100 characters']
    },
    experience: {
        type: Number,
        required: [true, 'Please add experience in years'],
        min: [0, 'Experience cannot be negative'],
        max: [50, 'Experience cannot be more than 50 years']
    },
    lastWorkCompany: {
        type: String,
        required: [true, 'Please add last work company'],
        trim: true,
        maxlength: [50, 'Company name cannot be more than 50 characters']
    },
    dateOfResignation: {
        type: Date,
        required: [true, 'Please add date of resignation']
    },
    joiningDate: {
        type: Date,
        required: [true, 'Please add joining date']
    },
    history: [{
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        data: {
            name: String,
            email: String,
            address: String,
            experience: Number,
            lastWorkCompany: String,
            dateOfResignation: Date,
            joiningDate: Date
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    }
});

// Add history before updating
EmployeeSchema.pre('save', function (next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

const User = mongoose.model('User', UserSchema);
const Employee = mongoose.model('Employee', EmployeeSchema);

// Middleware
const authenticate = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.user.id).select('-password');
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }
};

// API Routes
const router = express.Router();

// Auth Routes
router.post('/auth/register', [
    body('email').isEmail().withMessage('Please include a valid email').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { email, password } = req.body;

    try {
        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        user = new User({ email, password });
        await user.save();

        // Create token
        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '1h' },
            (err, token) => {
                if (err) throw err;
                res.status(201).json({
                    success: true,
                    token
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

router.post('/auth/login', [
    body('email').isEmail().withMessage('Please include a valid email').normalizeEmail(),
    body('password').exists().withMessage('Password is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { email, password } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Create token
        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    success: true,
                    token
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Employee CRUD Routes
router.get('/employees', authenticate, async (req, res) => {
    try {
        const employees = await Employee.find()
            .sort('-joiningDate')
            .select('-history');

        res.status(200).json({
            success: true,
            count: employees.length,
            data: employees
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

router.get('/employees/:id', authenticate, async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        res.status(200).json({
            success: true,
            data: employee
        });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

router.post('/employees', authenticate, [
    body('name').not().isEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('address').not().isEmpty().withMessage('Address is required'),
    body('experience').isNumeric().withMessage('Experience must be a number'),
    body('lastWorkCompany').not().isEmpty().withMessage('Last work company is required'),
    body('dateOfResignation').isISO8601().withMessage('Invalid date format (YYYY-MM-DD)'),
    body('joiningDate').isISO8601().withMessage('Invalid date format (YYYY-MM-DD)')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        // Check if employee exists
        const existingEmployee = await Employee.findOne({ email: req.body.email });
        if (existingEmployee) {
            return res.status(400).json({
                success: false,
                message: 'Employee with this email already exists'
            });
        }

        const employee = new Employee({
            ...req.body,
            history: [{
                changedAt: new Date(),
                changedBy: req.user.id,
                data: req.body
            }]
        });

        await employee.save();

        res.status(201).json({
            success: true,
            data: employee
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

router.put('/employees/:id', authenticate, [
    body('name').not().isEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('address').not().isEmpty().withMessage('Address is required'),
    body('experience').isNumeric().withMessage('Experience must be a number'),
    body('lastWorkCompany').not().isEmpty().withMessage('Last work company is required'),
    body('dateOfResignation').isISO8601().withMessage('Invalid date format (YYYY-MM-DD)'),
    body('joiningDate').isISO8601().withMessage('Invalid date format (YYYY-MM-DD)')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        let employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Check if email is being changed to one that already exists
        if (req.body.email && req.body.email !== employee.email) {
            const existingEmployee = await Employee.findOne({ email: req.body.email });
            if (existingEmployee) {
                return res.status(400).json({
                    success: false,
                    message: 'Employee with this email already exists'
                });
            }
        }

        // Save current state to history before updating
        employee.history.push({
            changedAt: new Date(),
            changedBy: req.user.id,
            data: {
                name: employee.name,
                email: employee.email,
                address: employee.address,
                experience: employee.experience,
                lastWorkCompany: employee.lastWorkCompany,
                dateOfResignation: employee.dateOfResignation,
                joiningDate: employee.joiningDate
            }
        });

        // Update employee
        employee = await Employee.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: employee
        });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

router.delete('/employees/:id', authenticate, async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        await employee.remove();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Apply the routes
app.use('/api', router);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Not found'
    });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.error(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});