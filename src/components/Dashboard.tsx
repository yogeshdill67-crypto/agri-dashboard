import { useState, useRef } from 'react';
import { LayoutDashboard, Droplets, Zap, Bell, Bot } from 'lucide-react';
import { WeatherSection } from './WeatherSection';
import { AutomationSection } from './AutomationSection';
import { motion, AnimatePresence } from 'framer-motion';

export const Dashboard = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'automation'>('dashboard');
    const [pumpActive, setPumpActive] = useState(false);
    const [irrigationSettingsOpen, setIrrigationSettingsOpen] = useState(false);
    const [irrigationAutoStart, setIrrigationAutoStart] = useState(false);
    const [irrigationDuration, setIrrigationDuration] = useState('1');
    const [isIrrigating, setIsIrrigating] = useState(false);
    const irrigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const intervals = [
        { label: '1/2 hr', value: '0.5' },
        { label: '1 hr', value: '1' },
        { label: '2 hrs', value: '2' },
        { label: '3 hrs', value: '3' },
    ];

    const actions = [
        { id: 'irrigate', icon: <Droplets />, label: isIrrigating ? 'Stop Irrigate' : (irrigationSettingsOpen ? 'Close Settings' : 'Irrigate'), color: isIrrigating ? '#ef4444' : '#3b82f6' },
        { id: 'pump', icon: <Zap />, label: pumpActive ? 'Stop Pump' : 'Start Pump', color: pumpActive ? '#ef4444' : '#f59e0b' },
    ];

    const stopIrrigation = () => {
        setIsIrrigating(false);
        if (irrigationAutoStart) setPumpActive(false);
        if (irrigationTimerRef.current) {
            clearTimeout(irrigationTimerRef.current);
            irrigationTimerRef.current = null;
        }
    };

    const handleActionClick = (id: string) => {
        if (id === 'pump') {
            setPumpActive(!pumpActive);
        } else if (id === 'irrigate') {
            if (isIrrigating) {
                stopIrrigation();
            } else {
                setIrrigationSettingsOpen(!irrigationSettingsOpen);
            }
        }
    };

    const startManualIrrigation = () => {
        setIsIrrigating(true);
        setIrrigationSettingsOpen(false);
        if (irrigationAutoStart) {
            setPumpActive(true);
        }
        // Auto-stop after selected duration
        const durationMs = parseFloat(irrigationDuration) * 60 * 60 * 1000;
        irrigationTimerRef.current = setTimeout(() => {
            setIsIrrigating(false);
            if (irrigationAutoStart) setPumpActive(false);
            irrigationTimerRef.current = null;
        }, durationMs);
    };

    const confirmSchedule = () => {
        setIrrigationSettingsOpen(false);
        // Schedule starts immediately for demo
        startManualIrrigation();
        alert(`Irrigation started for ${irrigationDuration} hr(s)${irrigationAutoStart ? ' — Pump also started.' : ''}`);
    };

    return (
        <div className="dashboard-container">
            <div className="max-container">
                {/* Header */}
                <header className="header" style={{ marginBottom: '2.5rem' }}>
                    <div className="flex items-center gap-3">
                        <div style={{
                            background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            boxShadow: '0 4px 10px rgba(22, 101, 52, 0.3)'
                        }}>
                            <LayoutDashboard size={18} style={{ color: 'white' }} />
                            <span style={{ color: 'white', fontWeight: 800, fontSize: '1rem', letterSpacing: '0.05em' }}>agri</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="glass-card" style={{ padding: '0.5rem', borderRadius: '9999px', cursor: 'pointer' }}>
                            <Bell size={20} className="text-gray-600" />
                        </div>
                    </div>
                </header>

                <main style={{ paddingBottom: '5rem' }}>

                    {activeTab === 'dashboard' && <WeatherSection />}

                    {activeTab === 'dashboard' && <section>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                <Zap size={18} style={{ color: 'var(--primary)' }} />
                                Quick Actions
                            </h3>
                        </div>

                        <div className="action-grid">
                            {actions.map((action) => (
                                <motion.button
                                    key={action.id}
                                    whileHover={{ y: -5 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleActionClick(action.id)}
                                    className="action-card"
                                    style={{
                                        backgroundColor: action.color,
                                    }}
                                >
                                    <div className="icon-bg">
                                        {action.icon}
                                    </div>
                                    <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>{action.label}</span>
                                    {action.id === 'pump' && (
                                        <span style={{ fontSize: '0.65rem', marginTop: '0.5rem', opacity: 0.8 }}>
                                            STATUS: {pumpActive ? 'RUNNING' : 'READY'}
                                        </span>
                                    )}
                                </motion.button>
                            ))}
                        </div>

                        {/* Irrigation Settings Panel */}
                        <AnimatePresence>
                            {irrigationSettingsOpen && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                    animate={{ opacity: 1, height: 'auto', marginTop: '1.5rem' }}
                                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                    style={{ overflow: 'hidden' }}
                                >
                                    <div style={{
                                        background: 'rgba(255,255,255,0.9)',
                                        backdropFilter: 'blur(12px)',
                                        borderRadius: '1.25rem',
                                        border: '1px solid rgba(22, 101, 52, 0.15)',
                                        boxShadow: '0 8px 32px rgba(22,101,52,0.08)',
                                        overflow: 'hidden'
                                    }}>
                                        {/* Panel Header */}
                                        <div style={{
                                            background: 'linear-gradient(135deg, #166534 0%, #15803d 100%)',
                                            padding: '1rem 1.5rem',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div className="flex items-center gap-2">
                                                <Droplets size={16} style={{ color: 'rgba(255,255,255,0.9)' }} />
                                                <h4 style={{ fontWeight: 700, color: 'white', fontSize: '0.9rem', letterSpacing: '0.03em' }}>Irrigation Schedule</h4>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>Auto Start</span>
                                                <button
                                                    onClick={() => setIrrigationAutoStart(!irrigationAutoStart)}
                                                    style={{
                                                        width: '42px', height: '24px',
                                                        borderRadius: '9999px',
                                                        backgroundColor: irrigationAutoStart ? '#4ade80' : 'rgba(255,255,255,0.25)',
                                                        position: 'relative', border: 'none', cursor: 'pointer',
                                                        transition: 'background-color 0.25s', flexShrink: 0
                                                    }}
                                                >
                                                    <motion.div
                                                        animate={{ x: irrigationAutoStart ? 20 : 2 }}
                                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                        style={{
                                                            width: '18px', height: '18px', borderRadius: '50%',
                                                            backgroundColor: 'white', position: 'absolute',
                                                            top: '3px', left: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                                                        }}
                                                    />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Panel Body */}
                                        <div style={{ padding: '1.25rem 1.5rem' }}>
                                            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Duration</p>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                {intervals.map((interval) => (
                                                    <button
                                                        key={interval.value}
                                                        onClick={() => setIrrigationDuration(interval.value)}
                                                        style={{
                                                            padding: '0.6rem 1rem', borderRadius: '0.75rem',
                                                            border: irrigationDuration === interval.value ? 'none' : '1px solid #e5e7eb',
                                                            background: irrigationDuration === interval.value
                                                                ? 'linear-gradient(135deg, #166534 0%, #15803d 100%)'
                                                                : 'rgba(255,255,255,0.7)',
                                                            color: irrigationDuration === interval.value ? 'white' : '#374151',
                                                            fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                            boxShadow: irrigationDuration === interval.value ? '0 4px 12px rgba(22,101,52,0.25)' : 'none'
                                                        }}
                                                    >
                                                        {interval.label}
                                                    </button>
                                                ))}
                                            </div>

                                            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
                                                <button
                                                    onClick={startManualIrrigation}
                                                    className="btn"
                                                    style={{
                                                        background: 'linear-gradient(135deg, #166534 0%, #15803d 100%)',
                                                        color: 'white', flex: 1, fontSize: '0.8rem',
                                                        fontWeight: 700, border: 'none',
                                                        boxShadow: '0 4px 12px rgba(22,101,52,0.3)',
                                                        letterSpacing: '0.02em'
                                                    }}
                                                >
                                                    ▶ Start Now
                                                </button>
                                                <button
                                                    onClick={confirmSchedule}
                                                    className="btn"
                                                    style={{
                                                        backgroundColor: '#f0fdf4', color: '#166534',
                                                        flex: 1, fontSize: '0.8rem', fontWeight: 700,
                                                        border: '1px solid #bbf7d0', letterSpacing: '0.02em'
                                                    }}
                                                >
                                                    🗓 Schedule
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </section>}

                    {activeTab === 'automation' && <AutomationSection />}

                </main>

                {/* ── Bottom Tab Bar ── */}
                <nav style={{
                    position: 'fixed',
                    bottom: 0, left: 0, right: 0,
                    background: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(20px)',
                    borderTop: '1px solid rgba(0,0,0,0.07)',
                    display: 'flex',
                    justifyContent: 'space-around',
                    padding: '0.5rem 0 calc(0.5rem + env(safe-area-inset-bottom))',
                    zIndex: 100
                }}>
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={22} /> },
                        { id: 'automation', label: 'Automation', icon: <Bot size={22} /> },
                    ].map(tab => (
                        <motion.button
                            key={tab.id}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => setActiveTab(tab.id as 'dashboard' | 'automation')}
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '3px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: activeTab === tab.id ? '#166534' : '#9ca3af',
                                transition: 'color 0.2s',
                                padding: '0.25rem 0'
                            }}
                        >
                            {tab.icon}
                            <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {tab.label}
                            </span>
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="tab-indicator"
                                    style={{
                                        width: '20px', height: '3px',
                                        borderRadius: '9999px',
                                        background: 'linear-gradient(90deg, #166534, #15803d)'
                                    }}
                                />
                            )}
                        </motion.button>
                    ))}
                </nav>
            </div>
        </div>
    );
};
