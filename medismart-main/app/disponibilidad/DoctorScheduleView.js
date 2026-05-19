import { useState, useRef, useEffect } from "react";

// ─── Mock backend data ────────────────────────────────────────────────────────
const BACKEND = {
  doctor: {
    name: "Alejandro Botero",
    profilePic: "https://i.pravatar.cc/80?img=12",
    todayDate: new Date(), // current day from backend
  },
  appointments: [
    {
      id: 1,
      date: new Date(),
      time: "9:00 AM",
      hour: 9,
      patient: "Marcela Suárez Moncada",
      description: "Cita de Dermatología",
    },
    {
      id: 2,
      date: new Date(),
      time: "12:00 PM",
      hour: 12,
      patient: "John Esteban Ramos",
      description: "Cita de Dermatología",
    },
    {
      id: 3,
      date: new Date(),
      time: "3:00 PM",
      hour: 15,
      patient: "Rosa María Morales",
      description: "Cita de Dermatología",
    },
    {
      id: 4,
      date: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; })(),
      time: "9:00 AM",
      hour: 9,
      patient: "Alejandra Pereira Zúñiga",
      description: "Cita de Dermatología",
    },
    {
      id: 5,
      date: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; })(),
      time: "11:00 AM",
      hour: 11,
      patient: "Carlos Mendoza López",
      description: "Control Post-Operatorio",
    },
    {
      id: 6,
      date: (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d; })(),
      time: "10:00 AM",
      hour: 10,
      patient: "Patricia Ríos Salcedo",
      description: "Revisión General",
    },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DAYS_ES = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function getDateLabel(date, today) {
  if (sameDay(date, today)) return `${DAYS_ES[date.getDay()]} ${date.getDate()} · Hoy`;
  if (sameDay(date, addDays(today, 1))) return `${DAYS_ES[date.getDay()]} ${date.getDate()} · Mañana`;
  if (sameDay(date, addDays(today, -1))) return `${DAYS_ES[date.getDay()]} ${date.getDate()} · Ayer`;
  return `${DAYS_ES[date.getDay()]} ${date.getDate()} de ${MONTHS_ES[date.getMonth()]}`;
}

