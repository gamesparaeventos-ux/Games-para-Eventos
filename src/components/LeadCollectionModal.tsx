import React, { useState, useRef, useEffect } from "react";
import { Play, X, User, Phone, Mail } from "lucide-react";
import VirtualKeyboard from "./VirtualKeyboard";

interface LeadCollectionModalProps {
  gameName: string;
  eventName: string;
  onSubmit: (data: { name: string; phone: string; email: string }) => void;
  onSkip: () => void;
}

const LeadCollectionModal = ({ gameName, eventName, onSubmit, onSkip }: LeadCollectionModalProps) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [activeField, setActiveField] = useState<"name" | "phone" | "email" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const formRef = useRef<HTMLDivElement>(null);
  const activeFieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeField && activeFieldRef.current) {
      setTimeout(() => activeFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }
  }, [activeField]);

  const handleSubmit = async () => {
    if (!name || !email) return alert('Preencha nome e email.');
    setSubmitting(true);
    await onSubmit({ name, phone, email });
    setSubmitting(false);
  };

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleKeyboardInput = (value: string) => {
    if (activeField === "name") setName(value);
    else if (activeField === "phone") setPhone(formatPhoneNumber(value));
    else if (activeField === "email") setEmail(value);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
      <div className={`w-full max-w-md transition-all ${activeField ? 'pb-80' : ''}`} ref={formRef}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white mb-2">{gameName}</h1>
          <p className="text-white/60">{eventName}</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-2xl relative">
          <button onClick={onSkip} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
          
          <div className="space-y-4 mt-4">
            <div ref={activeField === "name" ? activeFieldRef : null}>
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nome</label>
              <div onClick={() => setActiveField("name")} className={`flex items-center gap-3 border-2 rounded-xl px-4 py-3 cursor-pointer ${activeField === "name" ? "border-purple-600 bg-purple-50" : "border-slate-100"}`}>
                <User className="text-slate-400" size={20}/>
                <span className={name ? "text-slate-900 font-bold" : "text-slate-400"}>{name || "Toque para digitar"}</span>
              </div>
            </div>

            <div ref={activeField === "phone" ? activeFieldRef : null}>
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">WhatsApp</label>
              <div onClick={() => setActiveField("phone")} className={`flex items-center gap-3 border-2 rounded-xl px-4 py-3 cursor-pointer ${activeField === "phone" ? "border-purple-600 bg-purple-50" : "border-slate-100"}`}>
                <Phone className="text-slate-400" size={20}/>
                <span className={phone ? "text-slate-900 font-bold" : "text-slate-400"}>{phone || "(00) 00000-0000"}</span>
              </div>
            </div>

            <div ref={activeField === "email" ? activeFieldRef : null}>
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email</label>
              <div onClick={() => setActiveField("email")} className={`flex items-center gap-3 border-2 rounded-xl px-4 py-3 cursor-pointer ${activeField === "email" ? "border-purple-600 bg-purple-50" : "border-slate-100"}`}>
                <Mail className="text-slate-400" size={20}/>
                <span className={email ? "text-slate-900 font-bold" : "text-slate-400"}>{email || "seu@email.com"}</span>
              </div>
            </div>
          </div>

          <button onClick={handleSubmit} disabled={submitting} className="w-full mt-6 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">
            <Play size={20} /> {submitting ? "Entrando..." : "JOGAR AGORA"}
          </button>
        </div>
        
        <button onClick={onSkip} className="w-full text-center text-white/50 text-sm mt-6 hover:text-white">Pular Cadastro</button>
      </div>

      {activeField && (
        <VirtualKeyboard
          onInput={handleKeyboardInput}
          onClose={() => setActiveField(null)}
          initialValue={activeField === "name" ? name : activeField === "phone" ? phone : email}
          inputType={activeField === "phone" ? "numeric" : activeField === "email" ? "email" : "text"}
        />
      )}
    </div>
  );
};

export default LeadCollectionModal;