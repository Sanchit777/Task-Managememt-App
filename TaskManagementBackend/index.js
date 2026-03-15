require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Initialize Google Sheets Config
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : '',
    scopes: SCOPES,
});

let doc;

async function initGoogleSheets() {
    try {
        if (!process.env.GOOGLE_SHEET_ID) {
            console.warn("GOOGLE_SHEET_ID missing. Skipping Google Sheets initialization.");
            return;
        }
        doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
        await doc.loadInfo(); 
        console.log(`Connected to Google Sheet: ${doc.title}`);
        
        // Ensure Tabs Exist
        const usersSheet = doc.sheetsByTitle['Users'];
        if (!usersSheet) {
             await doc.addSheet({ title: 'Users', headerValues: ['ID', 'Password', 'Role'] });
             console.log("Created 'Users' sheet");
        }

        const tasksSheet = doc.sheetsByTitle['Tasks'];
        if (!tasksSheet) {
             await doc.addSheet({ title: 'Tasks', headerValues: ['Task ID', 'Date', 'Client Name', 'System Name', 'Task Type', 'Description', 'Responsible Person', 'Status', 'Assigned Date', 'Completion Date', 'Deadline', 'Remarks'] });
             console.log("Created 'Tasks' sheet");
        }

    } catch (error) {
        console.error("Failed to connect to Google Sheets:", error);
    }
}

initGoogleSheets();

// Nodemailer Config
const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Helper for Task ID Generation
const generateTaskId = async (sheet) => {
    await sheet.loadCells('A:A'); // Assuming 'Task ID' is Column A
    const rows = await sheet.getRows();
    const today = new Date();
    
    // Format YYYYMMDD correctly, handling timezone issues
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateString = `${year}${month}${day}`;
    
    let highestCount = 0;
    
    for(const row of rows) {
        const id = row.get('Task ID'); 
        if(id && id.startsWith(`TASK-${dateString}-`)) {
             const parts = id.split('-');
             if(parts.length === 3) {
                 const count = parseInt(parts[2], 10);
                 if(count > highestCount) highestCount = count;
             }
        }
    }
    
    const nextCount = highestCount + 1;
    return `TASK-${dateString}-${nextCount.toString().padStart(3, '0')}`;
};

