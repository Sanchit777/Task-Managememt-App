require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const { Resend } = require('resend');

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
             await doc.addSheet({ title: 'Tasks', headerValues: ['Task ID', 'Date', 'Client Name', 'System Name', 'Task Type', 'Description', 'Responsible Person', 'Status', 'Assigned Date', 'Completion Date', 'Deadline', 'Remarks', 'Start Time', 'End Time'] });
             console.log("Created 'Tasks' sheet");
        }

    } catch (error) {
        console.error("Failed to connect to Google Sheets:", error);
    }
}

initGoogleSheets();

// Resend Config
// We will use EMAIL_PASS for the Resend API Key temporarily to avoid needing to add new ENV vars immediately.
const resend = new Resend(process.env.EMAIL_PASS);

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
                remarks: row.get('Remarks'),
                startTime: row.get('Start Time'),
                endTime: row.get('End Time')
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
            'Remarks': req.body.remarks || '',
            'Start Time': req.body.startTime || '',
            'End Time': req.body.endTime || ''
        };

        await sheet.addRow(rowData);

        // Send Email Notification using Resend
        if (process.env.EMAIL_USER) {
             try {
                 const { data, error } = await resend.emails.send({
                     from: 'Acme <onboarding@resend.dev>', // Resend's free testing domain
                     to: 'sanchitchoudhary123@gmail.com', // Only works for your verified email on the free tier
                     subject: `New Task Assigned: ${taskId}`,
                     html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                            <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
                                <h2 style="color: #ffffff; margin: 0; font-size: 24px;">New Task Assignment</h2>
                            </div>
                            <div style="padding: 24px; background-color: #ffffff;">
                                <p style="color: #475569; font-size: 16px; margin-top: 0;">You have been assigned a new task. Please review the details below:</p>
                                
                                <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                                    <tr>
                                        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; width: 140px; font-weight: bold;">Task ID</td>
                                        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-family: monospace;">${taskId}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: bold;">Client</td>
                                        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${rowData['Client Name']}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: bold;">Description</td>
                                        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${rowData['Description']}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px; color: #64748b; font-weight: bold;">Deadline</td>
                                        <td style="padding: 12px; color: #ef4444; font-weight: bold;">${rowData['Deadline'] || 'Not Set'}</td>
                                    </tr>
                                </table>
                            </div>
                            <div style="background-color: #f8fafc; padding: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
                                This is an automated message from the Task Management System.
                            </div>
                        </div>
                     `
                 });
                 if (error) console.log("Resend Email Error: ", error);
                 else console.log('Resend Email sent successfully: ', data.id);
             } catch (err) {
                 console.log("Resend Exception: ", err);
             }
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
        if (req.body.startTime) row.assign({'Start Time': req.body.startTime});
        if (req.body.endTime) row.assign({'End Time': req.body.endTime});

        if (newStatus === 'Completed' && oldStatus !== 'Completed') {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            row.assign({'Completion Date': `${year}-${month}-${day}`});
        }

        await row.save();

        // Send Email Notification if Status Changed using Resend
        if (process.env.EMAIL_USER && oldStatus !== newStatus) {
             try {
                 let statusColor = newStatus === 'Completed' ? '#10b981' : (newStatus === 'In Progress' ? '#f59e0b' : '#64748b');
                 const { data, error } = await resend.emails.send({
                     from: 'Acme <onboarding@resend.dev>',
                     to: 'sanchitchoudhary123@gmail.com',
                     subject: `Task Status Updated: ${id}`,
                     html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                            <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-bottom: 2px solid ${statusColor};">
                                <h2 style="color: #334155; margin: 0; font-size: 24px;">Task Status Update</h2>
                            </div>
                            <div style="padding: 24px; background-color: #ffffff;">
                                <p style="color: #475569; font-size: 16px; margin-top: 0;">The status for task <strong>${id}</strong> has been updated.</p>
                                
                                <div style="text-align: center; margin: 24px 0;">
                                    <span style="background-color: ${statusColor}1a; color: ${statusColor}; padding: 8px 16px; border-radius: 999px; font-weight: bold; font-size: 16px; text-transform: uppercase;">
                                        ${newStatus}
                                    </span>
                                </div>
                                
                                <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                                    <tr>
                                        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; width: 140px; font-weight: bold;">Client</td>
                                        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${row.get('Client Name')}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px; color: #64748b; font-weight: bold;">Description</td>
                                        <td style="padding: 12px; color: #0f172a;">${row.get('Description')}</td>
                                    </tr>
                                </table>
                            </div>
                            <div style="background-color: #f8fafc; padding: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
                                This is an automated message from the Task Management System.
                            </div>
                        </div>
                     `
                 });
                 if (error) console.log("Resend Email Error: ", error);
                 else console.log('Resend Email sent successfully: ', data.id);
             } catch (err) {
                 console.log("Resend Exception: ", err);
             }
        }

        res.json({ success: true, message: "Task updated" });

    } catch (error) {
        console.error("Update Task Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Test Email Endpoint using Resend
app.get('/api/test-email', async (req, res) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Acme <onboarding@resend.dev>',
            to: 'sanchitchoudhary123@gmail.com',
            subject: 'Render Server Resend Test',
            html: '<p>Testing Resend API from the live Render server.</p>'
        });

        if (error) {
           return res.status(400).json({ success: false, error });
        }
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
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
