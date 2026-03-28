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
}

#[derive(Debug, Deserialize)]
struct PartEntry {
    sprue: String,
    number: Option<String>,
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

const PROMPT: &str = r#"You are analyzing a scale model instruction manual step image.
Identify all part callouts visible — these are alphanumeric labels like A14, B7, C3
that reference specific plastic parts on lettered sprues (runners).

Return a JSON object with this exact structure:
{
  "parts": [
    {"sprue": "A", "number": "14"},
    {"sprue": "B", "number": "7"}
  ]
}

Rules:
- "sprue" is the letter prefix (A, B, C, etc.)
- "number" is the numeric suffix (14, 7, 3, etc.)
- If a callout is just a letter with no number, set "number" to null
- Only include parts that are clearly labeled in the image
- Do not guess or infer parts that aren't visible
- If no part callouts are visible, return {"parts": []}"#;

/// Call the Claude Messages API with a base64-encoded image and return detected parts.
pub fn detect_parts(
    api_key: &str,
    model: &str,
    image_base64: &str,
) -> Result<Vec<DetectedPart>, String> {
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
                    "text": PROMPT,
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

    Ok(result
        .parts
        .into_iter()
        .map(|p| DetectedPart {
            sprue: p.sprue.to_uppercase(),
            number: p.number,
        })
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
