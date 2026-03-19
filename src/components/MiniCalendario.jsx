const WeeklyStatus = ({ activeDay }) => {
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
    <div className="flex gap-1 justify-center">
      {days.map((d) => (
        <div
          key={d.id}
          title={d.label}
          className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black transition-all border ${
            activeDay === d.id
              ? "bg-[#87be00] border-[#87be00] text-white shadow-sm scale-110"
              : "bg-gray-50 border-gray-100 text-gray-300"
          }`}
        >
          {d.label}
        </div>
      ))}
    </div>
  );
};