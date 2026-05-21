"use client";

import { useEffect, useState } from "react";
import mqtt from "mqtt";

interface ParkingData {
  slot_1: number;
  slot_2: number;
  slot_3: number;
  available: number;
  timestamp: number;
}

export default function Home() {
  const [data, setData] = useState<ParkingData | null>(null);
  const [status, setStatus] = useState("Connecting...");
  const [camUrl, setCamUrl] = useState("http://10.237.86.228:8080/video");

  useEffect(() => {
    // Gunakan protokol WSS untuk koneksi aman ke broker publik
    const client = mqtt.connect("wss://broker.hivemq.com:8884/mqtt");

    client.on("connect", () => {
      setStatus("Connected to MQTT Broker");
      client.subscribe("kelompok_iot/parking/status");
    });

    client.on("message", (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        setData(payload);
      } catch (e) {
        console.error("Failed to parse MQTT message", e);
      }
    });

    client.on("error", (err) => {
      console.error("MQTT Error:", err);
      setStatus("Connection Error");
    });

    return () => {
      client.end();
    };
  }, []);

  const getSlotColor = (isOccupied: number) => {
    return isOccupied === 1 ? "bg-red-500 shadow-lg shadow-red-500/50" : "bg-emerald-500 shadow-lg shadow-emerald-500/50";
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white">SMART PARKING <span className="text-indigo-500 text-sm align-top">PRO</span></h1>
            <div className="flex items-center gap-2 text-zinc-500 text-xs mt-1">
               <span className={`w-2 h-2 rounded-full ${status.includes("Connected") ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></span>
               {status}
            </div>
          </div>
          
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 gap-3">
             <span className="text-zinc-500 text-xs font-bold uppercase">Live Slots:</span>
             <span className="text-xl font-black text-emerald-400">{data?.available ?? "0"}/3</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: Camera Feed */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative group">
              <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-ping"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Live Camera Feed</span>
              </div>
              
              {/* Image from IP Webcam */}
              <img 
                src={camUrl} 
                alt="Parking Stream" 
                className="w-full aspect-video object-cover bg-zinc-800"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://placehold.co/640x480/18181b/a1a1aa?text=Camera+Not+Found\\nCheck+IP+Webcam+URL";
                }}
              />
              
              <div className="p-4 bg-zinc-900 flex items-center gap-3 border-t border-zinc-800">
                <input 
                  type="text" 
                  value={camUrl} 
                  onChange={(e) => setCamUrl(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs w-full focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="URL IP Webcam (http://.../video)"
                />
              </div>
            </div>
            
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl">
               <p className="text-indigo-400 text-xs leading-relaxed">
                 <strong className="block mb-1">💡 Cara Test:</strong>
                 Arahkan kamera HP ke objek di atas kertas parkir. Status di sebelah kanan akan berubah secara otomatis tanpa perlu merefresh halaman.
               </p>
            </div>
          </div>

          {/* RIGHT: Status Grid */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
               <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
               Parking Status
            </h2>
            
            <div className="space-y-4">
              {[1, 2, 3].map((num) => {
                const slotKey = `slot_${num}` as keyof ParkingData;
                const isOccupied = data ? data[slotKey] : 0;
                
                return (
                  <div key={num} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl border-2 border-zinc-800 ${getSlotColor(isOccupied)}`}>
                        {num}
                      </div>
                      <div>
                        <div className="font-bold text-sm">Slot {num}</div>
                        <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">
                          {isOccupied ? "Occupied" : "Available"}
                        </div>
                      </div>
                    </div>
                    
                    {isOccupied === 1 ? (
                      <div className="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-[10px] font-bold">LOCKED</div>
                    ) : (
                      <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[10px] font-bold">OPEN</div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-6 border-t border-zinc-800 mt-auto">
               <div className="text-[10px] text-zinc-600 font-mono">
                 SYSTEM LOG: {data ? new Date(data.timestamp * 1000).toLocaleTimeString() : "Idle"}
               </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
