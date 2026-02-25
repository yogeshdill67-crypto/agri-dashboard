import { useState, useEffect, useRef } from 'react';
import { Mail, Plus, Trash2, Clock, CheckCircle, Zap, Droplets, Calendar, Power, Send, Settings, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG, isEmailJSConfigured } from '../emailjs.config';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_MAP: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

interface Schedule {
    id: string;
    device: 'pump' | 'irrigation';
    onTime: string;
    offTime: string;
    days: string[];
    enabled: boolean;
}

export const AutomationSection = () => {
    // ── Email state ──
    const [email, setEmail] = useState('');
    const [emailInput, setEmailInput] = useState('');
    const [emailSaved, setEmailSaved] = useState(false);
    const [sendingTest, setSendingTest] = useState(false);
    const [testResult, setTestResult] = useState<'success' | 'fail' | null>(null);
    const [inlineError, setInlineError] = useState('');

    // ── EmailJS Setup state ──
    const [showEJSSetup, setShowEJSSetup] = useState(false);
    const [ejsServiceId, setEjsServiceId] = useState(EMAILJS_CONFIG.SERVICE_ID);
    const [ejsTemplateId, setEjsTemplateId] = useState(EMAILJS_CONFIG.TEMPLATE_ID);
    const [ejsPublicKey, setEjsPublicKey] = useState(EMAILJS_CONFIG.PUBLIC_KEY);
    const [ejsConfigured, setEjsConfigured] = useState(isEmailJSConfigured());

    // ── Schedules state ──
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [device, setDevice] = useState<'pump' | 'irrigation'>('pump');
    const [onTime, setOnTime] = useState('06:00');
    const [offTime, setOffTime] = useState('08:00');
    const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);

    // Refs to avoid stale closures in interval
    const schedulesRef = useRef(schedules);
    const emailRef = useRef(email);
    schedulesRef.current = schedules;
    emailRef.current = email;

    // ── Load localStorage ──
    useEffect(() => {
        const savedEmail = localStorage.getItem('agri_email') || '';
        const savedSchedules = JSON.parse(localStorage.getItem('agri_schedules') || '[]');
        const savedEJS = JSON.parse(localStorage.getItem('agri_ejs') || '{}');
        setEmail(savedEmail);
        setEmailInput(savedEmail);
        setSchedules(savedSchedules);
        if (savedEJS.serviceId) {
            setEjsServiceId(savedEJS.serviceId);
            setEjsTemplateId(savedEJS.templateId);
            setEjsPublicKey(savedEJS.publicKey);
            setEjsConfigured(!!(savedEJS.serviceId && savedEJS.templateId && savedEJS.publicKey));
        }
    }, []);

    // ── Schedule clock: check every 60s ──
    useEffect(() => {
        const check = () => {
            const now = new Date();
            const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            const today = Object.keys(DAY_MAP).find(d => DAY_MAP[d] === now.getDay()) || '';

            schedulesRef.current.forEach(s => {
                if (!s.enabled || !s.days.includes(today)) return;
                if (s.onTime === hhmm) sendAutomationEmail(s, 'ON');
                if (s.offTime === hhmm) sendAutomationEmail(s, 'OFF');
            });
        };
        const timer = setInterval(check, 60000);
        return () => clearInterval(timer);
    }, []);

    // ── Send email via EmailJS ──
    const getEJSConfig = () => {
        const saved = JSON.parse(localStorage.getItem('agri_ejs') || '{}');
        return {
            serviceId: saved.serviceId || EMAILJS_CONFIG.SERVICE_ID,
            templateId: saved.templateId || EMAILJS_CONFIG.TEMPLATE_ID,
            publicKey: saved.publicKey || EMAILJS_CONFIG.PUBLIC_KEY,
        };
    };

    const sendAutomationEmail = async (schedule: Schedule, action: 'ON' | 'OFF') => {
        const cfg = getEJSConfig();
        const to = emailRef.current;
        if (!to || !cfg.serviceId || !cfg.templateId || !cfg.publicKey) return;

        const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        await emailjs.send(cfg.serviceId, cfg.templateId, {
            to_email: to,
            from_name: 'Agri Dashboard',
            device: schedule.device.toUpperCase(),
            action,
            time: action === 'ON' ? schedule.onTime : schedule.offTime,
            sent_at: now,
            message: `Your ${schedule.device} has been automatically turned ${action} at ${now}.`,
        }, cfg.publicKey).catch(console.error);
    };

    const sendTestEmail = async () => {
        const cfg = getEJSConfig();
        if (!email) {
            setInlineError('Save your email address first.');
            setTimeout(() => setInlineError(''), 3000);
            return;
        }
        if (!cfg.serviceId || !cfg.templateId || !cfg.publicKey) {
            setShowEJSSetup(true);
            setInlineError('Configure EmailJS settings first (expand the blue panel below).');
            setTimeout(() => setInlineError(''), 4000);
            return;
        }
        setSendingTest(true);
        setTestResult(null);
        try {
            const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
            await emailjs.send(cfg.serviceId, cfg.templateId, {
                to_email: email,
                from_name: 'Agri Dashboard',
                device: 'TEST',
                action: 'TEST',
                time: now,
                sent_at: now,
                message: 'This is a test email from your Agri Dashboard. Email notifications are working correctly!',
            }, cfg.publicKey);
            setTestResult('success');
        } catch {
            setTestResult('fail');
        } finally {
            setSendingTest(false);
            setTimeout(() => setTestResult(null), 4000);
        }
    };

    // ── Email handlers ──
    const saveEmail = () => {
        if (!emailInput.includes('@')) return;
        localStorage.setItem('agri_email', emailInput);
        setEmail(emailInput);
        setEmailSaved(true);
        setTimeout(() => setEmailSaved(false), 2500);
    };

    const saveEJSConfig = () => {
        const cfg = { serviceId: ejsServiceId, templateId: ejsTemplateId, publicKey: ejsPublicKey };
        localStorage.setItem('agri_ejs', JSON.stringify(cfg));
        setEjsConfigured(!!(ejsServiceId && ejsTemplateId && ejsPublicKey));
        setShowEJSSetup(false);
    };

    // ── Schedule handlers ──
    const saveSchedules = (updated: Schedule[]) => {
        setSchedules(updated);
        localStorage.setItem('agri_schedules', JSON.stringify(updated));
    };

    const addSchedule = () => {
        if (!onTime || !offTime || selectedDays.length === 0) return;
        saveSchedules([...schedules, {
            id: Date.now().toString(), device, onTime, offTime, days: selectedDays, enabled: true,
        }]);
        setShowAddForm(false);
        setOnTime('06:00'); setOffTime('08:00');
        setSelectedDays(['Mon', 'Wed', 'Fri']); setDevice('pump');
    };

    const toggleSchedule = (id: string) =>
        saveSchedules(schedules.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));

    const deleteSchedule = (id: string) =>
        saveSchedules(schedules.filter(s => s.id !== id));

    const toggleDay = (day: string) =>
        setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);

    // ── Styles ──
    const cardStyle = {
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        borderRadius: '1.25rem',
        border: '1px solid rgba(22,101,52,0.1)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        padding: '1.25rem',
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '0.6rem 0.875rem',
        borderRadius: '0.75rem', border: '1.5px solid #e5e7eb',
        fontSize: '0.85rem', background: 'rgba(255,255,255,0.9)',
        color: '#1f2937', outline: 'none', boxSizing: 'border-box',
    };

    const greenBtn = {
        background: 'linear-gradient(135deg, #166534, #15803d)',
        color: 'white', border: 'none', borderRadius: '0.75rem',
        fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
        padding: '0.6rem 1.1rem', display: 'flex', alignItems: 'center',
        gap: '6px', boxShadow: '0 4px 12px rgba(22,101,52,0.25)',
        whiteSpace: 'nowrap' as const,
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* ── EmailJS Config Warning ── */}
            {!ejsConfigured && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ ...cardStyle, border: '1.5px solid #fde68a', background: '#fffbeb', padding: '0.875rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertCircle size={16} style={{ color: '#d97706', flexShrink: 0 }} />
                        <p style={{ fontSize: '0.78rem', color: '#92400e', fontWeight: 600 }}>
                            EmailJS not configured — tap ⚙ gear icon to set it up.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* ── Email Setup Card ── */}
            <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, #166534, #15803d)', padding: '0.5rem', borderRadius: '0.75rem' }}>
                        <Mail size={16} color="white" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1f2937' }}>Notification Email</p>
                        <p style={{ fontSize: '0.7rem', color: '#6b7280' }}>Receive alerts when devices turn ON/OFF</p>
                    </div>
                    {email && (
                        <span style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 700, padding: '2px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={10} /> Active
                        </span>
                    )}
                    <button onClick={() => setShowEJSSetup(!showEJSSetup)}
                        title="EmailJS Settings"
                        style={{ background: showEJSSetup ? '#eff6ff' : 'transparent', border: '1px solid ' + (ejsConfigured ? '#d1d5db' : '#fcd34d'), borderRadius: '0.625rem', padding: '0.4rem', cursor: 'pointer', color: ejsConfigured ? '#6b7280' : '#d97706', display: 'flex' }}>
                        <Settings size={15} />
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="email" placeholder="your@email.com" value={emailInput}
                        onChange={e => setEmailInput(e.target.value)}
                        style={{ ...inputStyle, flex: 1 }}
                        onFocus={e => (e.target.style.borderColor = '#15803d')}
                        onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
                    />
                    <motion.button whileTap={{ scale: 0.95 }} onClick={saveEmail} style={greenBtn}>
                        {emailSaved ? <><CheckCircle size={14} /> Saved!</> : 'Save'}
                    </motion.button>
                </div>

                {/* Inline error message */}
                {inlineError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0.6rem', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '0.625rem', padding: '0.4rem 0.75rem' }}>
                        <AlertCircle size={13} style={{ color: '#d97706', flexShrink: 0 }} />
                        <p style={{ fontSize: '0.72rem', color: '#92400e', fontWeight: 600 }}>{inlineError}</p>
                    </div>
                )}

                {email && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem' }}>
                        <p style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                            Alerts → <strong style={{ color: '#166534' }}>{email}</strong>
                        </p>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={sendTestEmail} disabled={sendingTest}
                            style={{
                                background: testResult === 'success' ? '#f0fdf4' : testResult === 'fail' ? '#fef2f2' : 'transparent',
                                color: testResult === 'success' ? '#166534' : testResult === 'fail' ? '#ef4444' : '#3b82f6',
                                border: `1px solid ${testResult === 'success' ? '#bbf7d0' : testResult === 'fail' ? '#fecaca' : '#bfdbfe'}`,
                                borderRadius: '0.625rem', padding: '0.35rem 0.75rem',
                                fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '5px',
                            }}>
                            <Send size={11} />
                            {sendingTest ? 'Sending...' : testResult === 'success' ? '✓ Sent!' : testResult === 'fail' ? '✗ Failed' : 'Send Test'}
                        </motion.button>
                    </div>
                )}
            </div>

            {/* ── EmailJS Setup Panel ── */}
            <AnimatePresence>
                {showEJSSetup && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                        <div style={{ ...cardStyle, border: '1.5px solid #bfdbfe', background: '#eff6ff' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.875rem' }}>
                                <Settings size={15} style={{ color: '#3b82f6' }} />
                                <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e40af' }}>EmailJS Setup</p>
                                <a href="https://www.emailjs.com" target="_blank" rel="noreferrer"
                                    style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#3b82f6', fontWeight: 600 }}>
                                    Get free account ↗
                                </a>
                            </div>
                            <p style={{ fontSize: '0.7rem', color: '#1d4ed8', marginBottom: '0.875rem', background: '#dbeafe', borderRadius: '0.625rem', padding: '0.5rem 0.75rem' }}>
                                1. Sign up at emailjs.com → 2. Add Gmail service → 3. Create template with variables: <code>to_email</code>, <code>device</code>, <code>action</code>, <code>message</code>, <code>sent_at</code> → 4. Paste IDs below
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {[
                                    { label: 'Service ID', val: ejsServiceId, set: setEjsServiceId, ph: 'service_abc123' },
                                    { label: 'Template ID', val: ejsTemplateId, set: setEjsTemplateId, ph: 'template_xyz789' },
                                    { label: 'Public Key', val: ejsPublicKey, set: setEjsPublicKey, ph: 'user_XXXXXXXXXX' },
                                ].map(f => (
                                    <div key={f.label}>
                                        <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '3px' }}>{f.label}</label>
                                        <input type="text" value={f.val} placeholder={f.ph}
                                            onChange={e => f.set(e.target.value)}
                                            style={{ ...inputStyle, background: 'white', borderColor: '#bfdbfe', fontFamily: 'monospace', fontSize: '0.8rem' }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <motion.button whileTap={{ scale: 0.97 }} onClick={saveEJSConfig}
                                style={{ ...greenBtn, width: '100%', marginTop: '1rem', justifyContent: 'center', background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}>
                                <CheckCircle size={14} /> Save EmailJS Config
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Schedules Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
                    <Calendar size={18} style={{ color: 'var(--primary)' }} />
                    Automation Schedules
                </h3>
                <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddForm(!showAddForm)}
                    style={{
                        background: showAddForm ? '#fef2f2' : 'linear-gradient(135deg, #166534, #15803d)',
                        color: showAddForm ? '#ef4444' : 'white',
                        border: showAddForm ? '1px solid #fecaca' : 'none',
                        borderRadius: '0.75rem', padding: '0.5rem 1rem',
                        fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        boxShadow: showAddForm ? 'none' : '0 4px 12px rgba(22,101,52,0.25)',
                        transition: 'all 0.2s'
                    }}>
                    <Plus size={14} />
                    {showAddForm ? 'Cancel' : 'Add Schedule'}
                </motion.button>
            </div>

            {/* ── Add Schedule Form ── */}
            <AnimatePresence>
                {showAddForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                        <div style={{ ...cardStyle, border: '1.5px solid rgba(22,101,52,0.2)' }}>
                            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.875rem' }}>New Schedule</p>

                            {/* Device */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                                {(['pump', 'irrigation'] as const).map(d => (
                                    <button key={d} onClick={() => setDevice(d)} style={{
                                        padding: '0.625rem', borderRadius: '0.75rem',
                                        border: device === d ? 'none' : '1px solid #e5e7eb',
                                        background: device === d ? 'linear-gradient(135deg, #166534, #15803d)' : 'rgba(255,255,255,0.7)',
                                        color: device === d ? 'white' : '#374151',
                                        fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                        transition: 'all 0.2s', boxShadow: device === d ? '0 4px 12px rgba(22,101,52,0.25)' : 'none'
                                    }}>
                                        {d === 'pump' ? <Zap size={14} /> : <Droplets size={14} />}
                                        {d === 'pump' ? 'Pump' : 'Irrigation'}
                                    </button>
                                ))}
                            </div>

                            {/* Times */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                                {[{ label: 'ON Time', val: onTime, set: setOnTime, color: '#22c55e' },
                                { label: 'OFF Time', val: offTime, set: setOffTime, color: '#ef4444' }].map(f => (
                                    <div key={f.label}>
                                        <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.4rem' }}>
                                            <Power size={9} style={{ color: f.color }} />{f.label}
                                        </label>
                                        <input type="time" value={f.val} onChange={e => f.set(e.target.value)} style={{ ...inputStyle }} />
                                    </div>
                                ))}
                            </div>

                            {/* Days */}
                            <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Days</p>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                                {DAYS.map(day => (
                                    <button key={day} onClick={() => toggleDay(day)} style={{
                                        padding: '0.35rem 0.6rem', borderRadius: '9999px',
                                        border: selectedDays.includes(day) ? 'none' : '1px solid #e5e7eb',
                                        background: selectedDays.includes(day) ? 'linear-gradient(135deg, #166534, #15803d)' : 'rgba(255,255,255,0.7)',
                                        color: selectedDays.includes(day) ? 'white' : '#374151',
                                        fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer', transition: 'all 0.2s',
                                        boxShadow: selectedDays.includes(day) ? '0 2px 8px rgba(22,101,52,0.2)' : 'none'
                                    }}>{day}</button>
                                ))}
                            </div>

                            <motion.button whileTap={{ scale: 0.97 }} onClick={addSchedule}
                                style={{ ...greenBtn, width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.875rem', boxShadow: '0 4px 16px rgba(22,101,52,0.3)' }}>
                                <Clock size={16} /> Confirm Schedule
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Schedule List ── */}
            {schedules.length === 0 ? (
                <div style={{ ...cardStyle, textAlign: 'center', padding: '2rem' }}>
                    <Calendar size={36} style={{ color: '#d1d5db', margin: '0 auto 0.75rem' }} />
                    <p style={{ color: '#9ca3af', fontWeight: 600, fontSize: '0.875rem' }}>No schedules yet</p>
                    <p style={{ color: '#d1d5db', fontSize: '0.75rem', marginTop: '0.25rem' }}>Tap "Add Schedule" to automate your farm</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <AnimatePresence>
                        {schedules.map(s => (
                            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                                style={{ ...cardStyle, border: s.enabled ? '1.5px solid rgba(22,101,52,0.2)' : '1.5px solid #f3f4f6', opacity: s.enabled ? 1 : 0.55, transition: 'opacity 0.2s', padding: '1rem 1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ background: s.enabled ? 'linear-gradient(135deg, #166534, #15803d)' : '#e5e7eb', padding: '0.5rem', borderRadius: '0.75rem', transition: 'background 0.2s' }}>
                                            {s.device === 'pump' ? <Zap size={16} color={s.enabled ? 'white' : '#9ca3af'} /> : <Droplets size={16} color={s.enabled ? 'white' : '#9ca3af'} />}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1f2937', textTransform: 'capitalize' }}>{s.device}</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#22c55e', background: '#f0fdf4', padding: '1px 6px', borderRadius: '9999px' }}>ON {s.onTime}</span>
                                                <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>→</span>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#ef4444', background: '#fef2f2', padding: '1px 6px', borderRadius: '9999px' }}>OFF {s.offTime}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '3px', marginTop: '5px', flexWrap: 'wrap' }}>
                                                {s.days.map(d => (
                                                    <span key={d} style={{ fontSize: '0.6rem', fontWeight: 700, color: '#166534', background: 'rgba(22,101,52,0.08)', padding: '1px 5px', borderRadius: '4px' }}>{d}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <button onClick={() => toggleSchedule(s.id)} style={{ width: '44px', height: '26px', borderRadius: '9999px', backgroundColor: s.enabled ? '#15803d' : '#e5e7eb', position: 'relative', border: 'none', cursor: 'pointer', transition: 'background-color 0.25s', flexShrink: 0 }}>
                                            <motion.div animate={{ x: s.enabled ? 20 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: '3px', left: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                                        </button>
                                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteSchedule(s.id)}
                                            style={{ width: '32px', height: '32px', borderRadius: '0.625rem', border: '1px solid #fee2e2', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Trash2 size={14} />
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};
