import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Zap } from 'lucide-react';

export function CreditDisplay() {
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchCredits = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();
      if (isMounted && data) setCredits(data.credits);
    };
    fetchCredits();
    return () => { isMounted = false; };
  }, []);

  if (credits === null) return null;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 flex items-center justify-between shadow-inner">
      <div className="flex items-center gap-2 text-slate-300 font-medium text-sm">
        <div className="bg-blue-600/20 p-1.5 rounded-md text-blue-400">
          <Zap size={16} fill="currentColor" />
        </div>
        <span>Seus Créditos</span>
      </div>
      <span className="text-xl font-black text-white">{credits}</span>
    </div>
  );
}