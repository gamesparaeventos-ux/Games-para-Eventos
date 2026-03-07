import React, { useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label: string;
  imageType?: string;
}

const ImageUploader = ({ value, onChange, label, imageType = 'general' }: ImageUploaderProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `upload-${imageType}-${Date.now()}`;
      await supabase.storage.from('uploads').upload(path, file);
      const { data } = supabase.storage.from('uploads').getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-slate-700">{label}</label>
      <div 
        onClick={() => inputRef.current?.click()}
        className="aspect-video bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all relative overflow-hidden group"
      >
        {value ? (
          <>
            <img src={value} alt="Preview" className="w-full h-full object-contain" />
            <button 
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <div className="text-center p-4">
            {uploading ? (
              <div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            ) : (
              <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2 group-hover:text-purple-500" />
            )}
            <span className="text-xs font-bold text-slate-400 group-hover:text-purple-600">Clique para enviar</span>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>
    </div>
  );
};

export default ImageUploader;