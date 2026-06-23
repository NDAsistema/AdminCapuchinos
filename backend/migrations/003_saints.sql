-- Módulo de Santos y Beatos

CREATE TABLE IF NOT EXISTS saints (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    content         LONGTEXT NULL,
    date_birth      DATE NULL,
    date_death      DATE NULL,
    type            TINYINT NOT NULL COMMENT '1=Santo, 2=Beato',
    img             VARCHAR(255) NULL,
    status          TINYINT NOT NULL DEFAULT 1,
    created_by      INT NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_saints_status (status, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS saint_attachments (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    url             VARCHAR(500) NOT NULL,
    filename        VARCHAR(255) NULL,
    id_saint        INT NULL,
    status          ENUM('temp', 'active') NOT NULL DEFAULT 'temp',
    created_by      INT NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_saint_attachments_saint (id_saint, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
