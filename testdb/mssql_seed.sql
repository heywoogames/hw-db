-- MSSQL Seed Data for User Table

-- Disable constraints to avoid issues during data loading
ALTER TABLE [user] NOCHECK CONSTRAINT ALL;

-- Clear existing data
DELETE FROM [user];

-- Reset identity seed
DBCC CHECKIDENT ('[user]', RESEED, 0);

-- Insert 10 sample users
INSERT INTO [user] ([username], [password]) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTBpkTpt2eDJyOlLrY.MnQoAjKIJzKT2'), -- password: admin123
('user1', '$2a$10$8K1p/a7yx1qfM1QcnQVm3.LQICzu1xvY2jJAdoiPu/W5H3KvMx9JO'), -- password: pass1234
('user2', '$2a$10$vPf5XlEHODRH.F.7Ux/BYu2nN5/TwQpSb7KvWo51Ht/mO6tgvgWdO'), -- password: secure567
('john_doe', '$2a$10$ZWIUmxJ5/Lpz2Ae8QQw11e2K6DgGQWEDR.b1E7.wIfkPNYoArDMfS'), -- password: john2023
('jane_smith', '$2a$10$KgGzM6QJIRBu1Wd5CwdGJ.FPKm/L/K9kMpEGRNmncFcJEsWCxSIm2'), -- password: jane2023
('developer', '$2a$10$3sH2Lp7.Hg9BBZfnFE8fZuXWHBs0tF1K.VgQTAYfZxMlkzuJnjiXW'), -- password: dev@2023
('tester', '$2a$10$YMxW.ReUJI3eBCQDOkGGwOXSAz4PeN5xPbIWqDrP5RZ8YmVJlmFI.'), -- password: test@2023
('manager', '$2a$10$QwXRP.g9dDxW4.UYIGSJYeM0AAjhMY7APJ7eDcSMuH2tZRRF4w9Uy'), -- password: mgr@2023
('support', '$2a$10$Vc.YOXVxMWU3MiB6j8ucT.3JQ1WgmL/1E2PUJyLrUnTUZbOCf5Lry'), -- password: supp@2023
('guest', '$2a$10$YM/M9FzQA.CcI.GudOcgWeLzD9LwW46QyHE7LCrDwDGUF9K1.9Cey'); -- password: guest123

-- Re-enable constraints
ALTER TABLE [user] CHECK CONSTRAINT ALL;
