
INSERT INTO doctors (id, name, department, specialization, is_active, consultation_fee, created_at, updated_at)
VALUES 
(uuid_generate_v4(), 'DR. NAVEEN', 'GYNE', 'Gynecologist', true, 500, NOW(), NOW());
