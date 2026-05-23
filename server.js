const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/calendar', (req, res) => {
    console.log('Received request for /api/calendar');
    
    // Command calls the PowerShell script
    const command = 'powershell -ExecutionPolicy Bypass -NoProfile -File .\\fetch_outlook.ps1';
    
    exec(command, { maxBuffer: 1024 * 1024 * 10, encoding: 'utf8' }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Execution error: ${error}`);
            return res.status(500).json({ error: 'Failed to fetch calendar data', details: error.message });
        }
        
        try {
            // Trim any potential non-JSON output before the actual JSON starts
            const jsonStartIndex = stdout.indexOf('[');
            const jsonEndIndex = stdout.lastIndexOf(']') + 1;
            
            let jsonString = '';
            if (jsonStartIndex === -1 || jsonEndIndex === 0) {
                // If it's a single object or empty
                if (stdout.indexOf('{') !== -1) {
                   const objStart = stdout.indexOf('{');
                   const objEnd = stdout.lastIndexOf('}') + 1;
                   jsonString = '[' + stdout.substring(objStart, objEnd) + ']';
                } else {
                   return res.json([]);
                }
            } else {
                jsonString = stdout.substring(jsonStartIndex, jsonEndIndex);
            }
            
            const data = JSON.parse(jsonString);
            console.log(`Successfully parsed ${data.length} events. Sending to client...`);
            
            // Backup data for debugging
            fs.writeFileSync(path.join(__dirname, 'public', 'debug_events.json'), JSON.stringify(data, null, 2));

            res.json(data);
        } catch (parseError) {
            console.error(`Parse error: ${parseError}`);
            fs.writeFileSync(path.join(__dirname, 'public', 'debug_error.log'), `Parse Error:\n${parseError}\n\nStdout:\n${stdout}`);
            res.status(500).json({ error: 'Failed to parse calendar data', rawLength: stdout.length });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Meeting Room Calendar server running at http://localhost:${PORT}`);
});
