use base64::Engine;
use image::GenericImageView;
use serde::Deserialize;
use std::io::Cursor;

pub const INVALID_API_KEY: &str = "invalid_api_key";

const API_URL: &str = "https://api.anthropic.com/v1/messages";
const API_VERSION: &str = "2023-06-01";

fn anthropic_post(
    api_key: &str,
    body: &serde_json::Value,
    timeout_secs: u64,
) -> Result<reqwest::blocking::Response, String> {
    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(timeout_secs))
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {e}"))?;

    client
        .post(API_URL)
        .header("x-api-key", api_key)
        .header("anthropic-version", API_VERSION)
        .header("content-type", "application/json")
        .body(serde_json::to_string(body).unwrap())
        .send()
        .map_err(|e| format!("API request failed: {e}"))
}

#[derive(Debug, Clone)]
pub struct DetectedPart {
    pub sprue: String,
    pub number: Option<String>,
    pub quantity: i32,
}

#[derive(Debug, Deserialize)]
struct PartEntry {
    sprue: String,
    number: Option<String>,
    #[serde(default = "default_one")]
    quantity: i32,
}

fn default_one() -> i32 {
    1
}

#[derive(Debug, Deserialize)]
struct DetectionResult {
    parts: Vec<PartEntry>,
}

/// Crop a region from a PNG file and return it as a base64-encoded PNG string.
pub fn crop_and_encode(
    page_path: &str,
    crop_x: f64,
    crop_y: f64,
    crop_w: f64,
    crop_h: f64,
) -> Result<String, String> {
    let img = image::open(page_path).map_err(|e| format!("Failed to open image: {e}"))?;
    let (img_w, img_h) = img.dimensions();

    // Clamp crop region to image bounds
    let x = (crop_x as u32).min(img_w.saturating_sub(1));
    let y = (crop_y as u32).min(img_h.saturating_sub(1));
    let w = (crop_w as u32).min(img_w.saturating_sub(x)).max(1);
    let h = (crop_h as u32).min(img_h.saturating_sub(y)).max(1);

    let cropped = img.crop_imm(x, y, w, h);

    // Encode cropped image to PNG bytes
    let mut buf = Cursor::new(Vec::new());
    cropped
        .write_to(&mut buf, image::ImageFormat::Png)
        .map_err(|e| format!("Failed to encode cropped image: {e}"))?;

    let b64 = base64::engine::general_purpose::STANDARD.encode(buf.into_inner());
    Ok(b64)
}

fn build_prompt(known_sprues: &[String]) -> String {
    format!(
        r#"You are analyzing a scale model instruction manual step image.
Identify all part callouts visible — these are alphanumeric labels like A14, B7, C3
that reference specific plastic parts on lettered sprues (runners).

The sprues for this project are: {}
ONLY identify parts from these sprues. Any label that does not start with one of these exact sprue letters/names is NOT a part callout.

Do NOT include:
- Paint/color codes (Tamiya, Gunze, Humbrol, Vallejo, FS, RAL references)
- Step numbers, sub-step letters, or diagram sequence labels
- Adhesive, cement, or tool references
- Measurement or scale annotations
- Decal sheet references

IMPORTANT — Quantity detection:
Pay close attention to quantity indicators next to each part callout. Scale model instructions show quantity in several ways:
- A multiplication symbol: "×2", "x2", "X2", "× 2"
- Parenthesized number: "(2)", "(x2)"
- The same part callout label appearing multiple times in the diagram (e.g. two separate "B7" labels pointing to different locations means quantity 2)
Always set "quantity" to the correct count. Default is 1 if no indicator is present.

Return a JSON object with this exact structure:
{{
  "parts": [
    {{"sprue": "A", "number": "14", "quantity": 1}},
    {{"sprue": "B", "number": "7", "quantity": 2}}
  ]
}}

Rules:
- "sprue" must exactly match one of the known sprue labels listed above
- "number" is the numeric suffix (14, 7, 3, etc.)
- "quantity" is required — count how many of each part are used in this step (default 1)
- If a callout is just a sprue letter with no number, set "number" to null
- Only include each unique part ONCE — use "quantity" for duplicates instead of repeating entries
- Only include parts that are clearly labeled in the image
- Do not guess or infer parts that aren't visible
- If no part callouts are visible, return {{"parts": []}}"#,
        known_sprues.join(", "),
    )
}

