import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  const password = await bcrypt.hash("password123", 10);

  /*
   * ADMIN
   */
  await prisma.user.upsert({
    where: {
      email: "admin@demo.com",
    },

    update: {},

    create: {
      name: "Admin Demo",
      email: "admin@demo.com",
      password,
      role: Role.ADMIN,
    },
  });

  /*
   * PACIENTE
   */
  await prisma.user.upsert({
    where: {
      email: "paciente@demo.com",
    },

    update: {},

    create: {
      name: "Paciente Demo",
      email: "paciente@demo.com",
      password,
      role: Role.PACIENTE,

      patientProfile: {
        create: {},
      },
    },
  });

  /*
   * MEDICO
   */
  const doctorUser = await prisma.user.upsert({
    where: {
      email: "medico@demo.com",
    },

    update: {},

    create: {
      name: "Dr. Carlos Ramirez",
      email: "medico@demo.com",
      password,
      role: Role.MEDICO,

      doctorProfile: {
        create: {
          licenseNumber: "MED-2026-001",
        },
      },
    },
  });

  /*
   * ESPECIALIDADES
   */
  const cardiology = await prisma.specialty.upsert({
    where: {
      name: "Cardiologia",
    },

    update: {},

    create: {
      name: "Cardiologia",
      description: "Especialidad cardiologica",
    },
  });

  const dermatology = await prisma.specialty.upsert({
    where: {
      name: "Dermatologia",
    },

    update: {},

    create: {
      name: "Dermatologia",
      description: "Especialidad dermatologica",
    },
  });

  /*
   * PERFIL MEDICO
   */
  const doctorProfile =
    await prisma.doctorProfile.findUnique({
      where: {
        userId: doctorUser.id,
      },
    });

  if (!doctorProfile) {
    throw new Error(
      "No se encontro el perfil medico"
    );
  }

  /*
   * RELACION MEDICO-ESPECIALIDAD
   */
  await prisma.doctorSpecialty.upsert({
    where: {
      doctorId_specialtyId: {
        doctorId: doctorProfile.id,
        specialtyId: cardiology.id,
      },
    },

    update: {},

    create: {
      doctorId: doctorProfile.id,
      specialtyId: cardiology.id,
    },
  });

  await prisma.doctorSpecialty.upsert({
    where: {
      doctorId_specialtyId: {
        doctorId: doctorProfile.id,
        specialtyId: dermatology.id,
      },
    },

    update: {},

    create: {
      doctorId: doctorProfile.id,
      specialtyId: dermatology.id,
    },
  });

  /*
   * DISPONIBILIDAD
   */
  const tomorrow = new Date();

  tomorrow.setDate(tomorrow.getDate() + 1);

  const startTime = new Date(tomorrow);

  startTime.setHours(9, 0, 0, 0);

  const endTime = new Date(tomorrow);

  endTime.setHours(10, 0, 0, 0);

  await prisma.availability.create({
    data: {
      doctorId: doctorProfile.id,
      date: tomorrow,
      startTime,
      endTime,
    },
  });

  console.log("✅ Seed completado");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });