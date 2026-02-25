import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind, Droplets, Bluetooth, BluetoothConnected, BluetoothOff } from 'lucide-react';

const API_KEY = 'd75e96502ac829df392ac5c93ae61eb0';

// BLE UUIDs for Environmental Sensing Service (Standard)
const ENV_SERVICE_UUID = 0x181A;
const TEMP_CHAR_UUID = 0x2A6E;
const HUMID_CHAR_UUID = 0x2A6F;

interface WeatherData {
    temp: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    city: string;
}

export const WeatherSection = () => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [bleDevice, setBleDevice] = useState<any>(null);
    const [bleData, setBleData] = useState<{ temp: number | null, humidity: number | null }>({ temp: null, humidity: null });
    const [isConnecting, setIsConnecting] = useState(false);

    useEffect(() => {
        const fetchWeather = async (lat?: number, lon?: number) => {
            try {
                let url = `https://api.openweathermap.org/data/2.5/weather?q=Amritsar&appid=${API_KEY}&units=metric`;

                if (lat !== undefined && lon !== undefined) {
                    url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
                }

                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to fetch weather');

                const data = await response.json();
                setWeather({
                    temp: Math.round(data.main.temp),
                    condition: data.weather[0].main,
                    humidity: data.main.humidity,
                    windSpeed: data.wind.speed,
                    city: data.name
                });
            } catch (err) {
                console.error(err);
                setWeather({
                    temp: 24,
                    condition: 'Clear',
                    humidity: 45,
                    windSpeed: 12,
                    city: 'Amritsar (Demo)'
                });
            } finally {
                setLoading(false);
            }
        };

        const getCoords = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        fetchWeather(position.coords.latitude, position.coords.longitude);
                    },
                    (error) => {
                        console.warn("Geolocation denied or failed:", error.message);
                        fetchWeather(); // Fallback to Amritsar
                    }
                );
            } else {
                fetchWeather(); // Fallback to Amritsar
            }
        };

        getCoords();
    }, []);

    const handleBluetoothConnection = async () => {
        if (bleDevice) {
            bleDevice.gatt?.disconnect();
            setBleDevice(null);
            setBleData({ temp: null, humidity: null });
            return;
        }

        try {
            setIsConnecting(true);
            const device = await (navigator as any).bluetooth.requestDevice({
                filters: [{ services: [ENV_SERVICE_UUID] }],
                optionalServices: ['battery_service']
            });

            setBleDevice(device);
            const server = await device.gatt?.connect();
            const service = await server?.getPrimaryService(ENV_SERVICE_UUID);

            // Temperature notifications
            const tempChar = await service?.getCharacteristic(TEMP_CHAR_UUID);
            await tempChar?.startNotifications();
            tempChar?.addEventListener('characteristicvaluechanged', (event: any) => {
                const value = event.target.value;
                const temp = value.getInt16(0, true) / 100;
                setBleData(prev => ({ ...prev, temp: Math.round(temp) }));
            });

            // Humidity notifications
            const humidChar = await service?.getCharacteristic(HUMID_CHAR_UUID);
            await humidChar?.startNotifications();
            humidChar?.addEventListener('characteristicvaluechanged', (event: any) => {
                const value = event.target.value;
                const humidity = value.getUint16(0, true) / 100;
                setBleData(prev => ({ ...prev, humidity: Math.round(humidity) }));
            });

            device.addEventListener('gattserverdisconnected', () => {
                setBleDevice(null);
                setBleData({ temp: null, humidity: null });
            });

        } catch (error) {
            console.error("Bluetooth selection failed:", error);
        } finally {
            setIsConnecting(false);
        }
    };

    const getWeatherIcon = (condition: string) => {
        switch (condition.toLowerCase()) {
            case 'clear': return <Sun style={{ color: '#facc15' }} size={48} />;
            case 'clouds': return <Cloud style={{ color: '#94a3b8' }} size={48} />;
            case 'rain': return <CloudRain style={{ color: '#60a5fa' }} size={48} />;
            default: return <Sun style={{ color: '#facc15' }} size={48} />;
        }
    };

    if (loading) return <div className="glass-card text-center animate-pulse">Gathering field data...</div>;

    // Use BLE data if available, otherwise use API weather data
    const displayTemp = bleData.temp !== null ? bleData.temp : (weather?.temp || 0);
    const displayHumidity = bleData.humidity !== null ? bleData.humidity : (weather?.humidity || 0);

    // Calculate deltas
    const tempDelta = bleData.temp !== null && weather ? bleData.temp - weather.temp : null;
    const humidityDelta = bleData.humidity !== null && weather ? bleData.humidity - weather.humidity : null;

    const renderDelta = (delta: number | null, unit: string) => {
        if (delta === null) return null;
        const color = delta === 0 ? '#6b7280' : (delta > 0 ? '#ef4444' : '#3b82f6');
        const sign = delta > 0 ? '+' : '';
        return (
            <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color,
                backgroundColor: 'rgba(255,255,255,0.8)',
                padding: '2px 6px',
                borderRadius: '9999px',
                marginLeft: '8px',
                border: '1px solid rgba(0,0,0,0.05)'
            }}>
                {sign}{delta}{unit} vs Forecast
            </span>
        );
    };

    return (
        <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Bluetooth Control Card */}
            <div className="glass-card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.7)' }}>
                <div className="flex items-center gap-3">
                    <div style={{
                        backgroundColor: bleDevice ? '#ebf8ff' : '#f3f4f6',
                        padding: '0.5rem',
                        borderRadius: '0.75rem',
                        color: bleDevice ? '#3b82f6' : '#9ca3af'
                    }}>
                        {bleDevice ? <BluetoothConnected size={20} /> : <Bluetooth size={20} />}
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280' }}>Local Hardware</p>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                            {bleDevice ? `Connected: ${bleDevice.name || 'Sensor'}` : 'Bluetooth Disconnected'}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleBluetoothConnection}
                    disabled={isConnecting}
                    className="btn"
                    style={{
                        backgroundColor: bleDevice ? '#fef2f2' : '#3b82f6',
                        color: bleDevice ? '#ef4444' : 'white',
                        border: 'none',
                        boxShadow: bleDevice ? 'none' : '0 4px 6px -1px rgba(59, 130, 246, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.75rem',
                        padding: '0.5rem 1rem'
                    }}
                >
                    {isConnecting ? (
                        <span>Searching...</span>
                    ) : (
                        <>
                            {bleDevice ? <BluetoothOff size={14} /> : <Bluetooth size={14} />}
                            {bleDevice ? 'Disconnect' : 'Connect Bluetooth'}
                        </>
                    )}
                </button>
            </div>

            {/* Weather & Sensor Data Card */}
            <div className="glass-card">
                <div className="weather-main">
                    <div className="weather-info">
                        <div style={{ backgroundColor: 'rgba(255,255,255,0.5)', padding: '1rem', borderRadius: '1.5rem' }}>
                            {weather && getWeatherIcon(bleData.temp !== null ? 'clear' : weather.condition)}
                        </div>
                        <div>
                            <div className="flex items-center">
                                <h3 style={{ fontSize: '2.5rem', fontWeight: 700 }}>{displayTemp}°C</h3>
                                {renderDelta(tempDelta, '°C')}
                            </div>
                            <p className="text-gray-500 font-medium">
                                {bleDevice ? 'Live Sensor Reading' : `${weather?.condition} in ${weather?.city}`}
                            </p>
                        </div>
                    </div>

                    <div className="weather-stats">
                        <div className="stat-item">
                            <div className="stat-label">
                                <Droplets size={16} />
                                <span>Humidity</span>
                            </div>
                            <div className="flex items-center">
                                <span className="stat-value">{displayHumidity}%</span>
                                {renderDelta(humidityDelta, '%')}
                            </div>
                        </div>

                        <div className="stat-item">
                            <div className="stat-label">
                                <Wind size={16} />
                                <span>Wind</span>
                            </div>
                            <span className="stat-value">{weather?.windSpeed} km/h</span>
                        </div>


                    </div>
                </div>
            </div>
        </div>
    );
};