// Build hour slots from 8 AM to 7 PM
const HOURS = Array.from({ length: 12 }, (_, i) => {
  const h = i + 8;
  return { hour: h, label: h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM` };
});

// ─── Sub-components ───────────────────────────────────────────────────────────

function DayBubble({ date, isSelected, isToday, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 52,
        height: 68,
        borderRadius: 20,
        border: "none",
        cursor: "pointer",
        background: isSelected
          ? "linear-gradient(145deg, #4A7FFF, #2B5CE6)"
          : "white",
        color: isSelected ? "white" : isToday ? "#4A7FFF" : "#334155",
        boxShadow: isSelected
          ? "0 4px 14px rgba(74,127,255,0.45)"
          : "0 2px 8px rgba(0,0,0,0.07)",
        fontFamily: "'DM Sans', sans-serif",
        transition: "all 0.2s ease",
        flexShrink: 0,
        position: "relative",
      }}
    >
      {isToday && !isSelected && (
        <span style={{
          position: "absolute",
          top: 6,
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: "#4A7FFF",
        }} />
      )}
      <span style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{date.getDate()}</span>
      <span style={{ fontSize: 10, fontWeight: 500, marginTop: 4, opacity: isSelected ? 0.85 : 0.55, letterSpacing: "0.05em" }}>
        {DAYS_ES[date.getDay()]}
      </span>
    </button>
  );
}

function AppointmentCard({ appt, onConfirm, onCancel }) {
  return (
    <div style={{
      background: "white",
      borderRadius: 16,
      padding: "12px 14px",
      marginBottom: 4,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      boxShadow: "0 2px 8px rgba(74,127,255,0.08)",
      border: "1px solid rgba(74,127,255,0.08)",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0,
          fontWeight: 700,
          fontSize: 13.5,
          color: "#1E3A5F",
          fontFamily: "'DM Sans', sans-serif",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>{appt.patient}</p>
        <p style={{
          margin: "2px 0 0",
          fontSize: 11.5,
          color: "#7A93B5",
          fontFamily: "'DM Sans', sans-serif",
        }}>{appt.description}</p>
      </div>
      <div style={{ display: "flex", gap: 6, marginLeft: 10 }}>
        <button
          onClick={() => onConfirm(appt.id)}
          style={{
            width: 26, height: 26, borderRadius: "50%", border: "none",
            background: "rgba(74,127,255,0.1)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#4A7FFF", fontSize: 12, fontWeight: 700,
          }}
          title="Confirmar"
        >✓</button>
        <button
          onClick={() => onCancel(appt.id)}
          style={{
            width: 26, height: 26, borderRadius: "50%", border: "none",
            background: "rgba(239,68,68,0.08)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#EF4444", fontSize: 12, fontWeight: 700,
          }}
          title="Cancelar"
        >✕</button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DoctorScheduleView() {
  const today = BACKEND.doctor.todayDate;
  const [selectedDate, setSelectedDate] = useState(today);
  const [centerDate, setCenterDate] = useState(today);
  const [appointments, setAppointments] = useState(BACKEND.appointments);
  const [activePage, setActivePage] = useState("home");
  const scrollRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  // Generate 15 days centered on centerDate (-7 to +7)
  const calendarDays = Array.from({ length: 15 }, (_, i) => addDays(centerDate, i - 7));

  // Appointments for selected day
  const dayAppointments = appointments.filter(a => sameDay(a.date, selectedDate));

  // Group appointments by hour for timeline
  const apptByHour = {};
  dayAppointments.forEach(a => {
    if (!apptByHour[a.hour]) apptByHour[a.hour] = [];
    apptByHour[a.hour].push(a);
  });

  function handleConfirm(id) {
    alert(`Cita #${id} confirmada ✓`);
  }
  function handleCancel(id) {
    setAppointments(prev => prev.filter(a => a.id !== id));
  }

  // Drag-to-scroll
  function onMouseDown(e) {
    isDragging.current = true;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
    scrollRef.current.style.cursor = "grabbing";
  }
  function onMouseLeave() { isDragging.current = false; scrollRef.current.style.cursor = "grab"; }
  function onMouseUp() { isDragging.current = false; scrollRef.current.style.cursor = "grab"; }
  function onMouseMove(e) {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    scrollRef.current.scrollLeft = scrollLeft.current - (x - startX.current);
  }

  // Scroll to center (selected day) on mount
  useEffect(() => {
    if (scrollRef.current) {
      const itemW = 60;
      scrollRef.current.scrollLeft = itemW * 5.5;
    }
  }, []);

  const navItems = [
    { id: "home", icon: "⌂", label: "Inicio" },
    { id: "chat", icon: "💬", label: "Chat" },
    { id: "profile", icon: "👤", label: "Perfil" },
    { id: "calendar", icon: "📅", label: "Agenda" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #EEF2FF 0%, #E8EFFE 50%, #F0F4FF 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
      padding: "20px 0",
    }}>
      {/* Phone shell */}
      <div style={{
        width: 375,
        minHeight: 750,
        background: "#F0F4FF",
        borderRadius: 40,
        boxShadow: "0 30px 80px rgba(74,127,255,0.18), 0 8px 32px rgba(0,0,0,0.12)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}>
        {/* ── Header ── */}
        <div style={{
          padding: "24px 20px 16px",
          background: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(74,127,255,0.07)",
        }}>
          {/* Left: avatar + greeting */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img
              src={BACKEND.doctor.profilePic}
              alt="Doctor"
              style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2.5px solid #4A7FFF" }}
            />
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <span style={{ fontSize: 10, color: "#94A3B8", fontWeight: 500, letterSpacing: "0.03em" }}>
                Bienvenido,
              </span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#1E3A5F", marginTop: 1 }}>
                Dr. {BACKEND.doctor.name}
              </span>
            </div>
          </div>
          {/* Right: notifs + settings */}
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { icon: "🔔", label: "Notificaciones" },
              { icon: "⚙️", label: "Ajustes" },
            ].map(btn => (
              <button key={btn.label} title={btn.label} style={{
                width: 38, height: 38, borderRadius: 12, border: "1.5px solid rgba(74,127,255,0.15)",
                background: "white", cursor: "pointer", fontSize: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(74,127,255,0.08)",
                transition: "transform 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              >{btn.icon}</button>
            ))}
          </div>
        </div>

        {/* ── Search bar ── */}
        <div style={{ padding: "12px 20px 4px", background: "white" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "#F0F4FF", borderRadius: 14, padding: "9px 14px",
            border: "1.5px solid rgba(74,127,255,0.1)",
          }}>
            <span style={{ fontSize: 15 }}>🔍</span>
            <span style={{ fontSize: 13, color: "#94A3B8", flex: 1 }}>Buscar paciente o cita…</span>
            <span style={{ fontSize: 15 }}>⚙️</span>
          </div>
        </div>

        {/* ── Calendar strip ── */}
        <div style={{ background: "white", paddingBottom: 16, paddingTop: 8 }}>
          <div
            ref={scrollRef}
            onMouseDown={onMouseDown}
            onMouseLeave={onMouseLeave}
            onMouseUp={onMouseUp}
            onMouseMove={onMouseMove}
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              padding: "8px 20px",
              cursor: "grab",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              userSelect: "none",
            }}
          >
            {calendarDays.map((d, i) => (
              <DayBubble
                key={i}
                date={d}
                isSelected={sameDay(d, selectedDate)}
                isToday={sameDay(d, today)}
                onClick={() => setSelectedDate(d)}
              />
            ))}
          </div>
        </div>

        {/* ── Schedule area ── */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 16px 12px",
          scrollbarWidth: "none",
        }}>
          {/* Day label */}
          <div style={{
            display: "flex", justifyContent: "flex-end",
            marginBottom: 10, paddingRight: 4,
          }}>
            <span style={{
              fontSize: 11.5, fontWeight: 600, color: "#4A7FFF",
              background: "rgba(74,127,255,0.08)", borderRadius: 8,
              padding: "3px 10px", letterSpacing: "0.02em",
            }}>
              {getDateLabel(selectedDate, today)}
            </span>
          </div>

          {/* Hour timeline */}
          <div style={{
            background: "white",
            borderRadius: 20,
            padding: "8px 0",
            boxShadow: "0 4px 20px rgba(74,127,255,0.07)",
            overflow: "hidden",
          }}>
            {HOURS.map(({ hour, label }) => {
              const appts = apptByHour[hour] || [];
              const hasAppt = appts.length > 0;
              return (
                <div key={hour} style={{
                  display: "flex",
                  alignItems: hasAppt ? "flex-start" : "center",
                  padding: hasAppt ? "10px 14px" : "6px 14px",
                  borderBottom: "1px dashed rgba(74,127,255,0.08)",
                  minHeight: 36,
                  gap: 12,
                }}>
                  {/* Time label */}
                  <span style={{
                    fontSize: 11,
                    color: hasAppt ? "#4A7FFF" : "#B0BEC5",
                    fontWeight: hasAppt ? 700 : 400,
                    minWidth: 46,
                    paddingTop: hasAppt ? 10 : 0,
                    letterSpacing: "0.01em",
                  }}>{label}</span>

                  {/* Appointments or empty line */}
                  <div style={{ flex: 1 }}>
                    {hasAppt ? (
                      appts.map(appt => (
                        <AppointmentCard
                          key={appt.id}
                          appt={appt}
                          onConfirm={handleConfirm}
                          onCancel={handleCancel}
                        />
                      ))
                    ) : (
                      <div style={{
                        height: 1,
                        background: "rgba(74,127,255,0.06)",
                        borderRadius: 1,
                        marginTop: 1,
                      }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {dayAppointments.length === 0 && (
            <div style={{
              textAlign: "center",
              padding: "32px 20px",
              color: "#94A3B8",
              fontSize: 13,
            }}>
              No hay citas programadas para este día.
            </div>
          )}
        </div>

        {/* ── Bottom nav ── */}
        <div style={{
          background: "white",
          borderTop: "1px solid rgba(74,127,255,0.08)",
          padding: "10px 20px 18px",
          display: "flex",
          justifyContent: "space-around",
        }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              title={item.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: "8px 16px",
                borderRadius: 16,
                border: "none",
                cursor: "pointer",
                background: activePage === item.id
                  ? "linear-gradient(145deg, #4A7FFF, #2B5CE6)"
                  : "transparent",
                color: activePage === item.id ? "white" : "#94A3B8",
                fontSize: 18,
                transition: "all 0.2s ease",
                boxShadow: activePage === item.id ? "0 4px 14px rgba(74,127,255,0.35)" : "none",
              }}
            >
              <span>{item.icon}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Font import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}