/// Call the Claude Messages API with a base64-encoded image and return detected parts.
/// Detection is constrained to `known_sprues` labels only.
pub fn detect_parts(
    api_key: &str,
    model: &str,
    image_base64: &str,
    known_sprues: &[String],
) -> Result<Vec<DetectedPart>, String> {
    let prompt = build_prompt(known_sprues);

    let body = serde_json::json!({
        "model": model,
        "max_tokens": 1024,
        "messages": [{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/png",
                        "data": image_base64,
                    }
                },
                {
                    "type": "text",
                    "text": prompt,
                }
            ]
        }]
    });

    let response = anthropic_post(api_key, &body, 30)?;

    let status = response.status();
    let response_text = response.text().map_err(|e| format!("Failed to read response: {e}"))?;

    if status == reqwest::StatusCode::UNAUTHORIZED {
        return Err(INVALID_API_KEY.to_string());
    }
    if !status.is_success() {
        return Err(format!("API error ({status}): {response_text}"));
    }

    // Parse the Claude response — extract the text content block
    let resp: serde_json::Value =
        serde_json::from_str(&response_text).map_err(|e| format!("Failed to parse response JSON: {e}"))?;

    let text = resp["content"]
        .as_array()
        .and_then(|blocks| {
            blocks.iter().find_map(|b| {
                if b["type"].as_str() == Some("text") {
                    b["text"].as_str().map(|s| s.to_string())
                } else {
                    None
                }
            })
        })
        .ok_or_else(|| "No text content in API response".to_string())?;

    // Extract JSON from the response text (may be wrapped in markdown code fences)
    let json_str = extract_json(&text)?;

    let result: DetectionResult =
        serde_json::from_str(&json_str).map_err(|e| format!("Failed to parse detection result: {e}"))?;

    // Safety net: filter to known sprues in case the LLM returns unexpected labels
    let known_set: std::collections::HashSet<String> =
        known_sprues.iter().map(|s| s.to_uppercase()).collect();

    Ok(result
        .parts
        .into_iter()
        .map(|p| DetectedPart {
            sprue: p.sprue.to_uppercase(),
            number: p.number,
            quantity: p.quantity.max(1),
        })
        .filter(|p| known_set.contains(&p.sprue))
        .collect())
}

/// Validate an API key by sending a minimal request.
pub fn test_api_key(api_key: &str, model: &str) -> Result<(), String> {
    let body = serde_json::json!({
        "model": model,
        "max_tokens": 1,
        "messages": [{ "role": "user", "content": "hi" }]
    });

    let response = anthropic_post(api_key, &body, 15)?;

    if response.status() == reqwest::StatusCode::UNAUTHORIZED {
        return Err(INVALID_API_KEY.to_string());
    }
    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().unwrap_or_default();
        return Err(format!("API error ({status}): {text}"));
    }
    Ok(())
}

/// Extract JSON from text that may be wrapped in markdown code fences.
fn extract_json(text: &str) -> Result<String, String> {
    let trimmed = text.trim();

    // Try direct parse first
    if trimmed.starts_with('{') {
        return Ok(trimmed.to_string());
    }

    // Try extracting from ```json ... ``` or ``` ... ```
    if let Some(start) = trimmed.find('{') {
        if let Some(end) = trimmed.rfind('}') {
            return Ok(trimmed[start..=end].to_string());
        }
    }

    Err("Could not find JSON in response".to_string())
}
