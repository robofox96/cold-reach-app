import { Button, TextField } from '@mui/material';
import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

export default function LoginSignup({ onAuth }) {
  const [signupMsg, setSignupMsg] = useState('');
  const [loginMsg, setLoginMsg] = useState('');

  const handleSignup = async () => {
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    const result = await window.electronAPI.signup(username, password);
    setSignupMsg(result.success ? 'Signup successful! Please login.' : `Signup failed: ${result.error}`);
  };

  const handleLogin = async () => {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const result = await window.electronAPI.login(username, password);
    if (result.success) {
      onAuth();
    } else {
      setLoginMsg(`Login failed: ${result.error}`);
    }
  };

const [signupOpen, setSignupOpen] = useState(false);

return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        {/* Signup Button in Top Right */}
        <IconButton
            style={{ position: 'absolute', top: 16, right: 16 }}
            color="primary"
            onClick={() => setSignupOpen(true)}
            aria-label="Sign up"
        >
            <PersonAddIcon />
        </IconButton>

        <h1>Cold Emailer</h1>

        {/* Login Form */}
        <div style={{ width: 300, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2>Login</h2>
            <TextField
                variant="outlined"
                id="login-username"
                label="Username"
                style={{ marginBottom: 16, width: '100%' }}
            />
            <TextField
                variant="outlined"
                id="login-password"
                label="Password"
                type="password"
                style={{ marginBottom: 16, width: '100%' }}
            />
            <Button
                variant="contained"
                color="primary"
                onClick={handleLogin}
                style={{ width: '100%' }}
            >
                Login
            </Button>
            <div>{loginMsg}</div>
        </div>

        {/* Signup Dialog */}
        <Dialog open={signupOpen} onClose={() => setSignupOpen(false)}>
            <DialogTitle>Signup</DialogTitle>
            <DialogContent style={{ display: 'flex', flexDirection: 'column', minWidth: 300 }}>
                <TextField
                    variant="outlined"
                    id="signup-username"
                    label="Username"
                    style={{ marginBottom: 16, width: '100%' }}
                />
                <TextField
                    variant="outlined"
                    id="signup-password"
                    label="Password"
                    type="password"
                    style={{ marginBottom: 16, width: '100%' }}
                />
                <div>{signupMsg}</div>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setSignupOpen(false)}>Cancel</Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={async () => {
                        await handleSignup();
                        // Optionally close dialog on success
                        // if (signupMsg.startsWith('Signup successful')) setSignupOpen(false);
                    }}
                >
                    Signup
                </Button>
            </DialogActions>
        </Dialog>
    </div>
);
}