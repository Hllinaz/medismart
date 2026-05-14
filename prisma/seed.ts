import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const specialtiesData = [
  { name: "Cardiología", description: "Especialidad en corazón y sistema circulatorio" },
  { name: "Pediatría", description: "Atención médica para niños y adolescentes" },
  { name: "Dermatología", description: "Especialidad en piel, uñas y cabello" },
  { name: "Traumatología", description: "Especialidad en huesos, músculos y articulaciones" },
  { name: "Oftalmología", description: "Especialidad en ojos y visión" },
];

const doctorsData = [
  { name: "Dr. Carlos Martínez", email: "carlos.martinez@medismart.com", specialty: "Cardiología", licenseNumber: "LIC-001" },
  { name: "Dra. Ana López", email: "ana.lopez@medismart.com", specialty: "Pediatría", licenseNumber: "LIC-002" },
  { name: "Dr. Roberto Sánchez", email: "roberto.sanchez@medismart.com", specialty: "Dermatología", licenseNumber: "LIC-003" },
  { name: "Dra. María García", email: "maria.garcia@medismart.com", specialty: "Traumatología", licenseNumber: "LIC-004" },
  { name: "Dr. Juan Hernández", email: "juan.hernandez@medismart.com", specialty: "Oftalmología", licenseNumber: "LIC-005" },
];

async function main() {
  console.log("🌱 Iniciando seed...");

  const password = await bcrypt.hash("Medico123!", 12);

  const specialtyMap = new Map<string, string>();

  for (const spec of specialtiesData) {
    const existing = await prisma.specialty.upsert({
      where: { name: spec.name },
      update: { description: spec.description, isActive: true },
      create: { name: spec.name, description: spec.description, isActive: true },
    });
    specialtyMap.set(spec.name, existing.id);
    console.log(`  Especialidad: ${spec.name}`);
  }

  for (const doc of doctorsData) {
    const specialtyId = specialtyMap.get(doc.specialty);
    if (!specialtyId) {
      console.warn(`  ⚠️  Especialidad no encontrada para ${doc.specialty}, saltando...`);
      continue;
    }

    const existingUser = await prisma.user.findUnique({ where: { email: doc.email } });

    if (existingUser) {
      const profile = await prisma.doctorProfile.findUnique({ where: { userId: existingUser.id } });
      if (profile) {
        await prisma.doctorProfile.update({
          where: { id: profile.id },
          data: { specialtyId, licenseNumber: doc.licenseNumber },
        });
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { name: doc.name, isActive: true },
        });
        console.log(`  Doctor actualizado: ${doc.name}`);
        await createAvailability(profile.id);
        continue;
      }
    }

    const user = await prisma.user.create({
      data: {
        name: doc.name,
        email: doc.email,
        password,
        role: "MEDICO",
        doctorProfile: {
          create: {
            specialtyId,
            licenseNumber: doc.licenseNumber,
          },
        },
      },
      include: { doctorProfile: true },
    });

    console.log(`  Doctor creado: ${doc.name}`);
    if (user.doctorProfile) {
      await createAvailability(user.doctorProfile.id);
    }
  }

  async function createAvailability(doctorId: string) {
    const existingSlots = await prisma.doctorAvailability.count({ where: { doctorId } });
    if (existingSlots > 0) {
      console.log(`    Disponibilidad ya existe para doctor ${doctorId}, saltando...`);
      return;
    }

    const slots = [
      { dayOfWeek: 1, startTime: "09:00", endTime: "13:00" },
      { dayOfWeek: 1, startTime: "14:00", endTime: "17:00" },
      { dayOfWeek: 2, startTime: "09:00", endTime: "13:00" },
      { dayOfWeek: 2, startTime: "14:00", endTime: "17:00" },
      { dayOfWeek: 3, startTime: "09:00", endTime: "13:00" },
      { dayOfWeek: 3, startTime: "14:00", endTime: "17:00" },
      { dayOfWeek: 4, startTime: "09:00", endTime: "13:00" },
      { dayOfWeek: 4, startTime: "14:00", endTime: "17:00" },
      { dayOfWeek: 5, startTime: "09:00", endTime: "13:00" },
      { dayOfWeek: 5, startTime: "14:00", endTime: "17:00" },
    ];

    for (const slot of slots) {
      try {
        await prisma.doctorAvailability.create({
          data: { doctorId, ...slot },
        });
      } catch {
      }
    }
    console.log(`    Disponibilidad creada (Lun-Vie 9-13, 14-17)`);
  }

  console.log("✅ Seed completado exitosamente");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
