import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import TopBar from '../components/TopBar';
import SidebarLeft from '../components/SidebarLeft';
import SidebarRight from '../components/SidebarRight';
import MapContainer from '../components/MapContainer';
import BottomCharts from '../components/BottomCharts';
import { io } from 'socket.io-client';

const Dashboard = () => {
    const [alerts, setAlerts] = useState([]);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        newSocket.on('new-alert', (alert) => {
            setAlerts(prev => [alert, ...prev].slice(0, 20));
        });

        // Fetch initial alerts
        fetch('http://localhost:5000/api/alerts')
            .then(res => res.json())
            .then(data => setAlerts(data));

        return () => newSocket.close();
    }, []);

    return (
        <div className="flex flex-col h-screen w-screen p-4 gap-4 bg-[#020617] relative overscroll-none">
            {/* Top Bar */}
            <TopBar alertCount={alerts.length} />

            {/* Main Content Area */}
            <div className="flex flex-1 gap-4 overflow-hidden">
                {/* Left Side: Alerts & Social */}
                <SidebarLeft alerts={alerts} />

                {/* Center: Map */}
                <div className="flex-1 relative glass-card border-slate-700/50 overflow-hidden">
                    <MapContainer alerts={alerts} />
                </div>

                {/* Right Side: AI Engine & Resources */}
                <SidebarRight alerts={alerts} />
            </div>

            {/* Bottom: Charts */}
            <BottomCharts />
            
            {/* Background Overlay Decoration */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] blend-soft-light"></div>
        </div>
    );
};

export default Dashboard;
