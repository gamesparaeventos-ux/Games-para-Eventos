import React, { useState, useEffect } from "react";
import { Delete, Space, Check } from "lucide-react";

interface VirtualKeyboardProps {
  onInput: (value: string) => void;
  onClose: () => void;
  initialValue?: string;
  inputType?: "text" | "numeric" | "email";
}

// Interface adicionada para tipar os botões do teclado e remover o erro de 'any'
interface KeyButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  wide?: boolean;
}

const VirtualKeyboard = ({ onInput, onClose, initialValue = "", inputType = "text" }: VirtualKeyboardProps) => {
  const [value, setValue] = useState(initialValue);
  const [isUpperCase, setIsUpperCase] = useState(true);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const letterRows = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M"],
  ];

  const numberRow = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
  const emailChars = ["@", ".", "_", "-", ".com", ".br"];

  const handleKeyPress = (key: string) => {
    const newValue = value + (isUpperCase ? key : key.toLowerCase());
    setValue(newValue);
    onInput(newValue);
    if (isUpperCase && key.length === 1) setIsUpperCase(false);
  };

  const handleBackspace = () => {
    const newValue = value.slice(0, -1);
    setValue(newValue);
    onInput(newValue);
  };

  const handleSpace = () => {
    const newValue = value + " ";
    setValue(newValue);
    onInput(newValue);
  };

  // Componente tipado corretamente aqui
  const KeyButton = ({ children, onClick, className = "", wide = false }: KeyButtonProps) => (
    <button
      type="button"
      onClick={onClick}
      className={`
        h-14 min-w-[40px] px-2 rounded-xl font-bold text-lg
        bg-slate-100 border-b-4 border-slate-300 active:border-b-0 active:translate-y-1 transition-all
        text-slate-700 shadow-sm
        ${wide ? "flex-1" : ""}
        ${className}
      `}
    >
      {children}
    </button>
  );

  return (
    <div className="fixed inset-x-0 bottom-0 bg-white border-t border-slate-200 p-4 z- shadow-[0_-10px_40px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom duration-300">
      {/* Display */}
      <div className="mb-4 bg-slate-50 rounded-xl p-3 border border-slate-200 flex justify-between items-center">
        <span className="text-xl font-medium text-slate-800 ml-2">
          {value || <span className="text-slate-400">Digite aqui...</span>}
        </span>
        <button onClick={onClose} className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors">
          <Check size={24} />
        </button>
      </div>

      {/* Numbers */}
      <div className="flex gap-1.5 justify-center mb-2">
        {numberRow.map((num) => (
          <KeyButton key={num} onClick={() => handleKeyPress(num)}>{num}</KeyButton>
        ))}
      </div>

      {/* Letters */}
      {inputType !== "numeric" && letterRows.map((row, i) => (
        <div key={i} className="flex gap-1.5 justify-center mb-2">
          {i === 2 && (
            <KeyButton onClick={() => setIsUpperCase(!isUpperCase)} className={isUpperCase ? "bg-purple-600 text-white border-purple-800" : ""}>
              ⇧
            </KeyButton>
          )}
          {row.map((letter) => (
            <KeyButton key={letter} onClick={() => handleKeyPress(letter)}>
              {isUpperCase ? letter : letter.toLowerCase()}
            </KeyButton>
          ))}
          {i === 2 && (
            <KeyButton onClick={handleBackspace}>
              <Delete className="w-5 h-5 mx-auto" />
            </KeyButton>
          )}
        </div>
      ))}

      {/* Email special chars */}
      {inputType === "email" && (
        <div className="flex gap-1.5 justify-center mb-2">
          {emailChars.map((char) => (
            <KeyButton key={char} onClick={() => handleKeyPress(char)}>{char}</KeyButton>
          ))}
        </div>
      )}

      {/* Numeric actions */}
      {inputType === "numeric" && (
        <div className="flex gap-1.5 justify-center mb-2">
          <KeyButton onClick={handleBackspace} wide>
            <Delete className="w-6 h-6 mx-auto" />
          </KeyButton>
        </div>
      )}

      {/* Spacebar */}
      {inputType !== "numeric" && (
        <div className="flex gap-2 justify-center">
          <KeyButton onClick={handleSpace} wide className="max-w-xs">
            <Space className="w-5 h-5 mx-auto" />
          </KeyButton>
        </div>
      )}
    </div>
  );
};

export default VirtualKeyboard;