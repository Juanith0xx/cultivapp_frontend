const WeeklyStatus = ({ activeDays = [] }) => {
  // Aseguramos que activeDays sea un array, incluso si llega un solo número
  const daysArray = Array.isArray(activeDays) ? activeDays : [activeDays];

  const days = [
    { id: 1, label: 'L' },
    { id: 2, label: 'M' },
    { id: 3, label: 'X' },
    { id: 4, label: 'J' },
    { id: 5, label: 'V' },
    { id: 6, label: 'S' },
    { id: 0, label: 'D' },
  ];

  return (
    <div className="flex gap-1.5 justify-start">
      {days.map((d) => {
        // Verificamos si este día específico (d.id) está en nuestra lista de días activos
        const isActive = daysArray.includes(Number(d.id));

        return (
          <div
            key={d.id}
            title={d.label}
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black transition-all border ${
              isActive
                ? "bg-[#87be00] border-[#87be00] text-white shadow-md shadow-[#87be00]/20 scale-105"
                : "bg-gray-50 border-gray-100 text-gray-300"
            }`}
          >
            {d.label}
          </div>
        );
      })}
    </div>
  );
};