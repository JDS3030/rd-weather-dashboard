export default function DrilldownStepper({ level, accent, onStepClick }) {
  // level: 0=zona, 1=provincia, 2=municipio, 3=distrito
  const steps = [
    { id: 0, label: 'Zona Cardinal' },
    { id: 1, label: 'Provincia' },
    { id: 2, label: 'Municipio' },
    { id: 3, label: 'Distrito' },
  ];

  return (
    <div className="flex items-center gap-0.5">
      {steps.map((step, i) => {
        const isDone   = i < level;
        const isActive = i === level;

        return (
          <div key={step.id} className="flex items-center gap-0.5">
            <button
              onClick={() => isDone && onStepClick(step.id)}
              disabled={!isDone}
              className={`flex items-center gap-1.5 transition-colors
                ${isDone   ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
                ${isActive ? 'opacity-100' : isDone ? 'opacity-60' : 'opacity-25'}`}
            >
              {/* Dot */}
              <span
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                             text-xs font-black transition-all
                             ${isDone   ? 'text-gray-900' : 'text-gray-500 border-gray-700 bg-gray-900'}
                             ${isActive ? 'shadow-[0_0_8px_var(--step-glow)]' : ''}`}
                style={{
                  background:   isDone ? accent : isActive ? 'transparent' : undefined,
                  borderColor:  isActive ? accent : isDone ? accent : undefined,
                  color:        isActive ? accent : undefined,
                  '--step-glow': accent + '66',
                }}
              >
                {isDone ? '✓' : i + 1}
              </span>
              <span
                className={`text-xs font-medium hidden sm:inline
                  ${isActive ? 'text-white' : isDone ? 'text-gray-400' : 'text-gray-600'}`}
              >
                {step.label}
              </span>
            </button>

            {i < steps.length - 1 && (
              <div className={`w-5 h-px mx-1 transition-colors ${i < level ? 'bg-gray-500' : 'bg-gray-800'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
