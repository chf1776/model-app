mod commands;
mod db;
mod models;
mod services;

use db::AppDb;
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data = app.path().app_data_dir().expect("Failed to get app data dir");
            let db = AppDb::new(app_data).expect("Failed to initialize database");
            app.manage(db);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::collection::list_kits,
            commands::collection::create_kit,
            commands::collection::update_kit,
            commands::collection::delete_kit,
            commands::projects::list_projects,
            commands::projects::get_project,
            commands::projects::create_project,
            commands::projects::rename_project,
            commands::projects::delete_project,
            commands::projects::set_active_project,
            commands::projects::get_active_project,
            commands::settings::get_setting,
            commands::settings::set_setting,
            commands::media::save_box_art,
            commands::media::save_accessory_image,
            commands::collection::list_kit_files,
            commands::collection::attach_kit_file,
            commands::collection::delete_kit_file,
            commands::accessories::list_accessories,
            commands::accessories::create_accessory,
            commands::accessories::update_accessory,
            commands::accessories::delete_accessory,
            commands::accessories::list_accessories_for_kit,
            commands::paints::list_paints,
            commands::paints::create_paint,
            commands::paints::update_paint,
            commands::paints::delete_paint,
            commands::palette_entries::list_paint_project_mappings,
            commands::palette_entries::set_paint_projects,
            commands::instructions::list_instruction_sources,
            commands::instructions::list_instruction_pages,
            commands::instructions::upload_instruction_pdf,
            commands::instructions::process_instruction_source,
            commands::instructions::delete_instruction_source,
            commands::instructions::set_page_rotation,
            commands::instructions::get_project_ui_state,
            commands::instructions::save_view_state,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
