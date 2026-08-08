import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Error de autenticación');
      return;
    }

    navigate(from, { replace: true });
  };

  return (
    <div className="login-container">
      <div className="login-card-premium">
        <div className="login-header-premium">
          <div className="login-avatar-premium">
            <i className="pi pi-user" />
          </div>
          <h1>Iniciar sesión</h1>
          <p>Accede a tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form-premium">
          <div className="login-input-field">
            <span className="p-input-icon-left w-full">
              <i className="pi pi-envelope" style={{ color: 'var(--text-secondary)' }} />
              <InputText
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="Correo"
                className="w-full"
              />
            </span>
          </div>

          <div className="login-input-field p-fluid" style={{ position: 'relative' }}>
            <i className="pi pi-lock" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10, color: 'var(--text-secondary)' }} />
            <Password
              id="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              feedback={false}
              toggleMask
              placeholder="Contraseña"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="login-error-premium">
              <i className="pi pi-exclamation-circle" style={{ fontSize: '1.15rem' }} />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            label="Entrar"
            loading={loading}
            className="w-full login-btn-premium"
          />
        </form>
      </div>
    </div>
  );
}
