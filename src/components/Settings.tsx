import React, { useState } from 'react';
import { Settings as SettingsIcon, Mail, Bell } from 'lucide-react';

const ToggleSwitch: React.FC<{ label: string; enabled: boolean; onToggle: () => void }> = ({ label, enabled, onToggle }) => (
  <button onClick={onToggle} className="w-full flex justify-between items-center p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
    <span className="font-medium text-zinc-200">{label}</span>
    <div className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors duration-300 ${enabled ? 'bg-green-600' : 'bg-zinc-700'}`}>
      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
    </div>
  </button>
);


const Settings: React.FC = () => {
    const [emailNotifications, setEmailNotifications] = useState(true);

    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-black font-mono uppercase flex items-center gap-3">
                    <SettingsIcon className="w-8 h-8 text-zinc-400" />
                    Configurações
                </h2>
                <p className="text-zinc-400 mt-2">Ajuste as configurações do seu sistema operacional.</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                 <h3 className="text-sm font-bold text-zinc-300 font-mono uppercase mb-4 flex items-center gap-2"><Bell className="w-4 h-4" /> Notificações</h3>
                 <div className="space-y-3">
                    <ToggleSwitch 
                        label="Receber relatórios semanais por email"
                        enabled={emailNotifications}
                        onToggle={() => setEmailNotifications(!emailNotifications)}
                    />
                 </div>
            </div>
        </div>
    );
};

export default Settings;