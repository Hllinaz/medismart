import { PrismaClient, Role, Specialty } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  const password = await bcrypt.hash("password123", 10);

  /*
   * 1. ADMIN
   */
  await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      name: "Admin Demo",
      email: "admin@demo.com",
      phone: "+573001112233",
      dateOfBirth: new Date("1985-05-10"),
      password,
      role: Role.ADMIN,
    },
  });

  /*
   * 2. PACIENTE
   */
  await prisma.user.upsert({
    where: { email: "paciente@demo.com" },
    update: {},
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

  /*
   * 3. ESPECIALIDADES
   */
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

  // Tipado estricto usando el tipo generado por Prisma para evitar errores de linter
  const specialties: Record<string, Specialty> = {};

  for (const spec of specialtiesData) {
    const createdSpec = await prisma.specialty.upsert({
      where: { name: spec.name },
      update: {},
      create: spec,
    });
    specialties[spec.name] = createdSpec;
  }

  /*
   * 4. MÉDICOS 
   */
  const doctorsData = [
    {
      name: "Dr. Carlos Ramirez",
      email: "medico@demo.com",
      phone: "+573003334455",
      birthDate: "1980-03-15",
      license: "MED-2026-001",
      specs: ["Cardiologia", "Dermatologia"]
    },
    {
      name: "Dra. Ana Martinez",
      email: "ana.martinez@demo.com",
      phone: "+573003334456",
      birthDate: "1980-03-15",
      license: "MED-2026-002",
      specs: ["Pediatria"]
    },
    {
      name: "Dr. Luis Fernandez",
      email: "luis.fernandez@demo.com",
      phone: "+573003334465",
      birthDate: "1980-03-15",
      license: "MED-2026-003",
      specs: ["Traumatologia"]
    },
    {
      name: "Dra. Sofia Castro",
      email: "sofia.castro@demo.com",
      phone: "+573003334655",
      birthDate: "1980-03-15",
      license: "MED-2026-004",
      specs: ["Ginecologia", "Pediatria"]
    },
    {
      name: "Dr. Alejandro Gomez",
      email: "alejandro.gomez@demo.com",
      phone: "+573003234455",
      birthDate: "1980-03-15",
      license: "MED-2026-005",
      specs: ["Medicina General"]
    },
    {
      name: "Dra. Elena Rostova",
      email: "elena.rostova@demo.com",
      phone: "+573003734455",
      birthDate: "1980-03-15",
      license: "MED-2026-006",
      specs: ["Odontologia"]
    },
    {
      name: "Dr. Javier Herrera",
      email: "javier.herrera@demo.com",
      phone: "+573003834455",
      birthDate: "1980-03-15",
      license: "MED-2026-007",
      specs: ["Psiquiatria"]
    },
    {
      name: "Dra. Claudia Rios",
      email: "claudia.rios@demo.com",
      phone: "+573013234455",
      birthDate: "1980-03-15",
      license: "MED-2026-008",
      specs: ["Nutricion", "Medicina General"]
    }
  ];

  // Fechas base (Mañana y pasado mañana)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  for (const doc of doctorsData) {
    // A) Crear/Actualizar Cuenta de Usuario
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

    // B) Obtener el Perfil Médico vinculado
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

    // C) Crear Relaciones Médico-Especialidad
    for (const specName of doc.specs) {
      const specId = specialties[specName].id;
      await prisma.doctorSpecialty.upsert({
        where: {
          doctorId_specialtyId: {
            doctorId: doctorProfile.id,
            specialtyId: specId,
          },
        },
        update: {},
        create: {
          doctorId: doctorProfile.id,
          specialtyId: specId,
        },
      });
    }

    /*
     * 5. DISPONIBILIDADES MÚLTIPLES
     */
    const scheduleBlocks = [
      // Turnos de la Mañana
      { startH: 8, startM: 0, endH: 9, endM: 0, targetDate: tomorrow },
      { startH: 9, startM: 0, endH: 10, endM: 0, targetDate: tomorrow },
      { startH: 10, startM: 0, endH: 11, endM: 0, targetDate: tomorrow },
      { startH: 11, startM: 0, endH: 12, endM: 0, targetDate: tomorrow },
      // Turnos de la Tarde
      { startH: 14, startM: 0, endH: 15, endM: 0, targetDate: tomorrow },
      { startH: 15, startM: 0, endH: 16, endM: 0, targetDate: tomorrow },
      // Mañana del siguiente día
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
          startTime: startTime,
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

  console.log("✅ Seed completado perfectamente. Cuentas creadas sin errores.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });