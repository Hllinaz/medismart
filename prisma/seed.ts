import {
  PrismaClient,
  Role,
  Specialty,
  AppointmentStatus,
  Priority,
  NotificationType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  const password = await bcrypt.hash("password123", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {
      name: "Admin Demo",
      phone: "+573001112233",
      dateOfBirth: new Date("1985-05-10"),
      role: Role.ADMIN,
    },
    create: {
      name: "Admin Demo",
      email: "admin@demo.com",
      phone: "+573001112233",
      dateOfBirth: new Date("1985-05-10"),
      password,
      role: Role.ADMIN,
    },
  });

  const patientUser = await prisma.user.upsert({
    where: { email: "paciente@demo.com" },
    update: {
      name: "Paciente Demo",
      phone: "+573002223344",
      dateOfBirth: new Date("1998-09-21"),
      role: Role.PACIENTE,
    },
    create: {
      name: "Paciente Demo",
      email: "paciente@demo.com",
      phone: "+573002223344",
      dateOfBirth: new Date("1998-09-21"),
      password,
      role: Role.PACIENTE,
      patientProfile: {
        create: {},
      },
    },
  });

  const patientProfile = await prisma.patientProfile.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: {
      userId: patientUser.id,
    },
  });

  const specialtiesData = [
    { name: "Medicina General", description: "Atencion medica primaria y preventiva" },
    { name: "Odontologia", description: "Salud oral, dental y cuidado estomatologico" },
    { name: "Cardiologia", description: "Especialidad cardiologica" },
    { name: "Dermatologia", description: "Especialidad dermatologica" },
    { name: "Pediatria", description: "Cuidado medico de niños y adolescentes" },
    { name: "Traumatologia", description: "Lesiones del sistema musculoesqueletico" },
    { name: "Ginecologia", description: "Salud del sistema reproductor femenino" },
    { name: "Psiquiatria", description: "Evaluacion y tratamiento de la salud mental" },
    { name: "Nutricion", description: "Asesoria alimentaria y planes nutricionales" },
  ];

  const specialties: Record<string, Specialty> = {};

  for (const spec of specialtiesData) {
    const createdSpec = await prisma.specialty.upsert({
      where: { name: spec.name },
      update: {
        description: spec.description,
        isActive: true,
      },
      create: spec,
    });

    specialties[spec.name] = createdSpec;
  }

  const doctorsData = [
    {
      name: "Dr. Carlos Ramirez",
      email: "medico@demo.com",
      phone: "+573003334455",
      birthDate: "1980-03-15",
      license: "MED-2026-001",
      specs: ["Cardiologia", "Dermatologia"],
    },
    {
      name: "Dra. Ana Martinez",
      email: "ana.martinez@demo.com",
      phone: "+573003334456",
      birthDate: "1980-03-15",
      license: "MED-2026-002",
      specs: ["Pediatria"],
    },
    {
      name: "Dr. Luis Fernandez",
      email: "luis.fernandez@demo.com",
      phone: "+573003334465",
      birthDate: "1980-03-15",
      license: "MED-2026-003",
      specs: ["Traumatologia"],
    },
    {
      name: "Dra. Sofia Castro",
      email: "sofia.castro@demo.com",
      phone: "+573003334655",
      birthDate: "1980-03-15",
      license: "MED-2026-004",
      specs: ["Ginecologia", "Pediatria"],
    },
    {
      name: "Dr. Alejandro Gomez",
      email: "alejandro.gomez@demo.com",
      phone: "+573003234455",
      birthDate: "1980-03-15",
      license: "MED-2026-005",
      specs: ["Medicina General"],
    },
    {
      name: "Dra. Elena Rostova",
      email: "elena.rostova@demo.com",
      phone: "+573003734455",
      birthDate: "1980-03-15",
      license: "MED-2026-006",
      specs: ["Odontologia"],
    },
    {
      name: "Dr. Javier Herrera",
      email: "javier.herrera@demo.com",
      phone: "+573003834455",
      birthDate: "1980-03-15",
      license: "MED-2026-007",
      specs: ["Psiquiatria"],
    },
    {
      name: "Dra. Claudia Rios",
      email: "claudia.rios@demo.com",
      phone: "+573013234455",
      birthDate: "1980-03-15",
      license: "MED-2026-008",
      specs: ["Nutricion", "Medicina General"],
    },
  ];

  const doctorProfiles: Record<string, string> = {};

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  for (const doc of doctorsData) {
    const doctorUser = await prisma.user.upsert({
      where: { email: doc.email },
      update: {
        name: doc.name,
        phone: doc.phone,
        dateOfBirth: new Date(doc.birthDate),
        role: Role.MEDICO,
      },
      create: {
        name: doc.name,
        email: doc.email,
        phone: doc.phone,
        dateOfBirth: new Date(doc.birthDate),
        password,
        role: Role.MEDICO,
      },
    });

    const doctorProfile = await prisma.doctorProfile.upsert({
      where: { userId: doctorUser.id },
      update: {
        licenseNumber: doc.license,
        active: true,
      },
      create: {
        userId: doctorUser.id,
        licenseNumber: doc.license,
      },
    });

    doctorProfiles[doc.email] = doctorProfile.id;

    for (const specName of doc.specs) {
      await prisma.doctorSpecialty.upsert({
        where: {
          doctorId_specialtyId: {
            doctorId: doctorProfile.id,
            specialtyId: specialties[specName].id,
          },
        },
        update: {},
        create: {
          doctorId: doctorProfile.id,
          specialtyId: specialties[specName].id,
        },
      });
    }

    const scheduleBlocks = [
      { startH: 8, startM: 0, endH: 9, endM: 0, targetDate: tomorrow },
      { startH: 9, startM: 0, endH: 10, endM: 0, targetDate: tomorrow },
      { startH: 10, startM: 0, endH: 11, endM: 0, targetDate: tomorrow },
      { startH: 11, startM: 0, endH: 12, endM: 0, targetDate: tomorrow },
      { startH: 14, startM: 0, endH: 15, endM: 0, targetDate: tomorrow },
      { startH: 15, startM: 0, endH: 16, endM: 0, targetDate: tomorrow },
      { startH: 9, startM: 0, endH: 10, endM: 0, targetDate: dayAfterTomorrow },
      { startH: 10, startM: 0, endH: 11, endM: 0, targetDate: dayAfterTomorrow },
    ];

    for (const block of scheduleBlocks) {
      const dateOnly = new Date(block.targetDate);
      dateOnly.setHours(0, 0, 0, 0);

      const startTime = new Date(block.targetDate);
      startTime.setHours(block.startH, block.startM, 0, 0);

      const endTime = new Date(block.targetDate);
      endTime.setHours(block.endH, block.endM, 0, 0);

      const existingAvailability = await prisma.availability.findFirst({
        where: {
          doctorId: doctorProfile.id,
          startTime,
        },
      });

      if (!existingAvailability) {
        await prisma.availability.create({
          data: {
            doctorId: doctorProfile.id,
            date: dateOnly,
            startTime,
            endTime,
          },
        });
      }
    }
  }

  /*
   * Limpiar datos demo dependientes para evitar duplicados
   */
  await prisma.appointmentReport.deleteMany({});
  await prisma.evaluation.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.appointment.deleteMany({});

  /*
   * CITAS DEMO
   */
  const cardiologyAvailability = await prisma.availability.findFirst({
    where: {
      doctorId: doctorProfiles["medico@demo.com"],
      isBooked: false,
    },
    orderBy: {
      startTime: "asc",
    },
  });

  if (!cardiologyAvailability) {
    throw new Error("No hay disponibilidad demo para Cardiologia");
  }

  const scheduledAppointment = await prisma.appointment.create({
    data: {
      patientId: patientProfile.id,
      doctorId: doctorProfiles["medico@demo.com"],
      availabilityId: cardiologyAvailability.id,
      appointmentDate: cardiologyAvailability.startTime,
      specialtyId: specialties["Cardiologia"].id,
      symptoms: "Dolor en el pecho ocasional, cansancio y dificultad leve para respirar.",
      priority: Priority.HIGH,
      status: AppointmentStatus.SCHEDULED,
    },
  });

  await prisma.availability.update({
    where: { id: cardiologyAvailability.id },
    data: { isBooked: true },
  });

  const pediatricsAvailability = await prisma.availability.findFirst({
    where: {
      doctorId: doctorProfiles["ana.martinez@demo.com"],
      isBooked: false,
    },
    orderBy: {
      startTime: "asc",
    },
  });

  if (!pediatricsAvailability) {
    throw new Error("No hay disponibilidad demo para Pediatria");
  }

  const completedAppointment = await prisma.appointment.create({
    data: {
      patientId: patientProfile.id,
      doctorId: doctorProfiles["ana.martinez@demo.com"],
      availabilityId: pediatricsAvailability.id,
      appointmentDate: pediatricsAvailability.startTime,
      specialtyId: specialties["Pediatria"].id,
      symptoms: "Fiebre persistente, dolor de garganta y malestar general.",
      priority: Priority.NORMAL,
      status: AppointmentStatus.COMPLETED,
    },
  });

  await prisma.availability.update({
    where: { id: pediatricsAvailability.id },
    data: { isBooked: true },
  });

  await prisma.appointmentReport.create({
    data: {
      appointmentId: completedAppointment.id,
      diagnosis: "Cuadro respiratorio leve sin signos de alarma.",
      treatment: "Hidratacion, reposo y control de temperatura.",
      observations: "Paciente estable durante la valoracion.",
      recommendations: "Consultar nuevamente si la fiebre persiste por mas de 48 horas.",
    },
  });

  await prisma.evaluation.create({
    data: {
      appointmentId: completedAppointment.id,
      rating: 5,
      comment: "Muy buena atencion y explicacion clara.",
    },
  });

  const traumaAvailability = await prisma.availability.findFirst({
    where: {
      doctorId: doctorProfiles["luis.fernandez@demo.com"],
      isBooked: false,
    },
    orderBy: {
      startTime: "asc",
    },
  });

  if (!traumaAvailability) {
    throw new Error("No hay disponibilidad demo para Traumatologia");
  }

  const cancelledAppointment = await prisma.appointment.create({
    data: {
      patientId: patientProfile.id,
      doctorId: doctorProfiles["luis.fernandez@demo.com"],
      availabilityId: traumaAvailability.id,
      appointmentDate: traumaAvailability.startTime,
      specialtyId: specialties["Traumatologia"].id,
      symptoms: "Dolor en rodilla derecha despues de actividad fisica.",
      priority: Priority.LOW,
      status: AppointmentStatus.CANCELLED,
    },
  });

  const reassignedAvailability = await prisma.availability.findFirst({
    where: {
      doctorId: doctorProfiles["sofia.castro@demo.com"],
      isBooked: false,
    },
    orderBy: {
      startTime: "asc",
    },
  });

  if (!reassignedAvailability) {
    throw new Error("No hay disponibilidad demo para cita reasignada");
  }

  const reassignedAppointment = await prisma.appointment.create({
    data: {
      patientId: patientProfile.id,
      doctorId: doctorProfiles["sofia.castro@demo.com"],
      availabilityId: reassignedAvailability.id,
      appointmentDate: reassignedAvailability.startTime,
      specialtyId: specialties["Ginecologia"].id,
      symptoms: "Dolor abdominal bajo y control ginecologico solicitado.",
      priority: Priority.NORMAL,
      status: AppointmentStatus.SCHEDULED,
      wasReassigned: true,
    },
  });

  await prisma.availability.update({
    where: { id: reassignedAvailability.id },
    data: { isBooked: true },
  });

  /*
   * NOTIFICACIONES DEMO
   */
  await prisma.notification.createMany({
    data: [
      {
        userId: patientUser.id,
        appointmentId: scheduledAppointment.id,
        type: NotificationType.REMINDER,
        message: "Recuerda tu cita de Cardiologia programada.",
      },
      {
        userId: adminUser.id,
        appointmentId: cancelledAppointment.id,
        type: NotificationType.CANCELLATION,
        message: "Una cita de Traumatologia fue cancelada.",
      },
      {
        userId: patientUser.id,
        appointmentId: reassignedAppointment.id,
        type: NotificationType.REASSIGNMENT,
        message: "Tu cita fue reasignada correctamente.",
      },
    ],
  });

  console.log("✅ Seed completado con usuarios, médicos, disponibilidades, citas, reportes y notificaciones.");
}

main()
  .catch((error) => {
    console.error("❌ Error ejecutando seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });