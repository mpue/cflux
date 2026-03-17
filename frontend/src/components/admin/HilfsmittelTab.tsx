import React, { useState, useCallback } from 'react';

// --- Password Generator ---

interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  uppercaseNoAmbiguous: 'ABCDEFGHJKLMNPQRSTUVWXYZ', // ohne I, O
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  lowercaseNoAmbiguous: 'abcdefghjkmnpqrstuvwxyz', // ohne i, l, o
  numbers: '0123456789',
  numbersNoAmbiguous: '23456789', // ohne 0, 1
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

function generatePassword(options: PasswordOptions): string {
  let charset = '';
  if (options.uppercase) charset += options.excludeAmbiguous ? CHAR_SETS.uppercaseNoAmbiguous : CHAR_SETS.uppercase;
  if (options.lowercase) charset += options.excludeAmbiguous ? CHAR_SETS.lowercaseNoAmbiguous : CHAR_SETS.lowercase;
  if (options.numbers) charset += options.excludeAmbiguous ? CHAR_SETS.numbersNoAmbiguous : CHAR_SETS.numbers;
  if (options.symbols) charset += CHAR_SETS.symbols;

  if (!charset) return '';

  const array = new Uint32Array(options.length);
  crypto.getRandomValues(array);
  return Array.from(array, (val) => charset[val % charset.length]).join('');
}

function calculateStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '#ccc' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Schwach', color: '#e74c3c' };
  if (score <= 3) return { score, label: 'Mittel', color: '#f39c12' };
  if (score <= 4) return { score, label: 'Stark', color: '#27ae60' };
  return { score, label: 'Sehr stark', color: '#2ecc71' };
}

const PasswordGenerator: React.FC = () => {
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: false,
  });
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const generate = useCallback(() => {
    const pw = generatePassword(options);
    setPassword(pw);
    setCopied(false);
    if (pw) {
      setHistory(prev => [pw, ...prev].slice(0, 10));
    }
  }, [options]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const strength = calculateStrength(password);

  return (
    <div style={{ maxWidth: '700px' }}>
      <h3 style={{ marginBottom: '20px' }}>🔑 Passwort Generator</h3>

      {/* Generated Password Display */}
      <div style={{
        background: 'var(--card-bg, #f8f9fa)',
        border: '2px solid var(--border-color, #dee2e6)',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        position: 'relative'
      }}>
        <div style={{
          fontFamily: 'monospace',
          fontSize: '20px',
          letterSpacing: '1px',
          wordBreak: 'break-all',
          minHeight: '30px',
          color: 'var(--text-primary, #333)',
          marginBottom: '10px'
        }}>
          {password || <span style={{ color: '#999', fontSize: '14px', fontFamily: 'inherit' }}>Klicken Sie auf "Generieren" um ein Passwort zu erstellen</span>}
        </div>

        {password && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <div style={{
                height: '6px',
                borderRadius: '3px',
                background: '#eee',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${(strength.score / 6) * 100}%`,
                  background: strength.color,
                  borderRadius: '3px',
                  transition: 'width 0.3s, background 0.3s'
                }} />
              </div>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: strength.color }}>
              {strength.label}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
        <button className="btn btn-primary" onClick={generate} style={{ flex: 1 }}>
          🎲 Generieren
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => password && handleCopy(password)}
          disabled={!password}
          style={{ minWidth: '140px' }}
        >
          {copied ? '✅ Kopiert!' : '📋 Kopieren'}
        </button>
      </div>

      {/* Options */}
      <div style={{
        background: 'var(--card-bg, #f8f9fa)',
        border: '1px solid var(--border-color, #dee2e6)',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <div style={{ fontWeight: '600', marginBottom: '15px', fontSize: '14px' }}>
          ⚙️ Einstellungen
        </div>

        {/* Length Slider */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ fontSize: '13px' }}>Länge</label>
            <span style={{ fontWeight: 600, fontSize: '14px' }}>{options.length}</span>
          </div>
          <input
            type="range"
            min={4}
            max={64}
            value={options.length}
            onChange={e => setOptions(o => ({ ...o, length: parseInt(e.target.value) }))}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#999' }}>
            <span>4</span>
            <span>64</span>
          </div>
        </div>

        {/* Character Options */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { key: 'uppercase' as const, label: 'Grossbuchstaben (A-Z)' },
            { key: 'lowercase' as const, label: 'Kleinbuchstaben (a-z)' },
            { key: 'numbers' as const, label: 'Zahlen (0-9)' },
            { key: 'symbols' as const, label: 'Sonderzeichen (!@#...)' },
          ].map(({ key, label }) => (
            <label key={key} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid var(--border-color, #dee2e6)',
              fontSize: '13px'
            }}>
              <input
                type="checkbox"
                checked={options[key]}
                onChange={e => setOptions(o => ({ ...o, [key]: e.target.checked }))}
              />
              {label}
            </label>
          ))}
        </div>

        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          padding: '8px',
          marginTop: '10px',
          fontSize: '13px',
          color: 'var(--text-secondary, #666)'
        }}>
          <input
            type="checkbox"
            checked={options.excludeAmbiguous}
            onChange={e => setOptions(o => ({ ...o, excludeAmbiguous: e.target.checked }))}
          />
          Mehrdeutige Zeichen ausschliessen (0, O, I, l, 1)
        </label>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div style={{
          background: 'var(--card-bg, #f8f9fa)',
          border: '1px solid var(--border-color, #dee2e6)',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontWeight: '600', fontSize: '14px' }}>📜 Letzte Passwörter</span>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setHistory([])}
              style={{ fontSize: '11px' }}
            >
              Leeren
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {history.map((pw, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                borderRadius: '4px',
                background: i === 0 ? 'rgba(52, 152, 219, 0.08)' : 'transparent',
                fontSize: '13px',
                fontFamily: 'monospace',
                wordBreak: 'break-all'
              }}>
                <span style={{ flex: 1, marginRight: '10px' }}>{pw}</span>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleCopy(pw)}
                  title="Kopieren"
                  style={{ flexShrink: 0, padding: '2px 8px', fontSize: '11px' }}
                >
                  📋
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main Hilfsmittel Tab ---

interface HilfsmittelTabProps {
  onUpdate: () => void;
}

const HilfsmittelTab: React.FC<HilfsmittelTabProps> = () => {
  const [activeTool, setActiveTool] = useState<string>('password');

  const tools = [
    { key: 'password', label: '🔑 Passwort Generator', description: 'Sichere Passwörter generieren' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>🛠️ Hilfsmittel</h2>
      </div>

      {/* Tool Selector */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', flexWrap: 'wrap' }}>
        {tools.map(tool => (
          <button
            key={tool.key}
            className={`btn ${activeTool === tool.key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTool(tool.key)}
            title={tool.description}
          >
            {tool.label}
          </button>
        ))}
      </div>

      {/* Tool Content */}
      {activeTool === 'password' && <PasswordGenerator />}
    </div>
  );
};

export default HilfsmittelTab;
