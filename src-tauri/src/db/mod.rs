pub mod queries;

use refinery::embed_migrations;
use rusqlite::Connection;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

embed_migrations!("migrations");

pub struct AppDb {
    pub conn: Mutex<Connection>,
}

impl AppDb {
    pub fn new(app_data_dir: PathBuf) -> Result<Self, String> {
        let db_dir = app_data_dir.join("model-builder");
        fs::create_dir_all(&db_dir).map_err(|e| format!("Failed to create db dir: {e}"))?;

        // Also create the stash directory for images
        let stash_dir = db_dir.join("stash");
        fs::create_dir_all(&stash_dir).map_err(|e| format!("Failed to create stash dir: {e}"))?;

        let db_path = db_dir.join("db.sqlite");
        let mut conn =
            Connection::open(&db_path).map_err(|e| format!("Failed to open database: {e}"))?;

        // Enable WAL mode and foreign keys
        conn.execute_batch(
            "PRAGMA journal_mode = WAL;
             PRAGMA foreign_keys = ON;",
        )
        .map_err(|e| format!("Failed to set pragmas: {e}"))?;

        // Run migrations
        migrations::runner()
            .run(&mut conn)
            .map_err(|e| format!("Failed to run migrations: {e}"))?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    pub fn conn(&self) -> Result<std::sync::MutexGuard<'_, Connection>, String> {
        self.conn.lock().map_err(|e| e.to_string())
    }

    pub fn stash_dir(app_data_dir: &PathBuf) -> PathBuf {
        app_data_dir.join("model-builder").join("stash")
    }
}
