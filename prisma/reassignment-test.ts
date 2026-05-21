import { PrismaClient, Priority } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const TEST_TAG = "REASSIGNMENT_TEST";

function addDays(days: number, hour: number, minute = 0) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(hour, minute, 0, 0);
    return date;
}

async function cleanup() {
    console.log("🧹 Eliminando datos artificiales...");

    const users = await prisma.user.findMany({
        where: {
            email: {
                contains: "@reassignment-test.com",
            },
        },
        select: { id: true },
    });

    const userIds = users.map((u) => u.id);

    await prisma.notification.deleteMany({
        where: {
            userId: { in: userIds },
        },
    });

    await prisma.appointment.deleteMany({
        where: {
            patient: {
                user: {
                    email: {
                        contains: "@reassignment-test.com",
                    },
                },
            },
        },
    });

    await prisma.availability.deleteMany({
        where: {
            doctor: {
                user: {
                    email: {
                        contains: "@reassignment-test.com",
                    },
                },
            },
        },
    });

    await prisma.doctorSpecialty.deleteMany({
        where: {
            doctor: {
                user: {
                    email: {
                        contains: "@reassignment-test.com",
                    },
                },
            },
        },
    });

    await prisma.patientProfile.deleteMany({
        where: {
            user: {
                email: {
                    contains: "@reassignment-test.com",
                },
            },
        },
    });

    await prisma.doctorProfile.deleteMany({
        where: {
            user: {
                email: {
                    contains: "@reassignment-test.com",
                },
            },
        },
    });

    await prisma.user.deleteMany({
        where: {
            email: {
                contains: "@reassignment-test.com",
            },
        },
    });

    console.log("✅ Datos artificiales eliminados.");
}

async function setup() {
    await cleanup();

    const password = await bcrypt.hash("password123", 10);

    console.log("🌱 Creando escenario artificial de reasignación...");

    const specialty = await prisma.specialty.upsert({
        where: { name: "Medicina General" },
        update: {},
        create: {
            name: "Medicina General",
            description: "Especialidad de prueba para reasignación",
        },
    });

    const doctorAUser = await prisma.user.create({
        data: {
            name: "Dr. Cancelador Test",
            email: "doctor.cancelador@reassignment-test.com",
            password: password,
            role: "MEDICO",
        },
    });

    const doctorA = await prisma.doctorProfile.create({
        data: {
            userId: doctorAUser.id,
            licenseNumber: `${TEST_TAG}-A`,
        },
    });

    const doctorBUser = await prisma.user.create({
        data: {
            name: "Dra. Reasignadora Test",
            email: "doctor.reasignadora@reassignment-test.com",
            password: password,
            role: "MEDICO",
        },
    });

    const doctorB = await prisma.doctorProfile.create({
        data: {
            userId: doctorBUser.id,
            licenseNumber: `${TEST_TAG}-B`,
        },
    });

    await prisma.doctorSpecialty.createMany({
        data: [
            { doctorId: doctorA.id, specialtyId: specialty.id },
            { doctorId: doctorB.id, specialtyId: specialty.id },
        ],
    });

    const patientsData = [
        {
            name: "Paciente Alta Prioridad",
            email: "paciente.high@reassignment-test.com",
            priority: Priority.HIGH,
            hour: 8,
        },
        {
            name: "Paciente Prioridad Normal",
            email: "paciente.normal@reassignment-test.com",
            priority: Priority.NORMAL,
            hour: 9,
        },
        {
            name: "Paciente Baja Prioridad",
            email: "paciente.low@reassignment-test.com",
            priority: Priority.LOW,
            hour: 10,
        },
    ];

    for (const item of patientsData) {
        const user = await prisma.user.create({
            data: {
                name: item.name,
                email: item.email,
                password: password,
                role: "PACIENTE",
            },
        });

        const patient = await prisma.patientProfile.create({
            data: {
                userId: user.id,
            },
        });

        const oldStart = addDays(1, item.hour);
        const oldEnd = addDays(1, item.hour + 1);

        const oldAvailability = await prisma.availability.create({
            data: {
                doctorId: doctorA.id,
                date: oldStart,
                startTime: oldStart,
                endTime: oldEnd,
                isBooked: false,
            },
        });

        await prisma.appointment.create({
            data: {
                patientId: patient.id,
                doctorId: doctorA.id,
                availabilityId: oldAvailability.id,
                appointmentDate: oldStart,
                status: "PENDING_REASSIGNMENT",
                priority: item.priority,
            },
        });
    }

    const futureHours = [8, 9, 10];

    for (const hour of futureHours) {
        const start = addDays(3, hour);
        const end = addDays(3, hour + 1);

        await prisma.availability.create({
            data: {
                doctorId: doctorB.id,
                date: start,
                startTime: start,
                endTime: end,
                isBooked: false,
            },
        });
    }

    console.log("✅ Escenario creado.");
    console.log("");
    console.log("Usuarios de prueba:");
    console.log("- doctor.cancelador@reassignment-test.com");
    console.log("- doctor.reasignadora@reassignment-test.com");
    console.log("- paciente.high@reassignment-test.com");
    console.log("- paciente.normal@reassignment-test.com");
    console.log("- paciente.low@reassignment-test.com");
}

async function status() {
    const appointments = await prisma.appointment.findMany({
        where: {
            patient: {
                user: {
                    email: {
                        contains: "@reassignment-test.com",
                    },
                },
            },
        },
        include: {
            patient: {
                include: { user: true },
            },
            doctor: {
                include: { user: true },
            },
            availability: true,
        },
        orderBy: [
            { priority: "desc" },
            { appointmentDate: "asc" },
        ],
    });

    console.table(
        appointments.map((a) => ({
            paciente: a.patient.user.name,
            medico: a.doctor.user.name,
            status: a.status,
            priority: a.priority,
            fecha: a.appointmentDate.toLocaleString(),
            availabilityBooked: a.availability?.isBooked,
        }))
    );
}

async function main() {
    const action = process.argv[2];

    if (action === "setup") {
        await setup();
        return;
    }

    if (action === "cleanup") {
        await cleanup();
        return;
    }

    if (action === "status") {
        await status();
        return;
    }

    console.log("Uso:");
    console.log("npx tsx prisma/reassignment-test.ts setup");
    console.log("npx tsx prisma/reassignment-test.ts status");
    console.log("npx tsx prisma/reassignment-test.ts cleanup");
}

main()
    .catch((error) => {
        console.error("❌ Error:", error);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });