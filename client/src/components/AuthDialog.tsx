import { useEffect, useMemo, useState } from 'react';
import type { AxiosError } from 'axios';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tab,
  Tabs,
  TextField,
  Typography,
  Divider,
  Stack,
} from '@mui/material';
import { GoogleLogin } from '@react-oauth/google';
import { useMsal } from '@azure/msal-react';
import { authApi, authStorage } from '../api';
import type { AuthResponse } from '../types/auth';

const MicrosoftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 23 23" style={{ marginRight: '8px' }}>
    <path fill="#f3f2f1" d="M0 0h23v23H0z" />
    <path fill="#f25022" d="M1 1h10v10H1z" />
    <path fill="#7fba00" d="M12 1h10v10H12z" />
    <path fill="#00a4ef" d="M1 12h10v10H1z" />
    <path fill="#ffb900" d="M12 12h10v10H12z" />
  </svg>
);

type AuthMode = 'login' | 'register';

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
  onAuthenticated: (response: AuthResponse) => void;
}

export default function AuthDialog({
  open,
  onClose,
  onAuthenticated,
}: AuthDialogProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { instance } = useMsal();

  useEffect(() => {
    if (!open) {
      setMode('login');
      setName('');
      setEmail('');
      setPassword('');
      setError('');
      setIsSubmitting(false);
    }
  }, [open]);

  const title = useMemo(
    () => (mode === 'login' ? 'Log in to EAFC Manager' : 'Create your account'),
    [mode],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response =
        mode === 'login'
          ? await authApi.login(email, password)
          : await authApi.register(name, email, password);

      authStorage.setToken(response.data.accessToken);
      onAuthenticated(response.data);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string | string[] }>;
      const message =
        axiosError.response?.data?.message ||
        (mode === 'login'
          ? 'Unable to log in with those credentials.'
          : 'Unable to create your account.');
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    setError('');
    setIsSubmitting(true);
    try {
      const response = await authApi.loginWithGoogle(credentialResponse.credential);
      authStorage.setToken(response.data.accessToken);
      onAuthenticated(response.data);
    } catch (err) {
      console.error(err);
      setError('Google login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const loginResponse = await instance.loginPopup({
        scopes: ['user.read'],
      });
      const response = await authApi.loginWithMicrosoft(loginResponse.accessToken);
      authStorage.setToken(response.data.accessToken);
      onAuthenticated(response.data);
    } catch (err) {
      console.error(err);
      setError('Microsoft login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Tabs
          value={mode}
          onChange={(_, nextMode: AuthMode) => {
            setMode(nextMode);
            setError('');
          }}
          sx={{ mb: 2 }}
        >
          <Tab label="Log in" value="login" />
          <Tab label="Register" value="register" />
        </Tabs>

        <Box
          component="form"
          id="auth-form"
          onSubmit={handleSubmit}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <Typography variant="body2" color="text.secondary">
            Signing in is optional for now. The rest of the app stays available either way.
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}

          {mode === 'register' && (
            <TextField
              label="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
              required
              fullWidth
            />
          )}

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoFocus={mode === 'login'}
            required
            fullWidth
          />

          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            fullWidth
            helperText={mode === 'register' ? 'Use at least 8 characters.' : ' '}
          />
        </Box>

        <Divider sx={{ my: 2 }}>or</Divider>

        <Stack spacing={2} sx={{ width: '100%', alignItems: 'center' }}>
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', '& > div': { width: '100% !important' } }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google login failed.')}
              theme="outline"
              size="large"
              width="396"
            />
          </Box>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<MicrosoftIcon />}
            onClick={handleMicrosoftLogin}
            disabled={isSubmitting}
            sx={{
              borderColor: '#8c8c8c',
              color: '#323130',
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              height: '40px',
              '&:hover': {
                borderColor: '#323130',
                backgroundColor: '#f3f2f1',
              },
            }}
          >
            Sign in with Microsoft
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Close
        </Button>
        <Button type="submit" form="auth-form" variant="contained" disabled={isSubmitting}>
          {mode === 'login' ? 'Log in' : 'Create account'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