// --- Endpoints ---

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', sheetsConnected: !!doc });
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!doc) return res.status(500).json({ error: "Google Sheets not connected yet" });
        
        const sheet = doc.sheetsByTitle['Users'];
        const rows = await sheet.getRows();
        const user = rows.find(r => r.get('ID') === username && r.get('Password') === password);
        
        if (user) {
            res.json({ success: true, user: { id: user.get('ID'), role: user.get('Role') } }); 
        } else {
            res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get All Tasks
app.get('/api/tasks', async (req, res) => {
    try {
        if (!doc) return res.status(500).json({ error: "Google Sheets not connected yet" });
        const sheet = doc.sheetsByTitle['Tasks'];
        const rows = await sheet.getRows();
        
        const tasks = rows.map(row => {
            return {
                id: row.get('Task ID'),
                date: row.get('Date'),
                clientName: row.get('Client Name'),
                systemName: row.get('System Name'),
                taskType: row.get('Task Type'),
                description: row.get('Description'),
                responsiblePerson: row.get('Responsible Person'),
                status: row.get('Status'),
                assignedDate: row.get('Assigned Date'),
                completionDate: row.get('Completion Date'),
                deadline: row.get('Deadline'),
                remarks: row.get('Remarks')
            }
        });
        
        res.json(tasks);
    } catch (error) {
        console.error("Get Tasks Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Create Task
app.post('/api/tasks', async (req, res) => {
    try {
        if (!doc) return res.status(500).json({ error: "Google Sheets not connected yet" });
        const sheet = doc.sheetsByTitle['Tasks'];
        
        const taskId = await generateTaskId(sheet);
        const newTaskData = { ...req.body, 'Task ID': taskId };
        
        // Map JSON body to Sheet Columns
        const rowData = {
            'Task ID': taskId,
            'Date': req.body.date || '',
            'Client Name': req.body.clientName || '',
            'System Name': req.body.systemName || '',
            'Task Type': req.body.taskType || '',
            'Description': req.body.description || '',
            'Responsible Person': req.body.responsiblePerson || '',
            'Status': req.body.status || 'Pending',
            'Assigned Date': req.body.assignedDate || '',
            'Completion Date': req.body.completionDate || '',
            'Deadline': req.body.deadline || '',
            'Remarks': req.body.remarks || ''
        };

        await sheet.addRow(rowData);

        // Send Email Notification
        if (process.env.EMAIL_USER) {
             const mailOptions = {
                 from: process.env.EMAIL_USER,
                 to: 'sanchitchoudhary123@gmail.com', // Change this to the intended recipient logic later (e.g. assigned person's email)
                 subject: `New Task Assigned: ${taskId}`,
                 text: `You have been assigned a new task.\n\nClient: ${rowData['Client Name']}\nDescription: ${rowData['Description']}\nDeadline: ${rowData['Deadline']}`
             };
             
             transporter.sendMail(mailOptions, (error, info) => {
                  if (error) console.log("Email Error: ", error);
                  else console.log('Email sent: ' + info.response);
             });
        }

        res.json({ success: true, taskId: taskId, task: rowData });
    } catch (error) {
        console.error("Create Task Error:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

// Update Task (Status mostly)
app.put('/api/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!doc) return res.status(500).json({ error: "Google Sheets not connected yet" });
        const sheet = doc.sheetsByTitle['Tasks'];
        const rows = await sheet.getRows();
        
        const row = rows.find(r => r.get('Task ID') === id);
        
        if (!row) {
            return res.status(404).json({ error: "Task not found" });
        }

        const oldStatus = row.get('Status');
        const newStatus = req.body.status || oldStatus;

        // Update fields based on request body
        if (req.body.date) row.assign({'Date': req.body.date});
        if (req.body.clientName) row.assign({'Client Name': req.body.clientName});
        if (req.body.systemName) row.assign({'System Name': req.body.systemName});
        if (req.body.taskType) row.assign({'Task Type': req.body.taskType});
        if (req.body.description) row.assign({'Description': req.body.description});
        if (req.body.responsiblePerson) row.assign({'Responsible Person': req.body.responsiblePerson});
        if (req.body.status) row.assign({'Status': req.body.status});
        if (req.body.assignedDate) row.assign({'Assigned Date': req.body.assignedDate});
        if (req.body.completionDate) row.assign({'Completion Date': req.body.completionDate});
        if (req.body.deadline) row.assign({'Deadline': req.body.deadline});
        if (req.body.remarks) row.assign({'Remarks': req.body.remarks});

        await row.save();

        // Send Email Notification if Status Changed
        if (process.env.EMAIL_USER && oldStatus !== newStatus) {
             const mailOptions = {
                 from: process.env.EMAIL_USER,
                 to: 'sanchitchoudhary123@gmail.com', // Update recipient logic
                 subject: `Task Status Updated: ${id}`,
                 text: `Task ID ${id} has been marked as ${newStatus}.\n\nClient: ${row.get('Client Name')}\nDescription: ${row.get('Description')}`
             };
             
             transporter.sendMail(mailOptions, (error, info) => {
                  if (error) console.log("Email Error: ", error);
                  else console.log('Email sent: ' + info.response);
             });
        }

        res.json({ success: true, message: "Task updated" });

    } catch (error) {
        console.error("Update Task Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Delete Task
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!doc) return res.status(500).json({ error: "Google Sheets not connected yet" });
        const sheet = doc.sheetsByTitle['Tasks'];
        const rows = await sheet.getRows();
        
        const row = rows.find(r => r.get('Task ID') === id);
        
        if (row) {
            await row.delete();
            res.json({ success: true, message: "Task deleted" });
        } else {
             res.status(404).json({ error: "Task not found" });
        }
    } catch (error) {
        console.error("Delete Task Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
