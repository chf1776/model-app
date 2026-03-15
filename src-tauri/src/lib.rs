mod commands;
mod db;
mod models;
mod services;
mod util;

#[cfg(target_os = "macos")]
#[macro_use]
extern crate objc;

use db::AppDb;
use tauri::Manager;

#[cfg(target_os = "macos")]
fn set_dock_icon(app: &tauri::App) {
    use cocoa::appkit::{NSApp, NSApplication, NSImage};
    use cocoa::base::nil;
    use cocoa::foundation::NSData;
    let icon_bytes = include_bytes!("../icons/128x128@2x.png");
    unsafe {
        let data = NSData::dataWithBytes_length_(
            nil,
            icon_bytes.as_ptr() as *const std::ffi::c_void,
            icon_bytes.len() as u64,
        );
        let img = NSImage::initWithData_(NSImage::alloc(nil), data);
        let ns_app = NSApp();
        ns_app.setApplicationIconImage_(img);
    }
    let _ = app; // used only to keep the signature consistent
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            let app_data = app.path().app_data_dir().expect("Failed to get app data dir");
            let db = AppDb::new(app_data).expect("Failed to initialize database");
            app.manage(db);

            #[cfg(target_os = "macos")]
            set_dock_icon(app);

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
            commands::projects::update_project,
            commands::projects::rename_project,
            commands::projects::delete_project,
            commands::projects::set_active_project,
            commands::projects::get_active_project,
            commands::settings::get_setting,
            commands::settings::set_setting,
            commands::settings::get_all_settings,
            commands::settings::get_storage_stats,
            commands::settings::export_backup,
            commands::settings::preview_backup,
            commands::settings::apply_backup,
            commands::media::save_box_art,
            commands::media::save_accessory_image,
            commands::collection::list_kit_files,
            commands::collection::attach_kit_file,
            commands::collection::delete_kit_file,
            commands::accessories::list_accessories,
            commands::accessories::create_accessory,
            commands::accessories::update_accessory,
            commands::accessories::delete_accessory,
            commands::accessories::list_accessories_for_project,
            commands::accessories::list_accessories_for_kit,
            commands::paints::list_paints,
            commands::paints::create_paint,
            commands::paints::update_paint,
            commands::paints::delete_paint,
            commands::palette_entries::list_paint_project_mappings,
            commands::palette_entries::list_paints_for_project,
            commands::palette_entries::set_paint_projects,
            commands::palette_entries::list_palette_entries,
            commands::palette_entries::create_palette_entry,
            commands::palette_entries::update_palette_entry,
            commands::palette_entries::delete_palette_entry,
            commands::palette_entries::set_palette_components,
            commands::instructions::list_instruction_sources,
            commands::instructions::list_instruction_pages,
            commands::instructions::upload_instruction_pdf,
            commands::instructions::process_instruction_source,
            commands::instructions::delete_instruction_source,
            commands::instructions::set_page_rotation,
            commands::instructions::get_project_ui_state,
            commands::instructions::save_view_state,
            commands::instructions::save_build_mode,
            commands::instructions::save_nav_mode,
            commands::instructions::save_active_track,
            commands::tracks::list_tracks,
            commands::tracks::create_track,
            commands::tracks::update_track,
            commands::tracks::delete_track,
            commands::tracks::reorder_tracks,
            commands::tracks::set_track_join_point,
            commands::steps::list_steps,
            commands::steps::list_project_steps,
            commands::steps::create_step,
            commands::steps::update_step,
            commands::steps::delete_step,
            commands::steps::delete_step_and_reorder,
            commands::steps::reorder_steps,
            commands::steps::set_step_parent,
            commands::steps::reorder_children_steps,
            commands::tags::list_tags,
            commands::tags::list_step_tags,
            commands::tags::set_step_tags,
            commands::reference_images::list_reference_images,
            commands::reference_images::add_reference_image,
            commands::reference_images::update_reference_image_caption,
            commands::reference_images::delete_reference_image,
            commands::step_relations::list_project_step_relations,
            commands::step_relations::list_step_relations,
            commands::step_relations::set_step_relations,
            commands::progress_photos::list_project_progress_photos,
            commands::progress_photos::list_progress_photos,
            commands::progress_photos::add_progress_photo,
            commands::milestone_photos::list_project_milestone_photos,
            commands::milestone_photos::add_milestone_photo,
            commands::build_log::list_build_log_entries,
            commands::build_log::add_build_log_entry,
            commands::build_log::add_build_log_photo,
            commands::drying_timers::list_drying_timers,
            commands::drying_timers::create_drying_timer,
            commands::drying_timers::delete_drying_timer,
            commands::annotations::get_annotations,
            commands::annotations::save_annotations,
            commands::step_paint_refs::list_step_paint_refs,
            commands::step_paint_refs::set_step_paint_refs,
            commands::step_paint_refs::list_project_step_paint_refs,
            commands::gallery_photos::list_gallery_photos,
            commands::gallery_photos::add_gallery_photo,
            commands::gallery_photos::update_gallery_photo_caption,
            commands::gallery_photos::delete_gallery_photo,
            commands::gallery_photos::toggle_photo_star,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
