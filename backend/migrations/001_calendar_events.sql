-- Sistema de Calendarios y Eventos
-- Ejecutar en admin_capuchinos

CREATE TABLE IF NOT EXISTS calendars (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    description     TEXT NULL,
    color           VARCHAR(20) DEFAULT '#465fff',
    status          TINYINT NOT NULL DEFAULT 1,
    created_by      INT NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_calendars_status (status, created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS calendar_assignments (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    calendar_id     INT NOT NULL,
    assigned_type   TINYINT NOT NULL COMMENT '0=todos, 1=fraternidad, 2=grupo, 3=hermano',
    assigned_id     INT NOT NULL DEFAULT 0,
    status          TINYINT NOT NULL DEFAULT 1,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_calendar_assignments_lookup (calendar_id, assigned_type, assigned_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS events (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    calendar_id         INT NOT NULL,
    title               VARCHAR(255) NOT NULL,
    description         TEXT NULL,
    location            VARCHAR(255) NULL,
    start_at            DATETIME NOT NULL,
    end_at              DATETIME NOT NULL,
    all_day             TINYINT NOT NULL DEFAULT 0,
    is_recurring        TINYINT NOT NULL DEFAULT 0,
    recurrence_rule     ENUM('daily','weekly','monthly','yearly') NULL,
    recurrence_interval INT NOT NULL DEFAULT 1,
    recurrence_end_date DATE NULL,
    recurrence_count    INT NULL,
    recurrence_days     VARCHAR(20) NULL COMMENT 'semanal: 0=dom,1=lun,...',
    status              TINYINT NOT NULL DEFAULT 1,
    created_by          INT NOT NULL,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_events_calendar_dates (calendar_id, start_at, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS event_exceptions (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    event_id            INT NOT NULL,
    original_start_at   DATETIME NOT NULL,
    exception_type      ENUM('deleted','modified') NOT NULL,
    override_title      VARCHAR(255) NULL,
    override_description TEXT NULL,
    override_location   VARCHAR(255) NULL,
    override_start_at   DATETIME NULL,
    override_end_at     DATETIME NULL,
    override_all_day    TINYINT NULL,
    status              TINYINT NOT NULL DEFAULT 1,
    created_by          INT NOT NULL,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_event_exception (event_id, original_start_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS event_reminders (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    event_id            INT NOT NULL,
    remind_before_minutes INT NOT NULL,
    status              TINYINT NOT NULL DEFAULT 1,
    INDEX idx_event_reminders_event (event_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS event_reminder_logs (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    event_id            INT NOT NULL,
    instance_start_at   DATETIME NOT NULL,
    user_id             INT NOT NULL,
    remind_before_minutes INT NOT NULL,
    notification_id     INT NULL,
    sent_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_reminder_sent (event_id, instance_start_at, user_id, remind_before_minutes)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
