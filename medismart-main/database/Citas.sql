CREATE TABLE pacientes (
	id_paciente INT PRIMARY KEY auto_increment,
    nombre VARCHAR(100)
    telefono VARCHAR(100)
);

CREATE TABLE doctores (
	id_doctor INT PRIMARY KEY auto_increment,
    nombre VARCHAR(100),
    especialidad VARCHAR(100)
);

Create table citas(
	id_cita INT PRIMARY KEY auto_increment,
    id_paciente INT,
    fecha DATE,
    hora Time,
    estado VARCHAR(20) DEFAULT 'pendiente',
    motivo Text,
    
	FOREIGN KEY (id_paciente) REFERENCES pacientes(id_paciente),
    FOREIGN KEY (id_doctor) REFERENCES doctores(id_doctor)
);

INSERT INTO citas (
    id_paciente,
    id_doctor,
    fecha,
    hora,
    motivo
)
VALUES (
    1,
    2,
    '2026-05-20',
    '14:30:00',
    'Control general'
);

SELECT 
    c.id_cita,
    p.nombre AS paciente,
    d.nombre AS doctor,
    c.fecha,
    c.hora,
    c.estado
FROM citas c
JOIN pacientes p ON c.id_paciente = p.id_paciente
JOIN doctores d ON c.id_doctor = d.id_doctor
WHERE c.fecha = CURDATE();