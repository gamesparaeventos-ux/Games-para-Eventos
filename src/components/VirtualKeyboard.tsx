import React, { useEffect, useRef, useState } from "react";
import { Delete, Space, Check } from "lucide-react";

interface VirtualKeyboardProps {
  onInput: (value: string) => void;
  onClose: () => void;
  initialValue?: string;
  inputType?: "text" | "numeric" | "email";
}

interface KeyButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  wide?: boolean;
}

const VirtualKeyboard = ({
  onInput,
  onClose,
  initialValue = "",
  inputType = "text",
}: VirtualKeyboardProps) => {
  const [value, setValue] = useState(initialValue);
  const [isUpperCase, setIsUpperCase] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const dragDataRef = useRef({
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const keyboardWidth = 860;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const centeredX = Math.max((viewportWidth - keyboardWidth) / 2, 12);
    const bottomY = Math.max(viewportHeight - 470, 12);

    setPosition({ x: centeredX, y: bottomY });
  }, []);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!dragging) return;

      const nextX = dragDataRef.current.originX + (e.clientX - dragDataRef.current.startX);
      const nextY = dragDataRef.current.originY + (e.clientY - dragDataRef.current.startY);

      const maxX = Math.max(window.innerWidth - 320, 12);
      const maxY = Math.max(window.innerHeight - 180, 12);

      setPosition({
        x: Math.min(Math.max(12, nextX), maxX),
        y: Math.min(Math.max(12, nextY), maxY),
      });
    };

    const handlePointerUp = () => {
      setDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragging]);

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;

    dragDataRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: position.x,
      originY: position.y,
    };

    setDragging(true);
  };

  const letterRows = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M"],
  ];

  const numberRow = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
  const emailChars = ["@", ".", "_", "-", ".com", ".br"];

  const handleKeyPress = (key: string) => {
    const typedValue =
      key.length === 1 ? (isUpperCase ? key : key.toLowerCase()) : key;

    const newValue = value + typedValue;
    setValue(newValue);
    onInput(newValue);

    if (isUpperCase && key.length === 1 && /[A-Z]/i.test(key)) {
      setIsUpperCase(false);
    }
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

  const KeyButton = ({
    children,
    onClick,
    className = "",
    wide = false,
  }: KeyButtonProps) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`
        h-[52px] md:h-[58px]
        min-w-[48px] md:min-w-[54px]
        px-3
        rounded-2xl
        font-bold text-lg md:text-xl
        bg-slate-100 border border-slate-200
        shadow-[0_4px_0_rgba(148,163,184,0.35)]
        active:translate-y-[2px] active:shadow-[0_2px_0_rgba(148,163,184,0.25)]
        transition-all duration-150
        text-slate-700
        flex items-center justify-center
        select-none
        ${wide ? "flex-1" : ""}
        ${className}
      `}
    >
      {children}
    </button>
  );

  return (
    <div
      className="fixed z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: "min(860px, calc(100vw - 24px))",
      }}
    >
      <div className="rounded-[28px] bg-white/95 backdrop-blur-xl border border-white/60 shadow-[0_10px_40px_rgba(15,23,42,0.22)] p-3 md:p-4">
        <div
          onPointerDown={startDrag}
          className={`mb-3 md:mb-4 bg-slate-50 rounded-2xl border border-slate-200 px-3 md:px-4 py-3 flex items-center gap-3 ${
            dragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          <div className="flex-1 min-w-0">
            <span className="block text-lg md:text-xl font-medium text-slate-800 truncate">
              {value || <span className="text-slate-400">Digite aqui...</span>}
            </span>
          </div>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClose}
            className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shrink-0 transition-colors shadow-sm"
          >
            <Check size={26} />
          </button>
        </div>

        <div className="space-y-2.5 md:space-y-3">
          <div className="flex flex-wrap justify-center gap-2">
            {numberRow.map((num) => (
              <KeyButton key={num} onClick={() => handleKeyPress(num)}>
                {num}
              </KeyButton>
            ))}
          </div>

          {inputType !== "numeric" &&
            letterRows.map((row, i) => (
              <div key={i} className="flex flex-wrap justify-center gap-2">
                {i === 2 && (
                  <KeyButton
                    onClick={() => setIsUpperCase(!isUpperCase)}
                    className={
                      isUpperCase
                        ? "bg-purple-600 text-white border-purple-600 shadow-[0_4px_0_rgba(91,33,182,0.4)]"
                        : ""
                    }
                  >
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
                    <Delete className="w-5 h-5 md:w-6 md:h-6" />
                  </KeyButton>
                )}
              </div>
            ))}

          {inputType === "email" && (
            <div className="flex flex-wrap justify-center gap-2">
              {emailChars.map((char) => (
                <KeyButton key={char} onClick={() => handleKeyPress(char)}>
                  {char}
                </KeyButton>
              ))}
            </div>
          )}

          {inputType === "numeric" && (
            <div className="flex justify-center">
              <div className="w-full max-w-[220px]">
                <KeyButton onClick={handleBackspace} wide>
                  <Delete className="w-6 h-6 md:w-7 md:h-7" />
                </KeyButton>
              </div>
            </div>
          )}

          {inputType !== "numeric" && (
            <div className="flex justify-center">
              <div className="w-full max-w-[560px]">
                <KeyButton onClick={handleSpace} wide>
                  <Space className="w-5 h-5 md:w-6 md:h-6" />
                </KeyButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VirtualKeyboard;