-- Create user if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'SprintPocker') THEN
    CREATE USER "SprintPocker" WITH PASSWORD 'Swaraj@99';
  END IF;
END
$$;

-- Create database (will fail if exists, but that's okay)
CREATE DATABASE sprintdb OWNER "SprintPocker";

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE sprintdb TO "SprintPocker";
