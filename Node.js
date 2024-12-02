const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());
app.use(cors());
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/discussion_forum', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));

// Models
// Question Schema
const QuestionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    resolved: { type: Boolean, default: false },
    upvotes: { type: Number, default: 0 }
});

// Reply Schema
const ReplySchema = new mongoose.Schema({
    content: { type: String, required: true },
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true }
});

// User Schema
const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const Question = mongoose.model('Question', QuestionSchema);
const Reply = mongoose.model('Reply', ReplySchema);
const User = mongoose.model('User', UserSchema);

// Routes

// Homepage Route
app.get('/', (req, res) => {
    res.render('index');
});

// User Signup Route
app.post('/signup', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save the user
        const newUser = new User({ firstName, lastName, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error during signup', error });
    }
});

// User Login Route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Compare passwords
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Successful login - Redirect to the homepage or dashboard
        res.status(200).json({ message: 'Login successful', user });
    } catch (error) {
        res.status(500).json({ message: 'Error during login', error });
    }
});

// Get Questions Route
app.get('/questions', async (req, res) => {
    try {
        const questions = await Question.find();
        res.json(questions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add Question Route
app.post('/questions', async (req, res) => {
    const { title, description } = req.body;
    try {
        const question = new Question({ title, description });
        await question.save();
        res.status(201).json({ message: 'Question created successfully!', question });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update Question Route
app.patch('/questions/:id', async (req, res) => {
    const { id } = req.params;
    const { resolved, upvotes } = req.body;
    try {
        const question = await Question.findById(id);
        if (!question) return res.status(404).json({ message: 'Question not found' });

        if (resolved !== undefined) question.resolved = resolved;
        if (upvotes !== undefined) question.upvotes = upvotes;

        await question.save();
        res.json({ message: 'Question updated successfully!', question });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete Question Route
app.delete('/questions/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const question = await Question.findByIdAndDelete(id);
        if (!question) return res.status(404).json({ message: 'Question not found' });

        res.json({ message: 'Question deleted successfully!' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add Reply to Question Route
app.post('/questions/:id/replies', async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;

    try {
        const question = await Question.findById(id);
        if (!question) return res.status(404).json({ message: 'Question not found' });

        const reply = new Reply({ content, questionId: id });
        await reply.save();
        res.status(201).json({ message: 'Reply added successfully!', reply });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get Replies for a Question Route
app.get('/questions/:id/replies', async (req, res) => {
    const { id } = req.params;

    try {
        const replies = await Reply.find({ questionId: id });
        res.json(replies);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Page Routes (EJS rendering)
app.get('/homepagejs', (req, res) => res.render('index'));
app.get('/dashboardjs', (req, res) => res.render('dashboard'));
app.get('/cartjs', (req, res) => res.render('cart'));
app.get('/contactusjs', (req, res) => res.render('contactus'));
app.get('/enrolledcoursesjs', (req, res) => res.render('enrolledcourses'));
app.get('/Loginpage', (req, res) => res.render('login'));
app.get('/Signuppage', (req, res) => res.render('signup'));
app.get('/discussion', (req, res) => res.render('discussion'));

// Start the Server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
